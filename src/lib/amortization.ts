import type { NewAmortRow } from './schema';

type AmortRowInput = Omit<NewAmortRow, 'id' | 'prestamoId'>;

/**
 * Get the next quincena date (15th or last day of month)
 * Based on fechaInicio, returns the next available quincena date
 */
export function getNextQuincena(fechaInicio: Date): Date {
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
  // Create a copy of the date to avoid mutating the original
  let currentDate = new Date(proximoPago);
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
    // Move to next day to ensure we get the next quincena
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    currentDate = getNextQuincena(nextDate);
  }
  return rows;
}