import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prestamos, persons, solicitudes } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch loans with estado 'activa' (note: 'atrasada' is computed, not in DB)
    const activeLoans = await db
      .select({
        id: prestamos.id,
        principal: prestamos.principal,
        cuotaQuincenal: prestamos.cuotaQuincenal,
        saldoPendiente: prestamos.saldoPendiente,
        proximoPago: prestamos.proximoPago,
        totalQuincenas: prestamos.totalQuincenas,
        estado: prestamos.estado,
        cedula: persons.cedula,
        nombre: persons.nombre,
        apellido: persons.apellido,
        montoSolicitado: solicitudes.montoSolicitado,
      })
      .from(prestamos)
      .innerJoin(solicitudes, eq(prestamos.solicitudId, solicitudes.id))
      .innerJoin(persons, eq(solicitudes.personId, persons.id))
      .where(eq(prestamos.estado, 'activa'));

    return NextResponse.json(activeLoans);
  } catch (error) {
    console.error('Error fetching active loans:', error);
    return NextResponse.json({ error: 'Failed to fetch active loans' }, { status: 500 });
  }
}