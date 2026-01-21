'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { approveSolicitud } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Company } from '@/lib/schema';

interface ApprovalModalProps {
  solicitudId: number;
  montoSolicitado: number;
  duracionMeses: number;
  cedula: string;
  nombre: string;
  empresa: string;
  companies: Company[];
  trigger: React.ReactNode;
}

export function ApprovalModal({ solicitudId, montoSolicitado, duracionMeses, cedula, nombre, empresa, companies, trigger }: ApprovalModalProps) {
  const [open, setOpen] = useState(false);
  const [interesDeseado, setInteresDeseado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [cuotaQuincenal, setCuotaQuincenal] = useState(0);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [proximoPagoDate, setProximoPagoDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const { toast } = useToast();

  const totalQuincenas = duracionMeses * 2;
  const sugerenciaInteres = (montoSolicitado * 0.12).toFixed(2);

  useEffect(() => {
    if (interesDeseado) {
      const cuota = (montoSolicitado + parseFloat(interesDeseado)) / totalQuincenas;
      setCuotaQuincenal(cuota);
    }
  }, [interesDeseado, montoSolicitado, totalQuincenas]);

  useEffect(() => {
    if (fechaInicio) {
      setProximoPagoDate(getNextQuincena(fechaInicio));
    } else {
      setProximoPagoDate(undefined);
    }
  }, [fechaInicio]);

  const handleInteresDeseadoBlur = () => {
    if (interesDeseado && montoSolicitado > 0) {
      const rate = (parseFloat(interesDeseado) / montoSolicitado) * 100;
      setTasaInteres(rate.toFixed(2));
    }
  };

  const handleTasaInteresBlur = () => {
    if (tasaInteres) {
      const rate = parseFloat(tasaInteres) / 100;
      const interes = montoSolicitado * rate;
      setInteresDeseado(interes.toFixed(2));
    }
  };

  const getNextQuincena = (fechaInicio: Date): Date => {
    const date = new Date(fechaInicio);
    date.setHours(0, 0, 0, 0);
    const year = date.getFullYear();
    const month = date.getMonth();

    // 15th this month
    let quincena15 = new Date(year, month, 15);
    quincena15.setHours(0, 0, 0, 0);
    if (quincena15 >= date) {
      return quincena15;
    }

    // End of this month
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(0, 0, 0, 0);
    if (endOfMonth >= date) {
      return endOfMonth;
    }

    // 15th next month
    return new Date(year, month + 1, 15);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!interesDeseado || !fechaInicio || !proximoPagoDate || !selectedCompanyId) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('solicitudId', solicitudId.toString());
      formData.append('interesDeseado', interesDeseado);
      formData.append('proximoPago', format(proximoPagoDate!, 'yyyy-MM-dd'));
      formData.append('companyId', selectedCompanyId);

      await approveSolicitud(formData);

      toast({
        title: "¡Préstamo Aprobado! 🎉",
        description: `El préstamo para ${nombre} ha sido aprobado exitosamente.`,
      });

      setOpen(false);
      // Reset form
      setInteresDeseado('');
      setTasaInteres('');
      setCuotaQuincenal(0);
      setFechaInicio(undefined);
      setProximoPagoDate(undefined);
      setSelectedCompanyId('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al aprobar el préstamo. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aprobar Solicitud</DialogTitle>
          <DialogDescription>
            Revisa los detalles de la solicitud y configura los parámetros de interés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Principal</Label>
              <p className="text-sm font-medium">
                {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(montoSolicitado)}
              </p>
            </div>
            <div>
              <Label>Duración</Label>
              <p className="text-sm font-medium">{duracionMeses} meses ({totalQuincenas} quincenas)</p>
            </div>
            <div>
              <Label>Cédula</Label>
              <p className="text-sm font-medium">{cedula}</p>
            </div>
            <div>
              <Label>Nombre</Label>
              <p className="text-sm font-medium">{nombre}</p>
            </div>
            <div className="col-span-2">
              <Label htmlFor="company">Compañía</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar compañía" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="solicitudId" value={solicitudId} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interesDeseado">Interés Total Deseado</Label>
                <Input
                  id="interesDeseado"
                  name="interesDeseado"
                  type="text"
                  value={interesDeseado}
                  onChange={(e) => setInteresDeseado(e.target.value)}
                  onBlur={handleInteresDeseadoBlur}
                  placeholder={sugerenciaInteres}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tasaInteres">Tasa de Interés(%)</Label>
                <Input
                  id="tasaInteres"
                  type="text"
                  value={tasaInteres}
                  onChange={(e) => setTasaInteres(e.target.value)}
                  onBlur={handleTasaInteresBlur}
                  placeholder="12.00"
                />
              </div>
            </div>
            {cuotaQuincenal > 0 && (
              <div>
                <Label>Cuota Quincenal Calculada</Label>
                <p className="text-sm font-medium">
                  {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(cuotaQuincenal)}
                </p>
              </div>
            )}
            <div>
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !fechaInicio && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? format(fechaInicio, 'PPP') : <span>Elija una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Próximo Pago (autogenerado)</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {proximoPagoDate ? (
                  <p className="text-lg font-semibold">{format(proximoPagoDate, 'PPP')}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Seleccione Fecha Inicio para ver Próximo Pago</p>
                )}
              </div>
              <input
                type="hidden"
                name="proximoPago"
                value={proximoPagoDate ? format(proximoPagoDate, 'yyyy-MM-dd') : ''}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting || !interesDeseado || !fechaInicio || !proximoPagoDate || !selectedCompanyId}>
              {isSubmitting ? 'Aprobando...' : 'Aprobar Préstamo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}