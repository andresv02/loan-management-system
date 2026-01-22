import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface SolicitudDetailsModalProps {
  solicitud: {
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
  };
  triggerClassName?: string;
}

export function SolicitudDetailsModal({ solicitud, triggerClassName }: SolicitudDetailsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Solicitud</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label>Nombre Completo</Label>
                <p className="text-sm font-medium">{solicitud.nombre}</p>
              </div>
              <div>
                <Label>Cédula</Label>
                <p className="text-sm">{solicitud.cedula}</p>
              </div>
              <div>
                <Label>Teléfono</Label>
                <p className="text-sm">{solicitud.telefono || 'N/A'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>Email</Label>
                <p className="text-sm break-words">{solicitud.email || 'N/A'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>Dirección</Label>
                <p className="text-sm break-words">{solicitud.direccion || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información Laboral</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Empresa</Label>
                <p className="text-sm break-words">{solicitud.empresa}</p>
              </div>
              <div>
                <Label>Salario Mensual</Label>
                <p className="text-sm">
                  {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(parseFloat(solicitud.salarioMensual))}
                </p>
              </div>
              <div>
                <Label>Meses en Empresa</Label>
                <p className="text-sm">{solicitud.mesesEnEmpresa}</p>
              </div>
              <div>
                <Label>Inicio Contrato</Label>
                <p className="text-sm">
                  {solicitud.inicioContrato ? new Date(solicitud.inicioContrato + 'T00:00:00').toLocaleDateString('es-PA') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Préstamo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Monto Solicitado</Label>
                <p className="text-sm font-bold text-emerald-600">
                  {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(parseFloat(solicitud.montoSolicitado))}
                </p>
              </div>
              <div>
                <Label>Duración</Label>
                <p className="text-sm">{solicitud.duracionMeses} meses</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información Bancaria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Banco</Label>
                <p className="text-sm break-words">{solicitud.banco || 'N/A'}</p>
              </div>
              <div>
                <Label>Tipo de Cuenta</Label>
                <p className="text-sm">{solicitud.tipoCuentaBancaria || 'N/A'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>Número de Cuenta</Label>
                <p className="text-sm font-mono">{solicitud.numeroCuenta || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {solicitud.fotoCedula && solicitud.fotoCedula.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Documentos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solicitud.fotoCedula.map((url, index) => {
                const isPdf = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?');
                return (
                  <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border group">
                    {isPdf ? (
                      <iframe
                        src={url}
                        className="w-full h-full"
                        title={`Documento ${index + 1}`}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={`Documento ${index + 1}`}
                        className="object-contain w-full h-full"
                      />
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                    >
                      Ver en pestaña nueva
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
