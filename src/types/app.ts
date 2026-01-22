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
  personInfo?: {
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    tipoCuentaBancaria: string | null;
    numeroCuenta: string | null;
    banco: string | null;
    salarioMensual: string | null;
  };
}

export interface Company {
  id: number;
  name: string;
}
