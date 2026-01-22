import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AmortRow } from '@/types';
import { recordPayment, revertPayment } from '@/lib/actions';
import { getEffectiveEstado } from '@/lib/utils';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AmortizationTableProps {
  data: AmortRow[];
  prestamoId: number;
}

export function AmortizationTable({ data, prestamoId }: AmortizationTableProps) {
  const [revertTarget, setRevertTarget] = useState<number | null>(null);

  const handleCheckboxChange = async (checked: boolean, row: AmortRow) => {
    if (checked) {
      // Paying
      await recordPayment(prestamoId, row.quincenaNum, parseFloat(row.cuotaQuincenal), new Date(row.fechaQuincena));
    } else {
      // Reverting - Open confirmation
      setRevertTarget(row.quincenaNum);
    }
  };

  const confirmRevert = async () => {
    if (revertTarget !== null) {
      await revertPayment(prestamoId, revertTarget);
      setRevertTarget(null);
    }
  };

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
                      onChange={(e) => handleCheckboxChange(e.target.checked, row)}
                      className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 cursor-pointer"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={revertTarget !== null} onOpenChange={(open) => !open && setRevertTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la quincena #{revertTarget} como pendiente y ajustará el saldo del préstamo.
              Esta acción no se puede deshacer automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevert} className="bg-red-600 hover:bg-red-700">
              Revertir Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}