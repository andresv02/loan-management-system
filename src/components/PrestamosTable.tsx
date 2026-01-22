'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { cn, getEffectivePrestamoEstado, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LOAN_STATUS } from '@/lib/constants';
import { useLoanExport } from '@/hooks/use-loan-export';
import { PrestamosExportDialog } from './PrestamosExportDialog';
import { PrestamosMobileCard } from './PrestamosMobileCard';
import { PrestamoWithDetails, Company } from '@/types/app';

interface PrestamosTableProps {
  data: PrestamoWithDetails[];
}

export default function PrestamosTable({ data }: PrestamosTableProps) {
  const [expanded, setExpanded] = useState({});

  const [estadoFilter, setEstadoFilter] = useState<string>(LOAN_STATUS.ACTIVE);
  const [subEstadoFilter, setSubEstadoFilter] = useState<'todos' | 'atrasada'>('todos');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { toast } = useToast();
  const { exportLoans } = useLoanExport();

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/companies');
      if (!res.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data: Company[] = await res.json();
      setCompanies(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas para exportar.",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const effectiveEstado = getEffectivePrestamoEstado(item.estado, item.amortizacion);
      
      if (estadoFilter !== LOAN_STATUS.ACTIVE) {
        return effectiveEstado === estadoFilter;
      }
      
      // For activa, apply subfilter
      if (subEstadoFilter === LOAN_STATUS.LATE) {
        return effectiveEstado === LOAN_STATUS.LATE;
      }
      
      // 'todos' shows all activa (including atrasada)
      return effectiveEstado === LOAN_STATUS.ACTIVE || effectiveEstado === LOAN_STATUS.LATE;
    });
  }, [data, estadoFilter, subEstadoFilter]);

  const handleExport = () => {
    exportLoans(data, selectedCompany, () => {
      setExportDialogOpen(false);
      setSelectedCompany(null);
    });
  };

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
      header: 'Cédula',
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
    },
    {
      accessorKey: 'principal',
      header: 'Principal',
      cell: ({ row }) => formatCurrency(row.getValue('principal')),
    },
    {
      accessorKey: 'cuotaQuincenal',
      header: 'Cuota',
      cell: ({ row }) => formatCurrency(row.getValue('cuotaQuincenal')),
    },
    {
      accessorKey: 'saldoPendiente',
      header: 'Saldo Pendiente',
      cell: ({ row }) => formatCurrency(row.getValue('saldoPendiente')),
    },
    {
      accessorKey: 'proximoPago',
      header: 'Próximo Pago',
      cell: ({ row }) => formatDate(row.getValue('proximoPago')),
    },
    {
      accessorKey: 'interesTotal',
      header: 'Interés Total',
      cell: ({ row }) => formatCurrency(row.getValue('interesTotal')),
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
            effectiveEstado === LOAN_STATUS.LATE
              ? 'text-red-600 font-semibold'
              : effectiveEstado === LOAN_STATUS.COMPLETED
              ? 'text-green-600 font-semibold'
              : effectiveEstado === LOAN_STATUS.ACTIVE
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filtrar por estado:</span>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value={LOAN_STATUS.ACTIVE}>Activa</SelectItem>
                <SelectItem value={LOAN_STATUS.COMPLETED}>Completada</SelectItem>
                <SelectItem value={LOAN_STATUS.REJECTED}>Rechazada</SelectItem>
              </SelectContent>
            </Select>
            
            {estadoFilter === LOAN_STATUS.ACTIVE && (
              <Select value={subEstadoFilter} onValueChange={(value: 'todos' | 'atrasada') => setSubEstadoFilter(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Activos</SelectItem>
                  <SelectItem value={LOAN_STATUS.LATE}>Solo Atrasadas</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Button
          onClick={() => setExportDialogOpen(true)}
          disabled={loadingCompanies || companies.length === 0}
          className="whitespace-nowrap"
        >
          Exportar
        </Button>
      </div>
      </div>

      <PrestamosExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        companies={companies}
        loadingCompanies={loadingCompanies}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        onExport={handleExport}
      />

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
                    if (estadoFilter === LOAN_STATUS.ACTIVE) {
                      return subEstadoFilter === LOAN_STATUS.LATE
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
          table.getRowModel().rows.map((row) => (
            <PrestamosMobileCard
              key={row.id}
              prestamo={row.original}
              isExpanded={row.getIsExpanded()}
              toggleExpanded={() => row.toggleExpanded()}
            />
          ))
        ) : (
          <div className="text-center p-8 bg-white rounded-lg border text-muted-foreground">
            {(() => {
              if (estadoFilter === 'todos') return 'No hay préstamos.';
              if (estadoFilter === LOAN_STATUS.ACTIVE) {
                return subEstadoFilter === LOAN_STATUS.LATE
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
