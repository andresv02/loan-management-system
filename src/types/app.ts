import { AmortRow } from './index';

export interface PrestamoWithDetails {
  id: number;
  principal: string;
  cuotaQuincenal: string;
  saldoPendiente: string;
  proximoPago: string;
  interesTotal: string;
  estado: string;
  empresa: string;
  cedula: string;
  nombre: string;
  amortizacion: AmortRow[];
}

export interface Company {
  id: number;
  name: string;
}
