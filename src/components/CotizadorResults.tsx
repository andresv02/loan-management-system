'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CotizadorAmortizationTable } from './CotizadorAmortizationTable';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { TrendingUp, DollarSign, Calendar, CreditCard } from 'lucide-react';

interface AmortRowData {
  quincenaNum: number;
  fechaQuincena: string;
  cuotaQuincenal: string;
  interes: string;
  capital: string;
  saldoInicial: string;
  saldoFinal: string;
}

interface CotizacionResult {
  monto: number;
  interesTotal: number;
  cuotaQuincenal: number;
  totalQuincenas: number;
  totalAPagar: number;
  proximoPago: Date;
  tablaAmortizacion: AmortRowData[];
}

interface CotizadorResultsProps {
  resultado: CotizacionResult;
}

export function CotizadorResults({ resultado }: CotizadorResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto del Préstamo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resultado.monto)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interés Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resultado.interesTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resultado.totalAPagar)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuota Quincenal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resultado.cuotaQuincenal)}</div>
            <p className="text-xs text-muted-foreground">
              {resultado.totalQuincenas} quincenas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Primer Pago</p>
            <p className="text-lg font-semibold">{format(resultado.proximoPago, 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Quincenas</p>
            <p className="text-lg font-semibold">{resultado.totalQuincenas}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tasa Efectiva Aproximada</p>
            <p className="text-lg font-semibold">
              {((resultado.interesTotal / resultado.monto) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Amortization Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800">Tabla de Amortización</h3>
          <p className="text-sm text-gray-600">
            Desglose de pagos quincenales con capital e intereses
          </p>
        </div>
        <CotizadorAmortizationTable data={resultado.tablaAmortizacion} />
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Esta es una cotización informativa. Los valores finales pueden variar 
          ligeramente al momento de aprobar el préstamo. Esta información no se guarda en el sistema.
        </p>
      </div>
    </div>
  );
}
