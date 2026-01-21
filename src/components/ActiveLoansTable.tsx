'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { AmortizationTable } from './AmortizationTable';
import { deletePrestamo } from '@/lib/actions';
import { cn, getEffectivePrestamoEstado } from '@/lib/utils';

import type { Prestamo, AmortRow } from '@/types';

interface PrestamoWithPerson {
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
  amortizacion: AmortRow[];
}

interface ActiveLoansTableProps {
  data: PrestamoWithPerson[];
}

export function ActiveLoansTable({ data }: ActiveLoansTableProps) {
  const [expanded, setExpanded] = useState({});

  const columns: ColumnDef<PrestamoWithPerson>[] = [
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => row.toggleExpanded()}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                row.getIsExpanded() ? 'rotate-180' : ''
              }`}
            />
            <span className="sr-only">Expandir/Contraer fila</span>
          </Button>
        );
      },
    },
    {
      accessorKey: 'cedula',
      header: 'Cedula / Nombre',
      cell: ({ row }) => {
        const person = row.original;
        return (
          `${person.cedula} - ${person.nombre}`
        );
      },
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
    },
    {
      accessorKey: 'principal',
      header: 'Principal',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('principal'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'cuotaQuincenal',
      header: 'Cuota',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('cuotaQuincenal'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'saldoPendiente',
      header: 'Saldo Pendiente',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('saldoPendiente'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'proximoPago',
      header: 'Próximo Pago',
      cell: ({ row }) => {
        const date = new Date(row.getValue('proximoPago'));
        return date.toLocaleDateString('es-PA');
      },
    },
    {
      accessorKey: 'interesTotal',
      header: 'Interés Total',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('interesTotal'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const prestamo = row.original;
        const effectiveEstado = getEffectivePrestamoEstado(prestamo.estado, prestamo.amortizacion);
        const estadoLabel = effectiveEstado.charAt(0).toUpperCase() + effectiveEstado.slice(1);
        
        return (
          <span className={
            effectiveEstado === 'atrasada'
              ? 'text-red-600 font-semibold'
              : effectiveEstado === 'completada'
              ? 'text-green-600 font-semibold'
              : effectiveEstado === 'activa'
              ? 'text-blue-600 font-semibold'
              : ''
          }>
            {estadoLabel}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const prestamo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deletePrestamo(prestamo.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    enableExpanding: true,
  });

  return (
    <div className="w-full">
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      row.getIsExpanded() ? 'bg-muted/50' : '',
                      'cursor-pointer hover:bg-muted/30'
                    )}
                    onClick={(e) => {
                      // Don't toggle if clicking on interactive elements
                      if ((e.target as HTMLElement).closest('[role="button"], button, input, select, textarea')) {
                        return;
                      }
                      row.toggleExpanded();
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && row.original.amortizacion && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="h-96 overflow-auto [&>table]:border-none">
                          <AmortizationTable data={row.original.amortizacion} prestamoId={row.original.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) mostrada(s).
        </div>
        <div className="flex gap-2">
          {table.getPageOptions().map(page => (
            <Button
              key={page}
              variant={table.getState().pagination.pageIndex === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => table.setPageIndex(page)}
            >
              {page + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}