import { db } from '@/lib/db';
import { pagos, prestamos, persons, solicitudes } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function RecentPayments() {
  const recentPayments = await db
    .select({
      id: pagos.id,
      montoPagado: pagos.montoPagado,
      fechaPago: pagos.fechaPago,
      quincenaNum: pagos.quincenaNum,
      prestamoId: pagos.prestamoId,
      cedula: persons.cedula,
      nombre: persons.nombre,
      apellido: persons.apellido,
    })
    .from(pagos)
    .innerJoin(prestamos, eq(pagos.prestamoId, prestamos.id))
    .innerJoin(solicitudes, eq(prestamos.solicitudId, solicitudes.id))
    .innerJoin(persons, eq(solicitudes.personId, persons.id))
    .orderBy(desc(pagos.createdAt))
    .limit(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentPayments.length === 0 ? (
          <p className="text-muted-foreground">No hay pagos registrados aún.</p>
        ) : (
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">
                    {payment.cedula} - {payment.nombre} {payment.apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pago #{payment.quincenaNum} • Préstamo #{payment.prestamoId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.fechaPago ? new Date(payment.fechaPago + 'T00:00:00').toLocaleDateString('es-PA') : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${parseFloat(payment.montoPagado).toLocaleString('es-PA', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}