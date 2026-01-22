'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { recordPayment } from '@/lib/actions';


const paymentSchema = z.object({
  prestamoId: z.string().min(1, 'Préstamo requerido'),
  quincenaNum: z.string().min(1, 'Número de quincena requerido'),
  amount: z.string().min(1, 'Monto requerido'),
  paymentDate: z.date({
    required_error: 'Fecha de pago requerida',
  }),
});

interface ActiveLoan {
  id: number;
  principal: string;
  cuotaQuincenal: string;
  saldoPendiente: string;
  proximoPago: string;
  totalQuincenas: number;
  estado: string;
  cedula: string;
  nombre: string;
  apellido: string;
  montoSolicitado: string;
}

type PaymentFormData = z.infer<typeof paymentSchema>;

export function PaymentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null);
  const [availableQuincenas, setAvailableQuincenas] = useState<{
    quincenaNum: number;
    cuotaQuincenal: string;
    fechaQuincena: string;
    estado: string;
    effectiveEstado: string;
  }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date(),
    },
  });

  const paymentDate = watch('paymentDate');

  useEffect(() => {
    const fetchActiveLoans = async () => {
      try {
        const response = await fetch('/api/prestamos/active');
        if (response.ok) {
          const loans = await response.json();
          setActiveLoans(loans);
        }
      } catch (error) {
        console.error('Error fetching active loans:', error);
      }
    };

    fetchActiveLoans();
  }, []);

  const handleLoanSelect = async (loanId: string) => {
    const loan = activeLoans.find(l => l.id.toString() === loanId);
    if (loan) {
      setSelectedLoan(loan);
      setValue('prestamoId', loanId);

      // Fetch available quincenas
      try {
        const response = await fetch(`/api/prestamos/${loanId}/available-quincenas`);
        if (response.ok) {
          const quincenas = await response.json();
          setAvailableQuincenas(quincenas);
          if (quincenas.length > 0) {
            const first = quincenas[0];
            setValue('quincenaNum', first.quincenaNum.toString());
            setValue('amount', first.cuotaQuincenal);
          }
        }
      } catch (error) {
        console.error('Error fetching available quincenas:', error);
      }
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    setMessage('');

    try {
      await recordPayment(
        parseInt(data.prestamoId),
        parseInt(data.quincenaNum),
        parseFloat(data.amount),
        data.paymentDate
      );

      setMessage('¡Pago registrado exitosamente!');
      reset();
      setSelectedLoan(null);
    } catch (error) {
      setMessage('Error al registrar el pago. Por favor, inténtelo de nuevo.');
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="prestamoId" className="text-sm font-semibold text-gray-700 mb-2 block">
          Seleccionar Préstamo
        </Label>
        <Select onValueChange={handleLoanSelect}>
          <SelectTrigger className="w-full h-14 py-1 px-2 [&>span]:line-clamp-none border border-gray-300 hover:border-slate-400 focus:border-slate-500 transition-colors rounded-lg">
            <SelectValue placeholder="Elija un préstamo para registrar pago" />
          </SelectTrigger>
          <SelectContent>
            {activeLoans.map((loan) => (
              <SelectItem key={loan.id} value={loan.id.toString()}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {loan.id}
                  </div>
                  <div className="min-w-0 flex flex-col leading-tight">
                    <div className="text-sm font-medium leading-tight">{loan.nombre}</div>
                    <div className="text-xs text-gray-500 leading-tight">{loan.cedula}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.prestamoId && (
          <p className="text-sm text-red-600 mt-1">{errors.prestamoId?.message}</p>
        )}
      </div>

      {selectedLoan && (
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
              <span className="mr-2">🏠</span>
              Detalles del Préstamo
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-slate-600">Principal:</span>
                <p className="font-semibold text-slate-800">${parseFloat(selectedLoan.principal).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Cuota:</span>
                <p className="font-semibold text-slate-800">${parseFloat(selectedLoan.cuotaQuincenal).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Saldo Pendiente:</span>
                <p className="font-semibold text-slate-800">${parseFloat(selectedLoan.saldoPendiente).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Próximo Pago:</span>
                <p className="font-semibold text-slate-800">{new Date(selectedLoan.proximoPago + 'T00:00:00').toLocaleDateString('es-PA')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedLoan && availableQuincenas.length === 0 && (
        <Card className="bg-orange-50 border-orange-200 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-orange-800 font-medium text-center py-2">No hay quincenas pendientes para este préstamo.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="quincenaNum" className="text-sm font-semibold text-gray-700 mb-1 block">
            Número de Quincena
          </Label>
          <Select
            onValueChange={(value) => {
              setValue('quincenaNum', value);
              const selQuincena = availableQuincenas.find(q => q.quincenaNum.toString() === value);
              if (selQuincena) {
                setValue('amount', selQuincena.cuotaQuincenal);
              }
            }}
          >
            <SelectTrigger className="h-11 border border-gray-300 hover:border-slate-400 focus:border-slate-500 transition-colors [>span]:line-clamp-none rounded-lg">
              <SelectValue placeholder="Seleccione quincena" />
            </SelectTrigger>
            <SelectContent>
              {availableQuincenas.map((q) => (
                <SelectItem key={q.quincenaNum} value={q.quincenaNum.toString()}>
                  <div className="flex items-center gap-2">
                    <span>Quincena {q.quincenaNum}</span>
                    {q.effectiveEstado === 'atrasada' && (
                      <span className="text-xs text-red-600 font-bold">⚠️ ATRASADA</span>
                    )}
                    <span className="text-xs text-gray-500">
                      ({new Date(q.fechaQuincena + 'T00:00:00').toLocaleDateString('es-PA')})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.quincenaNum && (
            <p className="text-sm text-red-600 mt-1">{errors.quincenaNum?.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 mb-1 block">
            Monto Pagado
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount')}
            className="h-11 border border-gray-300 hover:border-slate-400 focus:border-slate-500 transition-colors"
            placeholder="Llenado automáticamente"
          />
          {errors.amount && (
            <p className="text-sm text-red-600 mt-1">{errors.amount?.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Fecha de Pago</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-11 justify-start text-left font-normal border border-gray-300 hover:border-slate-400 focus:border-slate-500 transition-colors',
                !paymentDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {paymentDate ? format(paymentDate, 'PPP') : 'Elija una fecha'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={paymentDate}
              onSelect={(date) => date && setValue('paymentDate', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.paymentDate && (
          <p className="text-sm text-red-600 mt-1">{errors.paymentDate?.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-300"
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Registrando...
          </div>
        ) : (
          '💳 Registrar Pago'
        )}
      </Button>

      {message && (
        <div className={cn(
          'p-3 rounded-lg border text-center font-medium',
          message.includes('Error') || message.includes('Error')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-green-50 border-green-200 text-green-800'
        )}>
          {message}
        </div>
      )}
    </form>
  );
}