import { db } from '@/lib/db';
import { pagos, prestamos, persons, solicitudes, companies, amortizacion } from '@/lib/schema';
import { desc, eq, and, gte, lte, lt, sql, like, or } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse filter parameters
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const companyId = searchParams.get('companyId');
  const clientName = searchParams.get('clientName');
  const allTime = searchParams.get('allTime') === 'true';
  
  const CACHE_KEY = 'payments:historical:alltime';

  // Return cached data for all-time requests without filters
  if (allTime && !startDate && !endDate && !companyId && !clientName) {
    const cached = getCache(CACHE_KEY);
    if (cached) {
      return Response.json(cached);
    }
  }

  try {
    // Build base query with company and amortization joins
    let query = db
      .select({
        id: pagos.id,
        montoPagado: pagos.montoPagado,
        fechaPago: pagos.fechaPago,
        quincenaNum: pagos.quincenaNum,
        prestamoId: pagos.prestamoId,
        createdAt: pagos.createdAt,
        cedula: persons.cedula,
        nombre: persons.nombre,
        apellido: persons.apellido,
        companyId: persons.companyId,
        companyName: companies.name,
        capital: amortizacion.capital,
        interes: amortizacion.interes,
      })
      .from(pagos)
      .innerJoin(prestamos, eq(pagos.prestamoId, prestamos.id))
      .innerJoin(solicitudes, eq(prestamos.solicitudId, solicitudes.id))
      .innerJoin(persons, eq(solicitudes.personId, persons.id))
      .leftJoin(companies, eq(persons.companyId, companies.id))
      .leftJoin(
        amortizacion,
        and(
          eq(pagos.prestamoId, amortizacion.prestamoId),
          eq(pagos.quincenaNum, amortizacion.quincenaNum)
        )
      );

    // Apply filters
    const conditions = [];
    
    // Get current date for historical filtering
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // Only apply date filters if not fetching all time
    if (!allTime) {
      if (startDate) {
        conditions.push(gte(pagos.fechaPago, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(pagos.fechaPago, endDate));
      }
    } else {
      // For all-time, only show historical data (up to today)
      conditions.push(lte(pagos.fechaPago, today.toISOString().split('T')[0]));
    }
    
    if (companyId && companyId !== 'all') {
      conditions.push(eq(persons.companyId, parseInt(companyId)));
    }
    
    // Server-side client name search
    if (clientName && clientName.trim()) {
      const searchTerm = `%${clientName.trim()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${persons.nombre})`, sql`LOWER(${searchTerm})`),
          like(sql`LOWER(${persons.apellido})`, sql`LOWER(${searchTerm})`),
          like(persons.cedula, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    // Execute query with ordering
    const payments = await query.orderBy(desc(pagos.fechaPago));
    
    // Group by month for summary
    const monthlyData: Record<string, {
      month: string;
      year: number;
      totalCollected: number;
      totalCapital: number;
      totalInteres: number;
      paymentCount: number;
      uniqueClients: Set<string>;
      uniqueLoans: Set<number>;
    }> = {};
    
    let totalCollected = 0;
    let totalCapital = 0;
    let totalInteres = 0;
    let totalPayments = 0;
    const allTimeClients = new Set<string>();
    const allTimeLoans = new Set<number>();
    
    payments.forEach((payment) => {
      const date = payment.fechaPago ? new Date(payment.fechaPago) : new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-PA', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          totalCollected: 0,
          totalCapital: 0,
          totalInteres: 0,
          paymentCount: 0,
          uniqueClients: new Set(),
          uniqueLoans: new Set(),
        };
      }
      
      const amount = parseFloat(payment.montoPagado);
      const capital = payment.capital ? parseFloat(payment.capital) : 0;
      const interes = payment.interes ? parseFloat(payment.interes) : 0;
      
      monthlyData[monthKey].totalCollected += amount;
      monthlyData[monthKey].totalCapital += capital;
      monthlyData[monthKey].totalInteres += interes;
      monthlyData[monthKey].paymentCount += 1;
      monthlyData[monthKey].uniqueClients.add(`${payment.nombre} ${payment.apellido}`);
      monthlyData[monthKey].uniqueLoans.add(payment.prestamoId);
      
      totalCollected += amount;
      totalCapital += capital;
      totalInteres += interes;
      totalPayments += 1;
      allTimeClients.add(`${payment.nombre} ${payment.apellido}`);
      allTimeLoans.add(payment.prestamoId);
    });
    
    // Convert monthly data to array and sort by date (newest first)
    const monthlySummary = Object.entries(monthlyData)
      .map(([key, data]) => ({
        monthKey: key,
        month: data.month,
        year: data.year,
        totalCollected: data.totalCollected,
        totalCapital: data.totalCapital,
        totalInteres: data.totalInteres,
        paymentCount: data.paymentCount,
        uniqueClients: data.uniqueClients.size,
        uniqueLoans: data.uniqueLoans.size,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // Fetch ALL pending amortization (overdue + future) grouped by due-date month
    // 'atrasada' is computed, not stored: pendiente + fechaQuincena in the past
    const todayStr = new Date().toISOString().split('T')[0];
    
    const pendingAmort = await db
      .select({
        fechaQuincena: amortizacion.fechaQuincena,
        cuotaQuincenal: amortizacion.cuotaQuincenal,
      })
      .from(amortizacion)
      .innerJoin(prestamos, eq(amortizacion.prestamoId, prestamos.id))
      .where(
        and(
          eq(amortizacion.estado, 'pendiente'),
          eq(prestamos.estado, 'activa')
        )
      );

    const pendingCountByMonth: Record<string, number> = {};
    const overdueByMonth: Record<string, number> = {};
    let totalOverdue = 0;

    pendingAmort.forEach((row) => {
      const date = new Date(row.fechaQuincena + 'T00:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = Number(row.cuotaQuincenal);
      
      // Count all pending quincenas per month
      pendingCountByMonth[monthKey] = (pendingCountByMonth[monthKey] || 0) + 1;
      
      // Only overdue amounts
      if (row.fechaQuincena < todayStr) {
        overdueByMonth[monthKey] = (overdueByMonth[monthKey] || 0) + amount;
        totalOverdue += amount;
      }
    });

    // Merge data into monthlySummary
    const monthlySummaryWithOverdue = monthlySummary.map((m) => ({
      ...m,
      totalPendiente: overdueByMonth[m.monthKey] || 0,
      pendingCount: pendingCountByMonth[m.monthKey] || 0,
    }));

    // Fetch companies for filter dropdown
    const companiesList = await db.select({
      id: companies.id,
      name: companies.name,
    }).from(companies).orderBy(companies.name);
    
    const responseData = {
      payments: payments.map(p => ({
        ...p,
        montoPagado: parseFloat(p.montoPagado),
        capital: p.capital ? parseFloat(p.capital) : 0,
        interes: p.interes ? parseFloat(p.interes) : 0,
      })),
      monthlySummary: monthlySummaryWithOverdue,
      companies: companiesList,
      totalOverdue,
      summary: {
        totalCollected,
        totalCapital,
        totalInteres,
        totalPayments,
        uniqueClients: allTimeClients.size,
        uniqueLoans: allTimeLoans.size,
        averagePayment: totalPayments > 0 ? totalCollected / totalPayments : 0,
      },
    };

    // Cache all-time data without filters
    if (allTime && !startDate && !endDate && !companyId && !clientName) {
      setCache(CACHE_KEY, responseData, 300);
    }

    return Response.json(responseData);
    
  } catch (error) {
    console.error('Error fetching historical payments:', error);
    return Response.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
