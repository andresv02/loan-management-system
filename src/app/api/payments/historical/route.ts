import { db } from '@/lib/db';
import { pagos, prestamos, persons, solicitudes, companies } from '@/lib/schema';
import { desc, eq, and, gte, lte, sql, like, or } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse filter parameters
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const companyId = searchParams.get('companyId');
  const clientName = searchParams.get('clientName');
  const allTime = searchParams.get('allTime') === 'true';
  
  try {
    // Build base query with company join
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
      })
      .from(pagos)
      .innerJoin(prestamos, eq(pagos.prestamoId, prestamos.id))
      .innerJoin(solicitudes, eq(prestamos.solicitudId, solicitudes.id))
      .innerJoin(persons, eq(solicitudes.personId, persons.id))
      .leftJoin(companies, eq(persons.companyId, companies.id));

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
      paymentCount: number;
      uniqueClients: Set<string>;
      uniqueLoans: Set<number>;
    }> = {};
    
    let totalCollected = 0;
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
          paymentCount: 0,
          uniqueClients: new Set(),
          uniqueLoans: new Set(),
        };
      }
      
      const amount = parseFloat(payment.montoPagado);
      monthlyData[monthKey].totalCollected += amount;
      monthlyData[monthKey].paymentCount += 1;
      monthlyData[monthKey].uniqueClients.add(`${payment.nombre} ${payment.apellido}`);
      monthlyData[monthKey].uniqueLoans.add(payment.prestamoId);
      
      totalCollected += amount;
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
        paymentCount: data.paymentCount,
        uniqueClients: data.uniqueClients.size,
        uniqueLoans: data.uniqueLoans.size,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // Fetch companies for filter dropdown
    const companiesList = await db.select({
      id: companies.id,
      name: companies.name,
    }).from(companies).orderBy(companies.name);
    
    return Response.json({
      payments: payments.map(p => ({
        ...p,
        montoPagado: parseFloat(p.montoPagado),
      })),
      monthlySummary,
      companies: companiesList,
      summary: {
        totalCollected,
        totalPayments,
        uniqueClients: allTimeClients.size,
        uniqueLoans: allTimeLoans.size,
        averagePayment: totalPayments > 0 ? totalCollected / totalPayments : 0,
      },
    });
    
  } catch (error) {
    console.error('Error fetching historical payments:', error);
    return Response.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
