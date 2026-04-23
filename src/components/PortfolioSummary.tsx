import { db } from '@/lib/db';
import { eq, count, sum } from 'drizzle-orm';
import { prestamos, amortizacion } from '@/lib/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function PortfolioSummary() {
  const [activePrestamosRes, pendingBalanceRes, interestEarnedRes] = await Promise.all([
    db.select({ count: count() }).from(prestamos).where(eq(prestamos.estado, 'activa')),
    db.select({ sum: sum(prestamos.saldoPendiente) }).from(prestamos).where(eq(prestamos.estado, 'activa')),
    db.select({ sum: sum(amortizacion.interes) }).from(amortizacion).where(eq(amortizacion.estado, 'pagada')),
  ]);

  const activePrestamos = Number(activePrestamosRes[0]?.count ?? 0);
  const totalPendingBalance = Number(pendingBalanceRes[0]?.sum ?? 0);
  const totalInterestEarned = Number(interestEarnedRes[0]?.sum ?? 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1">
          <CardTitle className="text-sm font-medium text-slate-600">Préstamos Activos</CardTitle>
          <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 text-base">💰</span>
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-3">
          <div className="text-xl font-bold text-slate-900">{activePrestamos}</div>
          <p className="text-xs text-slate-500 mt-0.5">En curso</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1">
          <CardTitle className="text-sm font-medium text-slate-600">Saldo Pendiente</CardTitle>
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-base">💵</span>
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-3">
          <div className="text-xl font-bold text-slate-900">{formatCurrency(totalPendingBalance)}</div>
          <p className="text-xs text-slate-500 mt-0.5">Capital + Interés</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1">
          <CardTitle className="text-sm font-medium text-slate-600">Interés Recibido</CardTitle>
          <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 text-base">📈</span>
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-3">
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalInterestEarned)}</div>
          <p className="text-xs text-slate-500 mt-0.5">Total histórico</p>
        </CardContent>
      </Card>
    </div>
  );
}
