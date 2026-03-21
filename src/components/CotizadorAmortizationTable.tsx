'use client';

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface AmortRowData {
  quincenaNum: number;
  fechaQuincena: string;
  cuotaQuincenal: string;
  interes: string;
  capital: string;
  saldoInicial: string;
  saldoFinal: string;
}

interface CotizadorAmortizationTableProps {
  data: AmortRowData[];
}

export function CotizadorAmortizationTable({ data }: CotizadorAmortizationTableProps) {
  return (
    <div className="w-full">
      <div className="rounded-md border bg-background">
        <div className="relative w-full overflow-auto max-h-[500px]">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
              <TableRow>
                <TableHead className="bg-background">Quincena</TableHead>
                <TableHead className="bg-background">Fecha</TableHead>
                <TableHead className="bg-background">Cuota</TableHead>
                <TableHead className="bg-background">Interés</TableHead>
                <TableHead className="bg-background">Capital</TableHead>
                <TableHead className="bg-background">Saldo Inicial</TableHead>
                <TableHead className="bg-background">Saldo Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.quincenaNum}>
                  <TableCell>{row.quincenaNum}</TableCell>
                  <TableCell>
                    {new Date(row.fechaQuincena + 'T00:00:00').toLocaleDateString('es-PA')}
                  </TableCell>
                  <TableCell>{formatCurrency(row.cuotaQuincenal)}</TableCell>
                  <TableCell>{formatCurrency(row.interes)}</TableCell>
                  <TableCell>{formatCurrency(row.capital)}</TableCell>
                  <TableCell>{formatCurrency(row.saldoInicial)}</TableCell>
                  <TableCell>{formatCurrency(row.saldoFinal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </div>
    </div>
  );
}
