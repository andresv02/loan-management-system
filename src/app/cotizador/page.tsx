import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { CotizadorForm } from '@/components/CotizadorForm';

export default async function CotizadorPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Cotizador de Préstamos
          </h1>
          <p className="text-slate-600 text-lg">
            Simule préstamos y visualice la tabla de amortización sin guardar en el sistema.
          </p>
        </div>

        <CotizadorForm />
      </div>
    </div>
  );
}
