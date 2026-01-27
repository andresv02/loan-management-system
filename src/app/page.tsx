import { db } from '@/lib/db';
import { prestamos, solicitudes, persons, companies, amortizacion } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

import DashboardCards from '@/components/DashboardCards';
import { DashboardActiveLoans } from '@/components/DashboardActiveLoans';

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

export default async function Page() {
  // Check authentication
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  // First get active prestamos
  const [prestamosData, companiesData] = await Promise.all([
    db.query.prestamos.findMany({
      where: eq(prestamos.estado, 'activa'),
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
        empresa: p.solicitud.person.company?.name || '',
        cedula: p.solicitud.person.cedula,
        nombre: `${p.solicitud.person.nombre} ${p.solicitud.person.apellido}`,
        amortizacion: amortizacionData,
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Panel Principal
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">¡Bienvenido de vuelta! Aquí tienes un resumen de tu cartera de préstamos.</p>
        </div>

        {/* Dashboard Cards */}
        <div className="mb-12">
          <DashboardCards />
        </div>

        {/* Active Loans Section */}
        <div className="space-y-6" id="active-loans">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-slate-900">Préstamos Activos</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600 font-medium">Datos en Tiempo Real</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <DashboardActiveLoans data={data} companies={companiesData} />
          </div>
        </div>
      </div>
    </div>
  );
}
