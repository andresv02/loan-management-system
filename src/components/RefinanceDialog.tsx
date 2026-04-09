'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { refinanceLoan } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { PrestamoWithDetails } from '@/types/app';

interface RefinanceDialogProps {
  prestamo: PrestamoWithDetails;
  trigger?: React.ReactElement;
}

export function RefinanceDialog({ prestamo, trigger }: RefinanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const oldSaldo = parseFloat(prestamo.saldoPendiente);
  const capitalPaid = useMemo(() => {
    return prestamo.amortizacion
      .filter((row) => row.estado === 'pagada')
      .reduce((sum, row) => sum + parseFloat(row.capital), 0);
  }, [prestamo.amortizacion]);

  const defaultDuracion = useMemo(() => {
    const quincenas = prestamo.amortizacion.length || 6 * 2;
    return Math.max(1, Math.round(quincenas / 2));
  }, [prestamo.amortizacion.length]);

  const [newPrincipal, setNewPrincipal] = useState(oldSaldo.toFixed(2));
  const [interesDeseado, setInteresDeseado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [duracion, setDuracion] = useState(defaultDuracion.toString());
  const [fechaInicioPrestamo, setFechaInicioPrestamo] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [proximoPagoDate, setProximoPagoDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const totalQuincenas = parseInt(duracion) * 2;

  const cuotaQuincenal = useMemo(() => {
    const principal = parseFloat(newPrincipal);
    const interes = parseFloat(interesDeseado);
    if (!isNaN(principal) && !isNaN(interes) && totalQuincenas > 0) {
      return (principal + interes) / totalQuincenas;
    }
    return 0;
  }, [newPrincipal, interesDeseado, totalQuincenas]);

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

    let quincena15 = new Date(year, month, 15);
    quincena15.setHours(0, 0, 0, 0);
    if (quincena15 >= date) {
      return quincena15;
    }

    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(0, 0, 0, 0);
    if (endOfMonth >= date) {
      return endOfMonth;
    }

    return new Date(year, month + 1, 15);
  };

  const handleInteresDeseadoBlur = () => {
    const principal = parseFloat(newPrincipal);
    if (interesDeseado && principal > 0) {
      const rate = (parseFloat(interesDeseado) / principal) * 100;
      setTasaInteres(rate.toFixed(2));
    }
  };

  const handleTasaInteresBlur = () => {
    const principal = parseFloat(newPrincipal);
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
      if (proximoPagoDate) {
        formData.set('proximoPago', format(proximoPagoDate, 'yyyy-MM-dd'));
      }

      await refinanceLoan(formData);

      toast({
        title: 'Préstamo Refinanciado',
        description: `Se creó un nuevo préstamo por ${formatCurrency(newPrincipal)}. El préstamo anterior fue marcado como refinanciado.`,
      });

      setOpen(false);
      // Reset
      setNewPrincipal(oldSaldo.toFixed(2));
      setInteresDeseado('');
      setTasaInteres('');
      setDuracion(defaultDuracion.toString());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setFechaInicioPrestamo(today);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Hubo un error al refinanciar el préstamo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex w-full">{trigger}</span>
      ) : (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <RefreshCw className="mr-1 h-4 w-4" />
            Refinanciar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refinanciar Préstamo #{prestamo.id}</DialogTitle>
          <DialogDescription>
            Cliente: <strong>{prestamo.nombre}</strong> | Cédula: {prestamo.cedula}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="oldPrestamoId" value={prestamo.id} />

          {/* Old Loan Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg border">
            <div>
              <p className="text-sm text-muted-foreground">Monto Original</p>
              <p className="text-lg font-semibold">{formatCurrency(prestamo.principal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Pendiente Actual</p>
              <p className="text-lg font-semibold">{formatCurrency(oldSaldo)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capital Pagado</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(capitalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interés Retenido</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(
                  prestamo.amortizacion
                    .filter((row) => row.estado === 'pagada')
                    .reduce((sum, row) => sum + parseFloat(row.interes), 0)
                )}
              </p>
            </div>
          </div>

          {/* New Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Nuevos Términos</h3>

            <div className="space-y-2">
              <Label htmlFor="newPrincipal">Nuevo Principal</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground">$</span>
                </div>
                <Input
                  id="newPrincipal"
                  name="newPrincipal"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="pl-7"
                  placeholder="0.00"
                  value={newPrincipal}
                  onChange={(e) => setNewPrincipal(e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setNewPrincipal(val.toFixed(2));
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Diferencia vs saldo actual:{' '}
                <span className="font-medium text-slate-700">
                  {formatCurrency(Math.max(0, parseFloat(newPrincipal || '0')) - oldSaldo)}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interesDeseado">Interés Total</Label>
                <Input
                  id="interesDeseado"
                  name="interesDeseado"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={interesDeseado}
                  onChange={(e) => setInteresDeseado(e.target.value)}
                  onBlur={handleInteresDeseadoBlur}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tasaInteres">Tasa (%)</Label>
                <Input
                  id="tasaInteres"
                  type="number"
                  step="0.01"
                  min="0"
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

            <div className="space-y-2">
              <Label htmlFor="duracionMeses">Duración (Meses) *</Label>
              <Select name="duracionMeses" value={duracion} onValueChange={setDuracion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione duración" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m} {m === 1 ? 'mes' : 'meses'} ({m * 2} quincenas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Próximo Pago (Calculado)</Label>
              <div className="p-2 bg-white rounded border text-sm font-medium">
                {proximoPagoDate ? format(proximoPagoDate, 'PPP') : '-'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !interesDeseado || !newPrincipal}
            >
              {isSubmitting ? 'Refinanciando...' : 'Confirmar Refinanciamiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
