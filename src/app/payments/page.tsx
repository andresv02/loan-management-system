import { Suspense } from 'react';
import { PaymentForm } from '@/components/PaymentForm';
import { RecentPayments } from '@/components/RecentPayments';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-1">
            Pagos
          </h1>
          <p className="text-slate-600 text-lg">Registra pagos de préstamos y rastrea el historial de pagos.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">💳</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Registrar Pago</h2>
                <p className="text-xs text-slate-600">Procesa pagos de préstamos</p>
              </div>
            </div>
            <PaymentForm />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Pagos Recientes</h2>
                <p className="text-xs text-slate-600">Actividad reciente de pagos</p>
              </div>
            </div>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            }>
              <RecentPayments />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}