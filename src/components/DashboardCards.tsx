import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { eq, count, sum } from 'drizzle-orm';
import { solicitudes, prestamos, amortizacion } from '@/lib/schema';
import Link from 'next/link';
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
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Pending Solicitudes */}
        <Link href="/solicitudes">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 hover:border-amber-200 group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Solicitudes Pendientes</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                 <span className="text-amber-600 text-lg">📋</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{pendingSolicitudes}</div>
              <p className="text-xs text-slate-500 mt-1">Por revisar</p>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Active Prestamos */}
        <Link href="#active-loans">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 hover:border-emerald-200 group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Préstamos Activos</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <span className="text-emerald-600 text-lg">💰</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{activePrestamos}</div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate-500">En curso</p>
                <span className="text-xs text-emerald-600 font-medium">Ver tabla ↓</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Total Pending Balance */}
        <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-300 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Saldo Pendiente</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
               <span className="text-blue-600 text-lg">💵</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('es-PA', {
                style: 'currency',
                currency: 'PAB',
              }).format(totalPendingBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Capital + Interés</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Interest Earned */}
        <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-300 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Interés Recibido</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
               <span className="text-emerald-600 text-lg">📈</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('es-PA', {
                style: 'currency',
                currency: 'PAB',
              }).format(totalInterestEarned)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Quincenas Section */}
      <div className="w-full">
         <AggregateUpcomingQuincenas />
      </div>
    </div>
  );
}
