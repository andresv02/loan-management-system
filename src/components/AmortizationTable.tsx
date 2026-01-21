import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AmortRow } from '@/types';
import { recordPayment } from '@/lib/actions';
import { getEffectiveEstado } from '@/lib/utils';

interface AmortizationTableProps {
  data: AmortRow[];
  prestamoId: number;
}

export function AmortizationTable({ data, prestamoId }: AmortizationTableProps) {
  return (
    <div className="w-full">
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quincena</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Capital</TableHead>
              <TableHead>Saldo Inicial</TableHead>
              <TableHead>Saldo Final</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const effectiveEstado = getEffectiveEstado(row.estado, row.fechaQuincena);
              const estadoLabel = effectiveEstado.charAt(0).toUpperCase() + effectiveEstado.slice(1);
              
              return (
                <TableRow key={row.quincenaNum}>
                  <TableCell>{row.quincenaNum}</TableCell>
                  <TableCell>{row.fechaQuincena}</TableCell>
                  <TableCell>${row.cuotaQuincenal}</TableCell>
                  <TableCell>${row.interes}</TableCell>
                  <TableCell>${row.capital}</TableCell>
                  <TableCell>${row.saldoInicial}</TableCell>
                  <TableCell>${row.saldoFinal}</TableCell>
                  <TableCell>
                    <span className={
                      effectiveEstado === 'atrasada'
                        ? 'text-red-600 font-semibold'
                        : effectiveEstado === 'pagada'
                        ? 'text-green-600 font-semibold'
                        : ''
                    }>
                      {estadoLabel}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <input
                      type="checkbox"
                      checked={row.estado === 'pagada'}
                      disabled={row.estado === 'pagada'}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          await recordPayment(prestamoId, row.quincenaNum, parseFloat(row.cuotaQuincenal), new Date(row.fechaQuincena));
                        }
                      }}
                      className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 disabled:opacity-50"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}