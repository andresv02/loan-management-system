import { db } from '@/lib/db';
import { prestamos, amortizacion } from '@/lib/schema';
import { eq, and, asc, lte } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

const CACHE_KEY = 'payments:projections';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthFilter = searchParams.get('month'); // optional YYYY-MM filter

  // Try cache first (even for filtered requests, we filter in memory)
  const cached = getCache<{ projections: any[]; totals: any }>(CACHE_KEY);
  if (cached) {
    let projections = cached.projections;
    if (monthFilter) {
      projections = projections.filter((p) => p.monthKey === monthFilter);
    }
    const totals = projections.reduce(
      (acc, curr) => ({
        recibido: { total: acc.recibido.total + curr.recibido.total, capital: acc.recibido.capital + curr.recibido.capital, interes: acc.recibido.interes + curr.recibido.interes },
        porRecibir: { total: acc.porRecibir.total + curr.porRecibir.total, capital: acc.porRecibir.capital + curr.porRecibir.capital, interes: acc.porRecibir.interes + curr.porRecibir.interes },
        porCobrar: { total: acc.porCobrar.total + curr.porCobrar.total, capital: acc.porCobrar.capital + curr.porCobrar.capital, interes: acc.porCobrar.interes + curr.porCobrar.interes },
        count: acc.count + curr.count,
      }),
      { recibido: { total: 0, capital: 0, interes: 0 }, porRecibir: { total: 0, capital: 0, interes: 0 }, porCobrar: { total: 0, capital: 0, interes: 0 }, count: 0 }
    );
    return Response.json({ projections, totals });
  }

  try {
    // Limit to 18 months ahead for performance
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 18);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Get amortization rows for active loans up to 18 months ahead
    const allAmort = await db
      .select({
        fechaQuincena: amortizacion.fechaQuincena,
        cuotaQuincenal: amortizacion.cuotaQuincenal,
        capital: amortizacion.capital,
        interes: amortizacion.interes,
        estado: amortizacion.estado,
      })
      .from(amortizacion)
      .innerJoin(prestamos, eq(amortizacion.prestamoId, prestamos.id))
      .where(
        and(
          eq(prestamos.estado, 'activa'),
          lte(amortizacion.fechaQuincena, maxDateStr)
        )
      )
      .orderBy(asc(amortizacion.fechaQuincena));

    const todayStr = new Date().toISOString().split('T')[0];

    // Group by month with status breakdown
    const monthlyData: Record<string, {
      monthKey: string;
      monthLabel: string;
      year: number;
      count: number;
      recibido: { total: number; capital: number; interes: number };
      porRecibir: { total: number; capital: number; interes: number };
      porCobrar: { total: number; capital: number; interes: number };
    }> = {};

    allAmort.forEach((row) => {
      const date = new Date(row.fechaQuincena + 'T00:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-PA', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthKey,
          monthLabel,
          year: date.getFullYear(),
          count: 0,
          recibido: { total: 0, capital: 0, interes: 0 },
          porRecibir: { total: 0, capital: 0, interes: 0 },
          porCobrar: { total: 0, capital: 0, interes: 0 },
        };
      }

      const capital = Number(row.capital);
      const interes = Number(row.interes);
      const total = Number(row.cuotaQuincenal);

      // Categorize by status
      if (row.estado === 'pagada') {
        monthlyData[monthKey].recibido.total += total;
        monthlyData[monthKey].recibido.capital += capital;
        monthlyData[monthKey].recibido.interes += interes;
      } else if (row.estado === 'pendiente' && row.fechaQuincena < todayStr) {
        monthlyData[monthKey].porCobrar.total += total;
        monthlyData[monthKey].porCobrar.capital += capital;
        monthlyData[monthKey].porCobrar.interes += interes;
      } else {
        // pendiente with future due date
        monthlyData[monthKey].porRecibir.total += total;
        monthlyData[monthKey].porRecibir.capital += capital;
        monthlyData[monthKey].porRecibir.interes += interes;
      }

      monthlyData[monthKey].count += 1;
    });

    let projections = Object.values(monthlyData).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );

    // Apply month filter if provided
    if (monthFilter) {
      projections = projections.filter((p) => p.monthKey === monthFilter);
    }

    const totals = projections.reduce(
      (acc, curr) => ({
        recibido: {
          total: acc.recibido.total + curr.recibido.total,
          capital: acc.recibido.capital + curr.recibido.capital,
          interes: acc.recibido.interes + curr.recibido.interes,
        },
        porRecibir: {
          total: acc.porRecibir.total + curr.porRecibir.total,
          capital: acc.porRecibir.capital + curr.porRecibir.capital,
          interes: acc.porRecibir.interes + curr.porRecibir.interes,
        },
        porCobrar: {
          total: acc.porCobrar.total + curr.porCobrar.total,
          capital: acc.porCobrar.capital + curr.porCobrar.capital,
          interes: acc.porCobrar.interes + curr.porCobrar.interes,
        },
        count: acc.count + curr.count,
      }),
      {
        recibido: { total: 0, capital: 0, interes: 0 },
        porRecibir: { total: 0, capital: 0, interes: 0 },
        porCobrar: { total: 0, capital: 0, interes: 0 },
        count: 0,
      }
    );

    const responseData = { projections, totals };
    setCache(CACHE_KEY, responseData, 300);

    return Response.json(responseData);
  } catch (error) {
    console.error('Error fetching projections:', error);
    return Response.json(
      { error: 'Failed to fetch projections' },
      { status: 500 }
    );
  }
}
