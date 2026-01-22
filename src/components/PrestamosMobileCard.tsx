import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AmortizationTable } from './AmortizationTable';
import { PrestamoWithDetails } from '@/types/app';
import { getEffectivePrestamoEstado, cn, formatCurrency, formatDate } from '@/lib/utils';
import { deletePrestamo } from '@/lib/actions';
import { LOAN_STATUS } from '@/lib/constants';

interface PrestamosMobileCardProps {
  prestamo: PrestamoWithDetails;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export function PrestamosMobileCard({ prestamo, isExpanded, toggleExpanded }: PrestamosMobileCardProps) {
  const effectiveEstado = getEffectivePrestamoEstado(prestamo.estado, prestamo.amortizacion);
  const estadoLabel = effectiveEstado.charAt(0).toUpperCase() + effectiveEstado.slice(1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex justify-between items-start">
          <span>{prestamo.nombre}</span>
          <span className={cn(
            "text-sm px-2 py-1 rounded-full",
            effectiveEstado === LOAN_STATUS.LATE
              ? 'bg-red-100 text-red-700'
              : effectiveEstado === LOAN_STATUS.COMPLETED
              ? 'bg-green-100 text-green-700'
              : effectiveEstado === LOAN_STATUS.ACTIVE
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          )}>
            {estadoLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">ID</p>
            <p className="font-medium">#{prestamo.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cedula</p>
            <p className="font-medium">{prestamo.cedula}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Empresa</p>
            <p className="font-medium">{prestamo.empresa}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Principal</p>
            <p className="font-medium">
              {formatCurrency(prestamo.principal)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Saldo Pendiente</p>
            <p className="font-bold text-emerald-600">
              {formatCurrency(prestamo.saldoPendiente)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Cuota</p>
            <p className="font-medium">
              {formatCurrency(prestamo.cuotaQuincenal)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Próximo Pago</p>
            <p className="font-medium">
              {formatDate(prestamo.proximoPago)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={toggleExpanded}
          >
            {isExpanded ? 'Ocultar Tabla de Pagos' : 'Ver Tabla de Pagos'}
          </Button>
          
          {isExpanded && (
            <div className="mt-2 overflow-x-auto">
              <AmortizationTable data={prestamo.amortizacion} prestamoId={prestamo.id} />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={() => deletePrestamo(prestamo.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
