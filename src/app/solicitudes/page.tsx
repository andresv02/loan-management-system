import { db } from '@/lib/db';
import { solicitudes, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import SolicitudesTable from '@/components/SolicitudesTable';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

interface SolicitudWithPerson {
  id: number;
  montoSolicitado: string;
  duracionMeses: number;
  tipoCuentaBancaria: string;
  numeroCuenta: string;
  banco: string;
  cedula: string;
  nombre: string;
  empresa: string;
  salarioMensual: string;
  mesesEnEmpresa: number;
  inicioContrato: string;
  direccion: string;
  fotoCedula: string[];
  email: string;
  telefono: string;
}

export default async function SolicitudesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const [solicitudesData, companiesData] = await Promise.all([
    db.query.solicitudes.findMany({
      where: eq(solicitudes.estado, 'nueva'),
      with: {
        person: {
          with: {
            company: true,
          },
        },
      },
    }),
    db.query.companies.findMany(),
  ]);

  const data: SolicitudWithPerson[] = solicitudesData.map((s) => ({
    id: s.id,
    montoSolicitado: s.montoSolicitado,
    duracionMeses: s.duracionMeses,
    tipoCuentaBancaria: s.tipoCuentaBancaria || '',
    numeroCuenta: s.numeroCuenta || '',
    banco: s.banco || '',
    cedula: s.person.cedula,
    nombre: `${s.person.nombre} ${s.person.apellido}`,
    empresa: s.empresa || s.person.company?.name || '',
    salarioMensual: s.person.salarioMensual || '0.00',
    mesesEnEmpresa: s.person.mesesEnEmpresa || 0,
    inicioContrato: s.person.inicioContrato || '',
    direccion: s.person.direccion || '',
    fotoCedula: s.fotoCedula || [],
    email: s.person.email || '',
    telefono: s.person.telefono || '',
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Solicitudes Pendientes
          </h1>
          <p className="text-slate-600 text-lg">Revisa y aprueba las solicitudes de préstamo que esperan tu decisión.</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Solicitudes de Préstamo</h2>
                <p className="text-sm text-gray-600">{data.length} solicitudes pendientes</p>
              </div>
            </div>
          </div>

          <SolicitudesTable data={data} companies={companiesData} />
        </div>
      </div>
    </div>
  );
}