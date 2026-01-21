import { db } from '@/lib/db';
import { prestamos, amortizacion } from '@/lib/schema';
import { eq, and, ne, asc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Aggregate {
  total: number;
  capital: number;
  interes: number;
}

export default async function AggregateUpcomingQuincenas() {
  const unpaidAmort = await db
    .select({
      fechaQuincena: amortizacion.fechaQuincena,
      cuotaQuincenal: amortizacion.cuotaQuincenal,
      capital: amortizacion.capital,
      interes: amortizacion.interes,
    })
    .from(amortizacion)
    .innerJoin(prestamos, eq(amortizacion.prestamoId, prestamos.id))
    .where(
      and(
        eq(prestamos.estado, 'activa'),
        ne(amortizacion.estado, 'pagada')
      )
    )
    .orderBy(asc(amortizacion.fechaQuincena));

  const groups: Record<string, Aggregate> = {};

  unpaidAmort.forEach((row) => {
    const date = row.fechaQuincena;
    if (!groups[date]) {
      groups[date] = { total: 0, capital: 0, interes: 0 };
    }
    groups[date].total += Number(row.cuotaQuincenal);
    groups[date].capital += Number(row.capital);
    groups[date].interes += Number(row.interes);
  });

  const sortedDates = Object.keys(groups).sort();
  const top3Dates = sortedDates.slice(0, 3);

  const aggregates = top3Dates.map((date) => ({
    date,
    ...groups[date],
  }));

  return (
    <Card className="flex-1 bg-white border-gray-200 hover:shadow-lg p-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
          <span className="mr-2">📊</span>
          Próximas 3 Fechas de Quincena (Agregado)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Quincena</th>
                <th className="text-right py-2">Total</th>
                <th className="text-right py-2">Capital</th>
                <th className="text-right py-2">Interés</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map(({ date, ...agg }) => (
                <tr key={date} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">
                    {new Date(date).toLocaleDateString('es-PA')}
                  </td>
                  <td className="text-right font-bold py-2">
                    {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(agg.total)}
                  </td>
                  <td className="text-right text-emerald-600 py-2 font-semibold">
                    {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(agg.capital)}
                  </td>
                  <td className="text-right text-blue-600 py-2 font-semibold">
                    {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(agg.interes)}
                  </td>
                </tr>
              ))}
              {aggregates.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-slate-500">Sin quincenas próximas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}