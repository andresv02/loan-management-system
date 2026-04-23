import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PaymentForm } from '@/components/PaymentForm';
import { RecentPayments } from '@/components/RecentPayments';
import { PaymentHistory } from '@/components/PaymentHistory';
import { DetailedPayments } from '@/components/DetailedPayments';
import { PortfolioSummary } from '@/components/PortfolioSummary';

const Projections = dynamic(() => import('@/components/Projections').then((mod) => mod.Projections), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  ),
});
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          <p className="text-slate-600 text-lg">Registra pagos de préstamos y consulta el historial completo.</p>
        </div>

        {/* Portfolio Summary - Always Visible */}
        <div className="mb-6">
          <PortfolioSummary />
        </div>

        <Tabs defaultValue="historical" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 flex-wrap h-auto">
            <TabsTrigger value="historical" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              📊 Historial Completo
            </TabsTrigger>
            <TabsTrigger value="projections" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              📈 Proyecciones
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              💳 Registrar Pago
            </TabsTrigger>
            <TabsTrigger value="detailed" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              📋 Pagos Detallados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historical" className="space-y-6">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <Projections />
          </TabsContent>

          <TabsContent value="register">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 text-lg">💳</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Registrar Pago</CardTitle>
                      <p className="text-xs text-slate-600">Procesa pagos de préstamos activos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PaymentForm />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-purple-800 mb-2">💡 Consejo</h3>
                    <p className="text-sm text-purple-700">
                      Para ver el historial completo de pagos con filtros por mes, cliente y fechas,
                      usa la pestaña <strong>&quot;Historial Completo&quot;</strong>.
                    </p>
                  </CardContent>
                </Card>

                <Suspense fallback={
                  <Card className="bg-white border-gray-200">
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </CardContent>
                  </Card>
                }>
                  <RecentPayments />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <DetailedPayments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
