import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { amortizacion, pagos } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prestamoId = parseInt(params.id);

    // Get the last payment made for this loan
    const lastPayment = await db
      .select({ quincenaNum: pagos.quincenaNum })
      .from(pagos)
      .where(eq(pagos.prestamoId, prestamoId))
      .orderBy(desc(pagos.quincenaNum))
      .limit(1);

    // Next payment number is last payment + 1, or 1 if no payments
    const nextPaymentNum = lastPayment.length > 0 && lastPayment[0].quincenaNum
      ? lastPayment[0].quincenaNum + 1
      : 1;

    // Get the cuota amount from amortizacion table
    const amortRow = await db
      .select({ cuotaQuincenal: amortizacion.cuotaQuincenal })
      .from(amortizacion)
      .where(and(
        eq(amortizacion.prestamoId, prestamoId),
        eq(amortizacion.quincenaNum, nextPaymentNum)
      ))
      .limit(1);

    const cuotaAmount = amortRow.length > 0 ? amortRow[0].cuotaQuincenal : '0.00';

    return NextResponse.json({
      nextPaymentNum,
      cuotaAmount
    });
  } catch (error) {
    console.error('Error fetching next payment info:', error);
    return NextResponse.json({ error: 'Failed to fetch next payment info' }, { status: 500 });
  }
}