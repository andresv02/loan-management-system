import type { NewAmortRow } from './schema';

type AmortRowInput = Omit<NewAmortRow, 'id' | 'prestamoId'>;

/**
 * Get the next quincena date (15th or last day of month)
 */
function getNextQuincena(currentDate: Date): Date {
  const date = new Date(currentDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  // If current date is before or on the 15th, return 15th
  if (day < 15) {
    return new Date(year, month, 15);
  }
  
  // If current date is on the 15th, return last day of month
  if (day === 15) {
    return new Date(year, month + 1, 0);
  }
  
  // If current date is between 15th and last day (or on last day), return 15th of next month
  return new Date(year, month + 1, 15);
}

export function generateFrenchAmortization(
  principal: number,
  targetInterest: number,
  totalQuincenas: number,
  proximoPago: Date
): AmortRowInput[] {
  const cuotaQuincenal = (principal + targetInterest) / totalQuincenas;

  const round2 = (v: number) => Math.round(v * 100) / 100;

  // Annuity PV solver: find r where sum(cuota / (1+r)^i ) = principal
  const annuityRate = (p: number, c: number, n: number): number => {
    let low = 0;
    let high = 1;
    for (let iter = 0; iter < 200; iter++) {
      const mid = (low + high) / 2;
      let pv = 0;
      for (let i = 1; i <= n; i++) {
        pv += c / Math.pow(1 + mid, i);
      }
      if (pv > p) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  };

  const r = annuityRate(principal, cuotaQuincenal, totalQuincenas);

  // Generate amortization table
  const rows: AmortRowInput[] = [];
  let saldoInicial = principal;
  let currentDate = proximoPago;
  for (let i = 1; i <= totalQuincenas; i++) {
    let interes = round2(saldoInicial * r);
    let capital = round2(cuotaQuincenal - interes);
    let saldoFinal = round2(saldoInicial - capital);
    if (capital > saldoInicial) {
      capital = saldoInicial;
      saldoFinal = 0;
      interes = round2(cuotaQuincenal - capital);
    }
    if (i === totalQuincenas) {
      capital = saldoInicial;
      saldoFinal = 0;
      interes = round2(cuotaQuincenal - capital);
    }
    rows.push({
      quincenaNum: i,
      fechaQuincena: currentDate.toISOString().split('T')[0],
      cuotaQuincenal: round2(cuotaQuincenal).toFixed(2),
      interes: interes.toFixed(2),
      capital: capital.toFixed(2),
      saldoInicial: saldoInicial.toFixed(2),
      saldoFinal: saldoFinal.toFixed(2),
      estado: 'pendiente',
    });
    saldoInicial = saldoFinal;
    // Use the same bi-monthly logic as in ApprovalModal
    currentDate = getNextQuincena(currentDate);
  }
  return rows;
}