'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, MoreHorizontal, Trash2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AmortizationTable } from './AmortizationTable';
import { deletePrestamo } from '@/lib/actions';
import { cn, getEffectivePrestamoEstado } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import type { AmortRow } from '@/types';

interface PrestamoWithDetails {
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

interface PrestamosTableProps {
  data: PrestamoWithDetails[];
}

export default function PrestamosTable({ data }: PrestamosTableProps) {
  const [expanded, setExpanded] = useState({});

  const [estadoFilter, setEstadoFilter] = useState<string>('activa');
  const [subEstadoFilter, setSubEstadoFilter] = useState<'todos' | 'atrasada'>('todos');

  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const effectiveEstado = getEffectivePrestamoEstado(item.estado, item.amortizacion);
      
      if (estadoFilter !== 'activa') {
        return effectiveEstado === estadoFilter;
      }
      
      // For activa, apply subfilter
      if (subEstadoFilter === 'atrasada') {
        return effectiveEstado === 'atrasada';
      }
      
      // 'todos' shows all activa (including atrasada)
      return effectiveEstado === 'activa' || effectiveEstado === 'atrasada';
    });
  }, [data, estadoFilter, subEstadoFilter]);

  const columns: ColumnDef<PrestamoWithDetails>[] = [
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
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'cedula',
      header: 'Cedula / Nombre',
      cell: ({ row }) => {
        const person = row.original;
        return `${person.cedula} - ${person.nombre}`;
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
      id: 'tasaInteres',
      header: 'Tasa (%)',
      cell: ({ row }) => {
        const principal = parseFloat(row.original.principal);
        const interes = parseFloat(row.original.interesTotal);
        const tasa = ((interes / principal) * 100).toFixed(1);
        return `${tasa}%`;
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({
                title: "Función en desarrollo",
                description: `Ver detalles del préstamo ${prestamo.id}`
              })}>
                Ver
              </DropdownMenuItem>
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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    enableExpanding: true,
  });

  return (
    <div className="w-full">
      <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filtrar por estado:</span>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            
            {estadoFilter === 'activa' && (
              <Select value={subEstadoFilter} onValueChange={(value: 'todos' | 'atrasada') => setSubEstadoFilter(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Activos</SelectItem>
                  <SelectItem value="atrasada">Solo Atrasadas</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border bg-background">
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
                  {(() => {
                    if (estadoFilter === 'todos') return 'No hay préstamos.';
                    if (estadoFilter === 'activa') {
                      return subEstadoFilter === 'atrasada'
                        ? 'No hay préstamos atrasados.'
                        : 'No hay préstamos activos.';
                    }
                    return `No hay préstamos ${estadoFilter}.`;
                  })()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const prestamo = row.original;
            const effectiveEstado = getEffectivePrestamoEstado(prestamo.estado, prestamo.amortizacion);
            const estadoLabel = effectiveEstado.charAt(0).toUpperCase() + effectiveEstado.slice(1);
            
            return (
              <Card key={row.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex justify-between items-start">
                    <span>{prestamo.nombre}</span>
                    <span className={cn(
                      "text-sm px-2 py-1 rounded-full",
                      effectiveEstado === 'atrasada'
                        ? 'bg-red-100 text-red-700'
                        : effectiveEstado === 'completada'
                        ? 'bg-green-100 text-green-700'
                        : effectiveEstado === 'activa'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {estadoLabel}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="font-medium">#{prestamo.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cedula</p>
                      <p className="font-medium">{prestamo.cedula}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Empresa</p>
                      <p className="font-medium">{prestamo.empresa}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB',
                        }).format(parseFloat(prestamo.principal))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo Pendiente</p>
                      <p className="font-bold text-emerald-600">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB',
                        }).format(parseFloat(prestamo.saldoPendiente))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cuota</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB',
                        }).format(parseFloat(prestamo.cuotaQuincenal))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Próximo Pago</p>
                      <p className="font-medium">
                        {new Date(prestamo.proximoPago).toLocaleDateString('es-PA')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getIsExpanded() ? 'Ocultar Tabla de Pagos' : 'Ver Tabla de Pagos'}
                    </Button>
                    
                    {row.getIsExpanded() && (
                      <div className="mt-2 overflow-x-auto">
                        <AmortizationTable data={prestamo.amortizacion} prestamoId={prestamo.id} />
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => deletePrestamo(prestamo.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center p-8 bg-white rounded-lg border text-muted-foreground">
            {(() => {
              if (estadoFilter === 'todos') return 'No hay préstamos.';
              if (estadoFilter === 'activa') {
                return subEstadoFilter === 'atrasada'
                  ? 'No hay préstamos atrasados.'
                  : 'No hay préstamos activos.';
              }
              return `No hay préstamos ${estadoFilter}.`;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
