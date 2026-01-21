import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the current date in Panama timezone (UTC-5)
 * Returns the date as a Date object
 */
export function getPanamaDate(): Date {
  const now = new Date();
  // Convert to Panama timezone (UTC-5)
  const panamaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Panama' }));
  return panamaTime;
}

/**
 * Check if a date is overdue based on Panama timezone
 * @param fechaQuincena - Date string in YYYY-MM-DD format
 * @returns true if the date is in the past
 */
export function isOverdue(fechaQuincena: string): boolean {
  const today = getPanamaDate();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  const dueDate = new Date(fechaQuincena + 'T00:00:00');
  dueDate.setHours(0, 0, 0, 0); // Set to start of day
  
  return dueDate < today;
}

/**
 * Get the effective estado for an amortization row or prestamo
 * Computes "atrasada" if the payment is overdue but still pendiente
 * @param estado - Current estado from database
 * @param fechaQuincena - Date string in YYYY-MM-DD format
 * @returns Effective estado including computed "atrasada"
 */
export function getEffectiveEstado(estado: string, fechaQuincena: string): string {
  if (estado === 'pendiente' && isOverdue(fechaQuincena)) {
    return 'atrasada';
  }
  return estado;
}

/**
 * Get the effective estado for a prestamo based on its amortization rows
 * @param prestamoEstado - Current prestamo estado
 * @param amortRows - Array of amortization rows with estado and fechaQuincena
 * @returns Effective prestamo estado
 */
export function getEffectivePrestamoEstado(
  prestamoEstado: string,
  amortRows?: Array<{ estado: string; fechaQuincena: string }>
): string {
  // If prestamo is not 'activa', return as is
  if (prestamoEstado !== 'activa') {
    return prestamoEstado;
  }
  
  // Check if any amortization row is overdue
  if (amortRows) {
    const hasOverdue = amortRows.some(row =>
      row.estado === 'pendiente' && isOverdue(row.fechaQuincena)
    );
    
    if (hasOverdue) {
      return 'atrasada';
    }
  }
  
  return prestamoEstado;
}

/**
 * Get date range for preset filters using Panama timezone
 */
export function getDateRangePreset(range: 'today' | 'week' | 'month'): { from: string; to: string } {
  const today = getPanamaDate();
  let fromDate = new Date(today);
  let toDate = new Date(today);

  switch (range) {
    case 'today':
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = today.getDay();
      fromDate.setDate(today.getDate() - day);
      toDate.setDate(today.getDate() + (6 - day));
      break;
    case 'month':
      fromDate.setDate(1);
      toDate.setMonth(today.getMonth() + 1, 0);
      break;
  }

  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
  };
}