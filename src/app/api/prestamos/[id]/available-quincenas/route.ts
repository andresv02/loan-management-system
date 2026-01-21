import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { amortizacion } from '@/lib/schema';
import { eq, ne, asc, and } from 'drizzle-orm';
import { getEffectiveEstado } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prestamoId = parseInt(params.id);

    const unpaidAmort = await db
      .select({
        quincenaNum: amortizacion.quincenaNum,
        cuotaQuincenal: amortizacion.cuotaQuincenal,
        fechaQuincena: amortizacion.fechaQuincena,
        estado: amortizacion.estado,
      })
      .from(amortizacion)
      .where(
        and(
          eq(amortizacion.prestamoId, prestamoId),
          ne(amortizacion.estado, 'pagada')
        )
      )
      .orderBy(asc(amortizacion.quincenaNum));

    // Add effective estado (including computed "atrasada")
    const enrichedAmort = unpaidAmort.map(row => ({
      quincenaNum: row.quincenaNum,
      cuotaQuincenal: row.cuotaQuincenal,
      fechaQuincena: row.fechaQuincena,
      estado: row.estado,
      effectiveEstado: getEffectiveEstado(row.estado, row.fechaQuincena),
    }));

    return NextResponse.json(enrichedAmort);
  } catch (error) {
    console.error('Error fetching available quincenas:', error);
    return NextResponse.json({ error: 'Failed to fetch available quincenas' }, { status: 500 });
  }
}