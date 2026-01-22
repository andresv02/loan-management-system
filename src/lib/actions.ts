'use server';

import { db } from './db';
import { persons, solicitudes, prestamos, amortizacion, companies, pagos } from './schema';
import { eq, and, asc } from 'drizzle-orm';
import { generateFrenchAmortization } from './amortization';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
  revalidatePath('/', 'layout');
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

export async function revertPayment(prestamoId: number, quincenaNum: number) {
  // 1. Get the amortization row to know the capital amount
  const amortRow = await db.query.amortizacion.findFirst({
    where: and(
      eq(amortizacion.prestamoId, prestamoId),
      eq(amortizacion.quincenaNum, quincenaNum)
    ),
  });

  if (!amortRow) throw new Error('Amortization row not found');

  // 2. Delete the payment record
  await db.delete(pagos).where(and(
    eq(pagos.prestamoId, prestamoId),
    eq(pagos.quincenaNum, quincenaNum)
  ));

  // 3. Update amortization status back to 'pendiente'
  await db.update(amortizacion)
    .set({ estado: 'pendiente' })
    .where(and(
      eq(amortizacion.prestamoId, prestamoId),
      eq(amortizacion.quincenaNum, quincenaNum)
    ));

  // 4. Update prestamo balance and status
  const prestamo = await db.query.prestamos.findFirst({
    where: eq(prestamos.id, prestamoId),
  });

  if (prestamo) {
    const capitalReverted = parseFloat(amortRow.capital);
    const currentSaldo = parseFloat(prestamo.saldoPendiente);
    const newSaldo = currentSaldo + capitalReverted;

    // Find the earliest unpaid installment (which is now this one or an earlier one)
    const unpaidRows = await db
      .select()
      .from(amortizacion)
      .where(and(
        eq(amortizacion.prestamoId, prestamoId),
        eq(amortizacion.estado, 'pendiente')
      ))
      .orderBy(asc(amortizacion.quincenaNum));
    
    const nextProximoPago = unpaidRows[0]?.fechaQuincena || prestamo.proximoPago;

    await db.update(prestamos)
      .set({
        saldoPendiente: newSaldo.toFixed(2),
        proximoPago: nextProximoPago,
        estado: 'activa', // Always revert to active if we are undoing a payment
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
  revalidatePath('/', 'layout');
}

export async function deletePrestamo(prestamoId: number) {
  await db.delete(prestamos).where(eq(prestamos.id, prestamoId));
  await db.delete(amortizacion).where(eq(amortizacion.prestamoId, prestamoId));
  revalidatePath('/dashboard');
  revalidatePath('/prestamos');
}

export async function createDirectLoan(formData: FormData) {
  const cedula = formData.get('cedula') as string;
  const nombre = formData.get('nombre') as string;
  const apellido = formData.get('apellido') as string;
  const email = formData.get('email') as string;
  const telefono = formData.get('telefono') as string;
  const direccion = formData.get('direccion') as string;
  const salarioMensual = formData.get('salarioMensual') as string;
  const mesesEnEmpresa = parseInt(formData.get('mesesEnEmpresa') as string) || 0;
  const inicioContrato = formData.get('inicioContrato') as string;
  
  const montoSolicitado = formData.get('montoSolicitado') as string;
  const duracionMeses = parseInt(formData.get('duracionMeses') as string);
  const banco = formData.get('banco') as string;
  const tipoCuentaBancaria = formData.get('tipoCuentaBancaria') as string;
  const numeroCuenta = formData.get('numeroCuenta') as string;
  const empresa = formData.get('empresa') as string;
  const companyId = formData.get('companyId') ? parseInt(formData.get('companyId') as string) : null;

  const interesDeseado = parseFloat(formData.get('interesDeseado') as string);
  const proximoPagoStr = formData.get('proximoPago') as string;
  const proximoPago = new Date(proximoPagoStr);

  // Handle file upload
  const fotoCedulaFile = formData.get('fotoCedula') as File;
  let fotoCedula: string[] = [];

  if (fotoCedulaFile && fotoCedulaFile.size > 0) {
    const buffer = Buffer.from(await fotoCedulaFile.arrayBuffer());
    const filename = `${Date.now()}-${fotoCedulaFile.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      fotoCedula = [`/uploads/${filename}`];
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  // Find or create person
  let person = await db.query.persons.findFirst({
    where: eq(persons.cedula, cedula),
  });

  if (!person) {
    [person] = await db.insert(persons).values({
      cedula,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      salarioMensual: salarioMensual || '0',
      mesesEnEmpresa,
      inicioContrato: inicioContrato || null,
      companyId,
    }).returning();
  } else {
    // Update existing person info
    [person] = await db.update(persons).set({
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      salarioMensual: salarioMensual || '0',
      mesesEnEmpresa,
      inicioContrato: inicioContrato || null,
      companyId: companyId || person.companyId,
    }).where(eq(persons.id, person.id)).returning();
  }

  // Create solicitud (Approved)
  const [solicitud] = await db.insert(solicitudes).values({
    personId: person.id,
    montoSolicitado,
    duracionMeses,
    tipoCuentaBancaria,
    numeroCuenta,
    banco,
    empresa,
    fotoCedula,
    estado: 'aprobada',
  }).returning();

  // Calculate Amortization
  const principal = parseFloat(montoSolicitado);
  const totalQuincenas = duracionMeses * 2;
  const amortRows = generateFrenchAmortization(principal, interesDeseado, totalQuincenas, proximoPago);

  // Create prestamo
  const [prestamo] = await db.insert(prestamos).values({
    solicitudId: solicitud.id,
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

  revalidatePath('/prestamos');
  revalidatePath('/dashboard');
}