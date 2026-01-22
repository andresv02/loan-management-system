'use client';

import { useState, useMemo } from 'react';
import { FilterPanel } from './FilterPanel';
import { ActiveLoansTable } from './ActiveLoansTable';
import { getEffectivePrestamoEstado } from '@/lib/utils';
import type { Company } from '@/lib/schema';

interface Filters {
  cedula?: string;
  empresa?: string;
  nombre?: string;
  estado?: string;
  subEstado?: 'todos' | 'atrasada';
  dateFrom?: string;
  dateTo?: string;
}

interface PrestamoWithDetails {
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
  amortizacion: any[];
}

interface Props {
  data: PrestamoWithDetails[];
  companies: Company[];
}

export function DashboardActiveLoans({ data, companies }: Props) {
  const [filters, setFilters] = useState<Filters>({});

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.cedula && !item.cedula.toLowerCase().includes(filters.cedula.toLowerCase())) {
        return false;
      }
      if (filters.nombre && !item.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
        return false;
      }
      if (filters.empresa) {
        const empresaFilter = filters.empresa.trim().toLowerCase();
        const itemEmpresa = item.empresa.trim().toLowerCase();
        if (itemEmpresa !== empresaFilter) {
          return false;
        }
      }
      // Always filter to active loans only
      const effectiveEstado = getEffectivePrestamoEstado(item.estado, item.amortizacion);
      
      // Apply subfilter
      if (filters.subEstado === 'atrasada') {
        if (effectiveEstado !== 'atrasada') return false;
      } else {
        // 'todos' shows all activa (including atrasada)
        if (effectiveEstado !== 'activa' && effectiveEstado !== 'atrasada') return false;
      }
      if (filters.dateFrom) {
        const itemDate = new Date(item.proximoPago);
        itemDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (itemDate < fromDate) {
          return false;
        }
      }
      if (filters.dateTo) {
        const itemDate = new Date(item.proximoPago);
        itemDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters.cedula, filters.nombre, filters.empresa, filters.estado, filters.subEstado, filters.dateFrom, filters.dateTo]);

  return (
    <>
      <FilterPanel companies={companies} onFilterChange={setFilters} />
      <ActiveLoansTable data={filteredData} key={`${filters.estado}-${filters.subEstado}-${filters.dateFrom}-${filters.dateTo}`} />
    </>
  );
}