'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createDirectLoan } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, CalendarIcon, DollarSign } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/schema';

interface CreateLoanDialogProps {
  companies: Company[];
}

export function CreateLoanDialog({ companies }: CreateLoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inicioContrato, setInicioContrato] = useState<Date | undefined>();
  const [duracion, setDuracion] = useState<string>('6');
  const [tipoCuenta, setTipoCuenta] = useState<string>('ahorros');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  // Approval State
  const [montoSolicitado, setMontoSolicitado] = useState('');
  const [interesDeseado, setInteresDeseado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [cuotaQuincenal, setCuotaQuincenal] = useState(0);
  const [fechaInicioPrestamo, setFechaInicioPrestamo] = useState<Date | undefined>();
  const [proximoPagoDate, setProximoPagoDate] = useState<Date | undefined>();

  const { toast } = useToast();

  const totalQuincenas = parseInt(duracion) * 2;

  useEffect(() => {
    if (interesDeseado && montoSolicitado) {
      const principal = parseFloat(montoSolicitado);
      const interes = parseFloat(interesDeseado);
      if (!isNaN(principal) && !isNaN(interes) && totalQuincenas > 0) {
        const cuota = (principal + interes) / totalQuincenas;
        setCuotaQuincenal(cuota);
      }
    } else {
      setCuotaQuincenal(0);
    }
  }, [interesDeseado, montoSolicitado, totalQuincenas]);

  useEffect(() => {
    if (fechaInicioPrestamo) {
      setProximoPagoDate(getNextQuincena(fechaInicioPrestamo));
    } else {
      setProximoPagoDate(undefined);
    }
  }, [fechaInicioPrestamo]);

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

  const handleInteresDeseadoBlur = () => {
    const principal = parseFloat(montoSolicitado);
    if (interesDeseado && principal > 0) {
      const rate = (parseFloat(interesDeseado) / principal) * 100;
      setTasaInteres(rate.toFixed(2));
    }
  };

  const handleTasaInteresBlur = () => {
    const principal = parseFloat(montoSolicitado);
    if (tasaInteres && principal > 0) {
      const rate = parseFloat(tasaInteres) / 100;
      const interes = principal * rate;
      setInteresDeseado(interes.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (inicioContrato) {
        formData.set('inicioContrato', format(inicioContrato, 'yyyy-MM-dd'));
      }
      if (proximoPagoDate) {
        formData.set('proximoPago', format(proximoPagoDate, 'yyyy-MM-dd'));
      }
      if (selectedCompanyId) {
        formData.set('companyId', selectedCompanyId);
        // Also set the company name for the text field if needed, or handle in backend
        const company = companies.find(c => c.id.toString() === selectedCompanyId);
        if (company) {
          formData.set('empresa', company.name);
        }
      }
      
      await createDirectLoan(formData);

      toast({
        title: "Préstamo Creado",
        description: "El préstamo ha sido creado y aprobado exitosamente.",
      });

      setOpen(false);
      // Reset form state
      setInicioContrato(undefined);
      setDuracion('6');
      setTipoCuenta('ahorros');
      setMontoSolicitado('');
      setInteresDeseado('');
      setTasaInteres('');
      setFechaInicioPrestamo(undefined);
      setSelectedCompanyId('');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Hubo un error al crear el préstamo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4" />
          Nuevo Préstamo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Préstamo (Directo)</DialogTitle>
          <DialogDescription>
            Ingrese los datos del cliente, solicitud y aprobación para crear el préstamo directamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Personal & Laboral */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Datos Personales</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input id="cedula" name="cedula" required placeholder="8-888-8888" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input id="nombre" name="nombre" required placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input id="apellido" name="apellido" required placeholder="Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" name="telefono" placeholder="6000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input id="direccion" name="direccion" placeholder="Ciudad, Calle..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fotoCedula">Foto Cédula</Label>
                    <Input id="fotoCedula" name="fotoCedula" type="file" accept="image/*,application/pdf" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Datos Laborales</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Empresa *</Label>
                    <Select name="companyId" value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Hidden input for compatibility if needed, though we handle it in submit */}
                    <input type="hidden" name="empresa" value={companies.find(c => c.id.toString() === selectedCompanyId)?.name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salarioMensual">Salario Mensual</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">$</span>
                      </div>
                      <Input 
                        id="salarioMensual" 
                        name="salarioMensual" 
                        type="number" 
                        step="0.01" 
                        min="0"
                        className="pl-7" 
                        placeholder="0.00" 
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            e.target.value = val.toFixed(2);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mesesEnEmpresa">Meses en Empresa</Label>
                    <Input id="mesesEnEmpresa" name="mesesEnEmpresa" type="number" placeholder="0" min="0" />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="inicioContrato">Inicio Contrato</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !inicioContrato && "text-muted-foreground"
                          )}
                        >
                          {inicioContrato ? (
                            format(inicioContrato, "PPP")
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={inicioContrato}
                          onSelect={setInicioContrato}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <input type="hidden" name="inicioContrato" value={inicioContrato ? format(inicioContrato, 'yyyy-MM-dd') : ''} />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Préstamo & Aprobación */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Datos del Préstamo</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="montoSolicitado">Monto Solicitado *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">$</span>
                      </div>
                      <Input 
                        id="montoSolicitado" 
                        name="montoSolicitado" 
                        type="number" 
                        step="0.01" 
                        min="0"
                        required 
                        className="pl-7"
                        placeholder="0.00" 
                        value={montoSolicitado}
                        onChange={(e) => setMontoSolicitado(e.target.value)}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            const fixed = val.toFixed(2);
                            setMontoSolicitado(fixed);
                            e.target.value = fixed;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duracionMeses">Duración (Meses) *</Label>
                    <Select name="duracionMeses" value={duracion} onValueChange={setDuracion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione duración" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m} {m === 1 ? 'mes' : 'meses'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input id="banco" name="banco" placeholder="Banco General" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoCuentaBancaria">Tipo de Cuenta</Label>
                    <Select name="tipoCuentaBancaria" value={tipoCuenta} onValueChange={setTipoCuenta}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ahorros">Ahorros</SelectItem>
                        <SelectItem value="corriente">Corriente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCuenta">Número de Cuenta</Label>
                    <Input id="numeroCuenta" name="numeroCuenta" placeholder="00-00-00..." />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 text-emerald-700">Términos de Aprobación</h3>
                <div className="space-y-3 bg-emerald-50 p-4 rounded-md border border-emerald-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="interesDeseado">Interés Total</Label>
                      <Input
                        id="interesDeseado"
                        name="interesDeseado"
                        type="number"
                        step="0.01"
                        value={interesDeseado}
                        onChange={(e) => setInteresDeseado(e.target.value)}
                        onBlur={handleInteresDeseadoBlur}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tasaInteres">Tasa (%)</Label>
                      <Input
                        id="tasaInteres"
                        type="number"
                        step="0.01"
                        value={tasaInteres}
                        onChange={(e) => setTasaInteres(e.target.value)}
                        onBlur={handleTasaInteresBlur}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {cuotaQuincenal > 0 && (
                    <div className="pt-2">
                      <Label>Cuota Quincenal Estimada</Label>
                      <p className="text-xl font-bold text-emerald-700">
                        {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(cuotaQuincenal)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 flex flex-col pt-2">
                    <Label htmlFor="fechaInicioPrestamo">Fecha Inicio Préstamo</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !fechaInicioPrestamo && "text-muted-foreground"
                          )}
                        >
                          {fechaInicioPrestamo ? (
                            format(fechaInicioPrestamo, "PPP")
                          ) : (
                            <span>Seleccione fecha inicio</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fechaInicioPrestamo}
                          onSelect={setFechaInicioPrestamo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Próximo Pago (Calculado)</Label>
                    <div className="p-2 bg-white rounded border text-sm font-medium">
                      {proximoPagoDate ? format(proximoPagoDate, 'PPP') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !interesDeseado || !fechaInicioPrestamo || !montoSolicitado || !selectedCompanyId}>
              {isSubmitting ? 'Creando...' : 'Crear Préstamo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
