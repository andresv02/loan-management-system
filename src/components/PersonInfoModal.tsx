'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PersonInfo {
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipoCuentaBancaria: string | null;
  numeroCuenta: string | null;
  banco: string | null;
  salarioMensual: string | null;
}

interface PersonInfoModalProps {
  nombre: string;
  cedula: string;
  empresa: string;
  personInfo?: PersonInfo;
}

export function PersonInfoModal({ nombre, cedula, empresa, personInfo }: PersonInfoModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <User className="h-4 w-4 mr-1" />
          Info Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Información de la Persona</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg mb-3 text-slate-700">Datos Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cédula</p>
                <p className="font-medium">{cedula}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{empresa || 'N/A'}</p>
              </div>
              {personInfo?.salarioMensual && (
                <div>
                  <p className="text-sm text-muted-foreground">Salario Mensual</p>
                  <p className="font-medium">{formatCurrency(personInfo.salarioMensual)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {(personInfo?.email || personInfo?.telefono || personInfo?.direccion) && (
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 text-slate-700">Información de Contacto</h3>
              <div className="grid grid-cols-1 gap-4">
                {personInfo?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{personInfo.email}</p>
                  </div>
                )}
                {personInfo?.telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{personInfo.telefono}</p>
                  </div>
                )}
                {personInfo?.direccion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{personInfo.direccion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banking Info */}
          {(personInfo?.tipoCuentaBancaria || personInfo?.numeroCuenta || personInfo?.banco) && (
            <div>
              <h3 className="font-semibold text-lg mb-3 text-slate-700">Información Bancaria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personInfo?.banco && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p className="font-medium">{personInfo.banco}</p>
                  </div>
                )}
                {personInfo?.tipoCuentaBancaria && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Cuenta</p>
                    <p className="font-medium">{personInfo.tipoCuentaBancaria}</p>
                  </div>
                )}
                {personInfo?.numeroCuenta && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Número de Cuenta</p>
                    <p className="font-medium font-mono">{personInfo.numeroCuenta}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!personInfo && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay información adicional disponible para esta persona.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
