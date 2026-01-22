import { db } from '@/lib/db';
import { prestamos, amortizacion } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import PrestamosTable from '@/components/PrestamosTable';
import { CreateLoanDialog } from '@/components/CreateLoanDialog';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

interface PrestamoWithDetails {
  id: number;
  principal: string;
  cuotaQuincenal: string;
  saldoPendiente: string;
  proximoPago: string;
  interesTotal: string;
  estado: string;
  empresa: string;
  cedula: string;
  nombre: string;
  amortizacion: any[];
}

export default async function PrestamosPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  // First get all prestamos and companies
  const [prestamosData, companiesData] = await Promise.all([
    db.query.prestamos.findMany({
      orderBy: [asc(prestamos.id)],
      with: {
        solicitud: {
          with: {
            person: {
              with: {
                company: true,
              },
            },
          },
        },
      },
    }),
    db.query.companies.findMany(),
  ]);

  // Then get amortization data for each prestamo, ordered by quincena_num
  const data: PrestamoWithDetails[] = await Promise.all(
    prestamosData.map(async (p) => {
      const amortizacionData = await db
        .select()
        .from(amortizacion)
        .where(eq(amortizacion.prestamoId, p.id))
        .orderBy(asc(amortizacion.quincenaNum));

      return {
        id: p.id,
        principal: p.principal,
        cuotaQuincenal: p.cuotaQuincenal,
        saldoPendiente: p.saldoPendiente,
        proximoPago: p.proximoPago,
        interesTotal: p.interesTotal,
        estado: p.estado,
        empresa: p.solicitud.person.company?.name || p.solicitud.empresa || '',
        cedula: p.solicitud.person.cedula,
        nombre: `${p.solicitud.person.nombre} ${p.solicitud.person.apellido}`,
        amortizacion: amortizacionData,
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Todos los Préstamos</h1>
          <p className="text-slate-600 text-lg">Visualiza todos los préstamos, incluyendo aprobados, completados y rechazados.</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Listado de Préstamos</h2>
            <CreateLoanDialog companies={companiesData} />
          </div>
          <PrestamosTable data={data} />
        </div>
      </div>
    </div>
  );
}