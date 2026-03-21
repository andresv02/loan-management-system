'use client';

import { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Calculator, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { generateFrenchAmortization, getNextQuincena } from '@/lib/amortization';
import { CotizadorResults } from './CotizadorResults';

interface AmortRowData {
  quincenaNum: number;
  fechaQuincena: string;
  cuotaQuincenal: string;
  interes: string;
  capital: string;
  saldoInicial: string;
  saldoFinal: string;
}

interface CotizacionResult {
  monto: number;
  interesTotal: number;
  cuotaQuincenal: number;
  totalQuincenas: number;
  totalAPagar: number;
  proximoPago: Date;
  tablaAmortizacion: AmortRowData[];
}

export function CotizadorForm() {
  // Form state
  const [monto, setMonto] = useState('');
  const [duracionMeses, setDuracionMeses] = useState('6');
  const [interesTotal, setInteresTotal] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Calculated values
  const [cuotaQuincenal, setCuotaQuincenal] = useState(0);
  const [proximoPagoDate, setProximoPagoDate] = useState<Date | undefined>();
  
  // Results
  const [resultado, setResultado] = useState<CotizacionResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const totalQuincenas = parseInt(duracionMeses) * 2;

  // Duration options: 1-12 months
  const durationOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} ${i + 1 === 1 ? 'mes' : 'meses'} (${(i + 1) * 2} quincenas)`
  }));

  // Calculate cuota when interes changes
  useEffect(() => {
    if (interesTotal && monto) {
      const montoNum = parseFloat(monto);
      const interesNum = parseFloat(interesTotal);
      const cuota = (montoNum + interesNum) / totalQuincenas;
      setCuotaQuincenal(cuota);
    } else {
      setCuotaQuincenal(0);
    }
  }, [interesTotal, monto, totalQuincenas]);

  // Calculate proximo pago when fecha inicio changes
  useEffect(() => {
    if (fechaInicio) {
      setProximoPagoDate(getNextQuincena(fechaInicio));
    } else {
      setProximoPagoDate(undefined);
    }
  }, [fechaInicio]);

  // Sync interes total with tasa%
  const handleInteresBlur = () => {
    if (interesTotal && monto && parseFloat(monto) > 0) {
      const rate = (parseFloat(interesTotal) / parseFloat(monto)) * 100;
      setTasaInteres(rate.toFixed(2));
    }
  };

  const handleTasaBlur = () => {
    if (tasaInteres && monto) {
      const rate = parseFloat(tasaInteres) / 100;
      const interes = parseFloat(monto) * rate;
      setInteresTotal(interes.toFixed(2));
    }
  };

  const handleGenerarTabla = () => {
    if (!monto || !interesTotal || !fechaInicio || !proximoPagoDate) return;

    const montoNum = parseFloat(monto);
    const interesNum = parseFloat(interesTotal);
    
    const amortRows = generateFrenchAmortization(
      montoNum,
      interesNum,
      totalQuincenas,
      proximoPagoDate
    );

    const result: CotizacionResult = {
      monto: montoNum,
      interesTotal: interesNum,
      cuotaQuincenal: (montoNum + interesNum) / totalQuincenas,
      totalQuincenas,
      totalAPagar: montoNum + interesNum,
      proximoPago: proximoPagoDate,
      tablaAmortizacion: amortRows,
    };

    setResultado(result);
    setShowResults(true);
  };

  const handleLimpiar = () => {
    setMonto('');
    setDuracionMeses('6');
    setInteresTotal('');
    setTasaInteres('');
    setFechaInicio(new Date());
    setCuotaQuincenal(0);
    setResultado(null);
    setShowResults(false);
  };

  const isFormValid = monto && interesTotal && fechaInicio && proximoPagoDate && parseFloat(monto) > 0;

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Parámetros del Préstamo</h2>
            <p className="text-sm text-gray-600">Ingrese los datos para calcular la cotización</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monto */}
          <div>
            <Label htmlFor="monto">Monto del Préstamo (PAB)</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="5000.00"
              className="mt-1"
            />
          </div>

          {/* Duración */}
          <div>
            <Label htmlFor="duracion">Duración</Label>
            <Select value={duracionMeses} onValueChange={setDuracionMeses}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar duración" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interés Total */}
          <div>
            <Label htmlFor="interesTotal">Interés Total Deseado (PAB)</Label>
            <Input
              id="interesTotal"
              type="number"
              min="0"
              step="0.01"
              value={interesTotal}
              onChange={(e) => setInteresTotal(e.target.value)}
              onBlur={handleInteresBlur}
              placeholder="600.00"
              className="mt-1"
            />
          </div>

          {/* Tasa de Interés */}
          <div>
            <Label htmlFor="tasaInteres">Tasa de Interés (%)</Label>
            <Input
              id="tasaInteres"
              type="number"
              min="0"
              step="0.01"
              value={tasaInteres}
              onChange={(e) => setTasaInteres(e.target.value)}
              onBlur={handleTasaBlur}
              placeholder="12.00"
              className="mt-1"
            />
          </div>

          {/* Fecha de Inicio */}
          <div>
            <Label>Fecha de Inicio</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal mt-1 ${
                    !fechaInicio && 'text-muted-foreground'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaInicio ? format(fechaInicio, 'PPP', { locale: undefined }) : <span>Elija una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaInicio}
                  onSelect={(date) => {
                    setFechaInicio(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Próximo Pago (Auto-calculado) */}
          <div>
            <Label>Próximo Pago</Label>
            <Input
              value={proximoPagoDate ? format(proximoPagoDate, 'PPP') : 'Seleccione Fecha de Inicio'}
              disabled
              className="mt-1 font-semibold bg-gray-50"
            />
          </div>
        </div>

        {/* Cuota Preview */}
        {cuotaQuincenal > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Cuota Quincenal Estimada</p>
            <p className="text-2xl font-bold text-blue-700">
              {new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(cuotaQuincenal)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={handleGenerarTabla}
            disabled={!isFormValid}
            className="flex-1"
            size="lg"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Generar Tabla de Amortización
          </Button>
          <Button
            onClick={handleLimpiar}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {showResults && resultado && (
        <CotizadorResults resultado={resultado} />
      )}
    </div>
  );
}
