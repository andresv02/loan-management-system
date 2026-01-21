import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { and, eq, count, sum, ne } from 'drizzle-orm';
import { solicitudes, prestamos, amortizacion } from '@/lib/schema';
import Link from 'next/link';
import UpcomingPayments from './UpcomingPayments';
import AggregateUpcomingQuincenas from './AggregateUpcomingQuincenas';

export default async function DashboardCards() {
  const [pendingSolicitudesRes, activePrestamosRes, pendingBalanceRes, interestEarnedRes] = await Promise.all([
    db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, 'nueva')),
    db.select({ count: count() }).from(prestamos).where(eq(prestamos.estado, 'activa')),
    db.select({ sum: sum(prestamos.saldoPendiente) }).from(prestamos).where(eq(prestamos.estado, 'activa')),
    db.select({ sum: sum(amortizacion.interes) }).from(amortizacion).where(eq(amortizacion.estado, 'pagada')),
  ]);

  const pendingSolicitudes = Number(pendingSolicitudesRes[0]?.count ?? 0);
  const activePrestamos = Number(activePrestamosRes[0]?.count ?? 0);
  const totalPendingBalance = Number(pendingBalanceRes[0]?.sum ?? 0);
  const totalInterestEarned = Number(interestEarnedRes[0]?.sum ?? 0);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
      {/* Column 1: Pending Solicitudes and Active Prestamos */}
      <div className="space-y-4">
        <Link href="/solicitudes">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white border-gray-200 hover:border-slate-300 group p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Solicitudes Pendientes</CardTitle>
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                <span className="text-white text-sm">📋</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold text-slate-900">{pendingSolicitudes}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/prestamos">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white border-gray-200 hover:border-slate-300 group p-4 mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Préstamos Activos</CardTitle>
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                <span className="text-white text-sm">💰</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold text-slate-900">{activePrestamos}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Column 2: Total Pending Balance and Total Interest Earned */}
      <div className="space-y-4">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Saldo Total Pendiente</CardTitle>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">💵</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('es-PA', {
                style: 'currency',
                currency: 'PAB',
              }).format(totalPendingBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Interés Total Recibido</CardTitle>
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">💰</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('es-PA', {
                style: 'currency',
                currency: 'PAB',
              }).format(totalInterestEarned)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Próximos Pagos (full width of column 2) */}
      <div className="flex flex-col h-full">
        <UpcomingPayments />
      </div>
    </div>
    <div className="mt-6 pt-6 border-t border-gray-200">
      <AggregateUpcomingQuincenas />
      </div>
    </>
  );
}
