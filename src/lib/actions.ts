'use server';

import { db } from './db';
import { persons, solicitudes, prestamos, amortizacion, companies, pagos } from './schema';
import { eq, and, asc } from 'drizzle-orm';
import { generateFrenchAmortization } from './amortization';
import { revalidatePath } from 'next/cache';

export async function approveSolicitud(formData: FormData) {
  const solicitudId = parseInt(formData.get('solicitudId') as string);
  const interesDeseado = parseFloat(formData.get('interesDeseado') as string);
  const proximoPagoStr = formData.get('proximoPago') as string;
  const companyId = formData.get('companyId') ? parseInt(formData.get('companyId') as string) : null;
  const proximoPago = new Date(proximoPagoStr);

  // Fetch solicitud
  const solicitud = await db.query.solicitudes.findFirst({
    where: eq(solicitudes.id, solicitudId),
    with: {
      person: true,
    },
  });

  if (!solicitud) throw new Error('Solicitud not found');

  // Update person's company if provided
  if (companyId) {
    await db.update(persons).set({ companyId }).where(eq(persons.id, solicitud.personId));
  }

  const principal = parseFloat(solicitud.montoSolicitado);
  const totalQuincenas = solicitud.duracionMeses * 2;

  const amortRows = generateFrenchAmortization(principal, interesDeseado, totalQuincenas, proximoPago);

  // Create prestamo
  const [prestamo] = await db.insert(prestamos).values({
    solicitudId,
    principal: principal.toFixed(2),
    interesTotal: interesDeseado.toFixed(2),
    cuotaQuincenal: ((principal + interesDeseado) / totalQuincenas).toFixed(2),
    totalQuincenas,
    proximoPago: proximoPago.toISOString().split('T')[0],
    saldoPendiente: principal.toFixed(2),
  }).returning();

  // Insert amort rows
  await db.insert(amortizacion).values(
    amortRows.map(row => ({
      prestamoId: prestamo.id,
      ...row
    }))
  );

  // Update solicitud estado
  await db.update(solicitudes).set({ estado: 'aprobada' }).where(eq(solicitudes.id, solicitudId));

  revalidatePath('/dashboard');
  revalidatePath('/solicitudes');
}

export async function addCompany(name: string) {
  await db.insert(companies).values({
    name,
  });
  revalidatePath('/companies');
}

export async function recordPayment(prestamoId: number, quincenaNum: number, amount: number, paymentDate: Date) {
  // Insert payment record
  await db.insert(pagos).values({
    prestamoId,
    quincenaNum,
    fechaPago: paymentDate.toISOString().split('T')[0],
    montoPagado: amount.toFixed(2),
  });

  // Update amortization table to mark as paid
  await db.update(amortizacion)
    .set({ estado: 'pagada' })
    .where(and(
      eq(amortizacion.prestamoId, prestamoId),
      eq(amortizacion.quincenaNum, quincenaNum)
    ));

  // Get the capital from this amortization row
  const amortRow = await db.query.amortizacion.findFirst({
    where: and(
      eq(amortizacion.prestamoId, prestamoId),
      eq(amortizacion.quincenaNum, quincenaNum)
    ),
  });

  // Update prestamo saldo_pendiente and proximo_pago
  const prestamo = await db.query.prestamos.findFirst({
    where: eq(prestamos.id, prestamoId),
  });

  if (prestamo && amortRow) {
    // Subtract the capital portion (not the full payment which includes interest)
    const capitalPaid = parseFloat(amortRow.capital);
    const newSaldo = Math.max(0, parseFloat(prestamo.saldoPendiente) - capitalPaid);
    
    // Check if all amortization rows are paid to determine completion
    const unpaidRows = await db
      .select()
      .from(amortizacion)
      .where(and(
        eq(amortizacion.prestamoId, prestamoId),
        eq(amortizacion.estado, 'pendiente')
      ))
      .orderBy(asc(amortizacion.quincenaNum));
    
    const isCompleted = unpaidRows.length === 0;
    const nextProximoPago = unpaidRows[0]?.fechaQuincena || null;
    
    await db.update(prestamos)
      .set({
        saldoPendiente: newSaldo.toFixed(2),
        proximoPago: nextProximoPago || prestamo.proximoPago,
        estado: isCompleted ? 'completada' : 'activa'
      })
      .where(eq(prestamos.id, prestamoId));
  }

  revalidatePath('/dashboard');
  revalidatePath('/prestamos');
  revalidatePath('/payments');
}

export async function declineSolicitud(solicitudId: number) {
  // Update solicitud estado to rechazada
  await db.update(solicitudes).set({ estado: 'rechazada' }).where(eq(solicitudes.id, solicitudId));

  // Create a prestamo record with estado rechazada
  const solicitud = await db.query.solicitudes.findFirst({
    where: eq(solicitudes.id, solicitudId),
    with: { person: true },
  });

  if (solicitud) {
    await db.insert(prestamos).values({
      solicitudId,
      principal: solicitud.montoSolicitado,
      interesTotal: '0.00',
      cuotaQuincenal: '0.00',
      totalQuincenas: 0,
      proximoPago: new Date().toISOString().split('T')[0],
      saldoPendiente: '0.00',
      estado: 'rechazada',
    });
  }

  revalidatePath('/solicitudes');
  revalidatePath('/dashboard');
}

export async function deletePrestamo(prestamoId: number) {
  await db.delete(prestamos).where(eq(prestamos.id, prestamoId));
  await db.delete(amortizacion).where(eq(amortizacion.prestamoId, prestamoId));
  revalidatePath('/dashboard');
  revalidatePath('/prestamos');
}