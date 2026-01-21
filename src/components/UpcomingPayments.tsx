import { db } from '@/lib/db';
import { prestamos, amortizacion, solicitudes, persons } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEffectiveEstado } from '@/lib/utils';

interface UpcomingPayment {
  loanId: number;
  clientName: string;
  dueDate: string;
  totalDue: number;
  capitalDue: number;
  interestDue: number;
  isOverdue: boolean;
}

export default async function UpcomingPayments() {
  // Get all active loans with their next unpaid amortization row
  const activeLoans = await db.query.prestamos.findMany({
    where: eq(prestamos.estado, 'activa'),
    with: {
      solicitud: {
        with: {
          person: true,
        },
      },
    },
  });

  const upcomingPayments: UpcomingPayment[] = [];

  for (const loan of activeLoans) {
    // Find the next unpaid amortization row (estado = 'pendiente')
    const nextPayment = await db
      .select()
      .from(amortizacion)
      .where(eq(amortizacion.prestamoId, loan.id))
      .orderBy(asc(amortizacion.quincenaNum))
      .limit(1);

    if (nextPayment.length > 0 && nextPayment[0].estado === 'pendiente') {
      const payment = nextPayment[0];
      const effectiveEstado = getEffectiveEstado(payment.estado, payment.fechaQuincena);
      
      upcomingPayments.push({
        loanId: loan.id,
        clientName: `${loan.solicitud.person.nombre} ${loan.solicitud.person.apellido}`,
        dueDate: payment.fechaQuincena,
        totalDue: parseFloat(payment.cuotaQuincenal),
        capitalDue: parseFloat(payment.capital),
        interestDue: parseFloat(payment.interes),
        isOverdue: effectiveEstado === 'atrasada',
      });
    }
  }

  // Sort by due date
  upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Take only the next 5 upcoming payments
  const displayPayments = upcomingPayments.slice(0, 5);

  // Calculate totals
  const totalDue = upcomingPayments.reduce((sum, p) => sum + p.totalDue, 0);
  const totalCapital = upcomingPayments.reduce((sum, p) => sum + p.capitalDue, 0);
  const totalInterest = upcomingPayments.reduce((sum, p) => sum + p.interestDue, 0);

  return (
    <Card className="flex-1 bg-white border-gray-200 hover:shadow-lg transition-all duration-300 p-4">
      <CardHeader className="pb-2 p-0">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
          <span className="mr-2">📅</span>
          Próximos Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-600">Total:</span>
              <p className="font-semibold text-slate-800">${totalDue.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-600">Capital:</span>
              <p className="font-semibold text-emerald-600">${totalCapital.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-600">Interés:</span>
              <p className="font-semibold text-blue-600">${totalInterest.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Individual payments */}
        <div className="space-y-2">
          {displayPayments.length === 0 ? (
            <p className="text-slate-500 text-xs">No hay pagos pendientes</p>
          ) : (
            displayPayments.map((payment, index) => (
              <div
                key={`${payment.loanId}-${index}`}
                className={`flex items-center justify-between p-2 rounded ${
                  payment.isOverdue
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded text-xs ${
                      payment.isOverdue
                        ? 'bg-red-200 text-red-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{payment.loanId}
                    </span>
                    <span className={`font-medium text-xs truncate ${
                      payment.isOverdue ? 'text-red-900' : 'text-slate-800'
                    }`}>
                      {payment.clientName}
                    </span>
                    {payment.isOverdue && (
                      <span className="text-xs text-red-600 font-bold">⚠️ ATRASADO</span>
                    )}
                  </div>
                  <p className={`text-xs ${payment.isOverdue ? 'text-red-700' : 'text-slate-600'}`}>
                    {new Date(payment.dueDate).toLocaleDateString('es-PA')}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className={`font-semibold text-sm ${
                    payment.isOverdue ? 'text-red-700' : 'text-slate-800'
                  }`}>
                    ${payment.totalDue.toLocaleString()}
                  </p>
                  <p className={`text-xs ${payment.isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                    C:${payment.capitalDue.toFixed(0)} I:${payment.interestDue.toFixed(0)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}