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
import { PersonInfoModal } from './PersonInfoModal';
import { PrestamoWithDetails, Company } from '@/types/app';

interface PrestamosTableProps {
  data: PrestamoWithDetails[];
  companies?: Company[];
}

export default function PrestamosTable({ data, companies = [] }: PrestamosTableProps) {
  const [expanded, setExpanded] = useState({});

  const [estadoFilter, setEstadoFilter] = useState<string>(LOAN_STATUS.ACTIVE);
  const [subEstadoFilter, setSubEstadoFilter] = useState<'todos' | 'atrasada'>('todos');
  const [companiaFilter, setCompaniaFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'id' | 'nombre' | 'saldo'>('id');

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { toast } = useToast();
  const { exportLoans, exportLoansPDF } = useLoanExport();

  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      const effectiveEstado = getEffectivePrestamoEstado(item.estado, item.amortizacion);
      
      // Estado filter
      if (estadoFilter !== 'todos') {
        if (estadoFilter !== LOAN_STATUS.ACTIVE) {
          if (effectiveEstado !== estadoFilter) return false;
        } else {
          // For activa, apply subfilter
          if (subEstadoFilter === LOAN_STATUS.LATE) {
            if (effectiveEstado !== LOAN_STATUS.LATE) return false;
          } else {
            // 'todos' shows all activa (including atrasada)
            if (effectiveEstado !== LOAN_STATUS.ACTIVE && effectiveEstado !== LOAN_STATUS.LATE) return false;
          }
        }
      }
      
      // Company filter
      if (companiaFilter !== 'todos' && item.empresa !== companiaFilter) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'id') {
        return a.id - b.id;
      } else if (sortBy === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'saldo') {
        return parseFloat(b.saldoPendiente) - parseFloat(a.saldoPendiente);
      }
      return 0;
    });
    
    return filtered;
  }, [data, estadoFilter, subEstadoFilter, companiaFilter, sortBy]);

  const handleExport = () => {
    exportLoans(data, selectedCompany, () => {
      setExportDialogOpen(false);
      setSelectedCompany(null);
    });
  };

  const handleExportPDF = () => {
    exportLoansPDF(data, selectedCompany, () => {
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
          <div className="flex items-center gap-2">
            <PersonInfoModal 
              nombre={prestamo.nombre}
              cedula={prestamo.cedula}
              empresa={prestamo.empresa}
              personInfo={prestamo.personInfo}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => deletePrestamo(prestamo.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
      <div className="mb-6 p-4 bg-muted/50 rounded-lg border space-y-4">
        {/* First Row: Status and Company Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filtros:</span>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
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
            
            <Select value={companiaFilter} onValueChange={setCompaniaFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las Empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.name}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Second Row: Sorting and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(value: 'id' | 'nombre' | 'saldo') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">ID (Default)</SelectItem>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="saldo">Saldo Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => setExportDialogOpen(true)}
            disabled={companies.length === 0}
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
        loadingCompanies={false}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        onExport={handleExport}
        onExportPDF={handleExportPDF}
      />

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border bg-background">
        <div className="relative w-full overflow-auto max-h-[70vh]">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-background">
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
          </table>
        </div>
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
