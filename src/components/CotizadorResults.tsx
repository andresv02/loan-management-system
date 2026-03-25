'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CotizadorAmortizationTable } from './CotizadorAmortizationTable';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Calendar, CreditCard, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const handleExportPDF = async () => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('COTIZACION DE PRESTAMO', 105, 20, { align: 'center' });
      
      // Company info
      doc.setFontSize(11);
      doc.text('Creditos Nacionales', 105, 28, { align: 'center' });
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PA')}`, 105, 34, { align: 'center' });
      
      // Summary section
      doc.setFontSize(13);
      doc.text('Resumen del Prestamo', 14, 45);
      
      // Summary data (simplified for PDF - no interes total, no tasa)
      doc.setFontSize(10);
      const summaryItems = [
        ['Monto del Prestamo:', formatCurrency(resultado.monto)],
        ['Total a Pagar:', formatCurrency(resultado.totalAPagar)],
        ['Cuota Quincenal:', formatCurrency(resultado.cuotaQuincenal)],
        ['Total de Quincenas:', resultado.totalQuincenas.toString()],
        ['Primer Pago:', resultado.proximoPago.toLocaleDateString('es-PA')],
      ];
      
      let y = 55;
      summaryItems.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, y);
        y += 8;
      });
      
      // Amortization table (simplified - no capital, no interes)
      doc.setFontSize(13);
      doc.text('Tabla de Amortizacion', 14, 105);
      
      // Table data (simplified columns)
      const tableData = resultado.tablaAmortizacion.map(row => [
        row.quincenaNum.toString(),
        new Date(row.fechaQuincena + 'T00:00:00').toLocaleDateString('es-PA'),
        formatCurrency(row.cuotaQuincenal),
        formatCurrency(row.saldoInicial),
        formatCurrency(row.saldoFinal),
      ]);
      
      autoTable(doc, {
        startY: 110,
        head: [['Quincena', 'Fecha', 'Cuota', 'Saldo Inicial', 'Saldo Final']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: [255, 255, 255],
        },
        styles: {
          fontSize: 9,
        },
      });
      
      // Footer note
      const finalY = (doc as any).lastAutoTable?.finalY + 10 || 250;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Nota: Esta es una cotizacion informativa. Los valores finales pueden variar ligeramente.',
        14,
        finalY
      );
      
      // Save PDF
      doc.save(`cotizacion_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor intente nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary Cards - FULL INFO SHOWN IN APP */}
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

      {/* Additional Info - FULL INFO SHOWN IN APP */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Primer Pago</p>
            <p className="text-lg font-semibold">{resultado.proximoPago.toLocaleDateString('es-PA')}</p>
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

      {/* Amortization Table - FULL INFO SHOWN IN APP */}
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
