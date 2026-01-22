'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { ApprovalModal } from './ApprovalModal';
import { SolicitudDetailsModal } from './SolicitudDetailsModal';
import { declineSolicitud } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Company } from '@/lib/schema';

interface SolicitudWithPerson {
  id: number;
  montoSolicitado: string;
  duracionMeses: number;
  tipoCuentaBancaria: string;
  numeroCuenta: string;
  banco: string;
  cedula: string;
  nombre: string;
  empresa: string;
  salarioMensual: string;
  mesesEnEmpresa: number;
  inicioContrato: string;
  direccion: string;
  fotoCedula: string[];
  email: string;
  telefono: string;
}

interface SolicitudesTableProps {
  data: SolicitudWithPerson[];
  companies: Company[];
}

export default function SolicitudesTable({ data, companies }: SolicitudesTableProps) {
  const { toast } = useToast();
  const [isDeclining, setIsDeclining] = useState<number | null>(null);

  const handleDecline = async (solicitudId: number, nombre: string) => {
    setIsDeclining(solicitudId);
    try {
      await declineSolicitud(solicitudId);
      toast({
        title: "Solicitud Rechazada",
        description: `La solicitud de ${nombre} ha sido rechazada.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al rechazar la solicitud. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeclining(null);
    }
  };

  const columns: ColumnDef<SolicitudWithPerson>[] = [
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
      accessorKey: 'montoSolicitado',
      header: 'Monto Solicitado',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('montoSolicitado'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'duracionMeses',
      header: 'Duración (Meses)',
    },
    {
      accessorKey: 'salarioMensual',
      header: 'Salario Mensual',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('salarioMensual'));
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
        }).format(amount);
      },
    },
    {
      accessorKey: 'mesesEnEmpresa',
      header: 'Meses en Empresa',
    },
    {
      accessorKey: 'inicioContrato',
      header: 'Inicio Contrato',
      cell: ({ row }) => {
        const date = new Date((row.getValue('inicioContrato') as string) + 'T00:00:00');
        return date.toLocaleDateString('es-PA');
      },
    },
    {
      accessorKey: 'banco',
      header: 'Banco',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex gap-2">
            <SolicitudDetailsModal solicitud={s} />
            <ApprovalModal
              solicitudId={s.id}
              montoSolicitado={parseFloat(s.montoSolicitado)}
              duracionMeses={s.duracionMeses}
              cedula={s.cedula}
              nombre={s.nombre}
              empresa={s.empresa}
              companies={companies}
              trigger={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Aprobar</Button>}
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDecline(s.id, s.nombre)}
              disabled={isDeclining === s.id}
            >
              {isDeclining === s.id ? 'Rechazando...' : 'Rechazar'}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
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

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {data.length > 0 ? (
          data.map((s) => (
            <Card key={s.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex justify-between items-start">
                  <span>{s.nombre}</span>
                  <span className="text-sm font-normal text-muted-foreground">{s.cedula}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Empresa</p>
                    <p className="font-medium">{s.empresa}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto</p>
                    <p className="font-bold text-emerald-600">
                      {new Intl.NumberFormat('es-PA', {
                        style: 'currency',
                        currency: 'PAB',
                      }).format(parseFloat(s.montoSolicitado))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duración</p>
                    <p className="font-medium">{s.duracionMeses} meses</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Salario</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('es-PA', {
                        style: 'currency',
                        currency: 'PAB',
                      }).format(parseFloat(s.salarioMensual))}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Banco</p>
                    <p className="font-medium">{s.banco || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SolicitudDetailsModal solicitud={s} triggerClassName="w-full" />
                    </div>
                    <div className="flex-1">
                      <ApprovalModal
                        solicitudId={s.id}
                        montoSolicitado={parseFloat(s.montoSolicitado)}
                        duracionMeses={s.duracionMeses}
                        cedula={s.cedula}
                        nombre={s.nombre}
                        empresa={s.empresa}
                        companies={companies}
                        trigger={<Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">Aprobar</Button>}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDecline(s.id, s.nombre)}
                    disabled={isDeclining === s.id}
                  >
                    {isDeclining === s.id ? 'Rechazando...' : 'Rechazar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-8 bg-white rounded-lg border text-muted-foreground">
            No hay resultados.
          </div>
        )}
      </div>
    </div>
  );
}
