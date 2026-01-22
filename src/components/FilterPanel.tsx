'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect } from 'react';
import { getDateRangePreset } from '@/lib/utils';
import type { Company } from '@/lib/schema';

interface Filters {
  cedula?: string;
  empresa?: string;
  nombre?: string;
  estado?: string;
  subEstado?: 'todos' | 'atrasada';
  dateRange?: 'today' | 'week' | 'month' | 'custom' | null;
  dateFrom?: string;
  dateTo?: string;
}

interface FilterPanelProps {
  companies: Company[];
  onFilterChange?: (filters: Filters) => void;
}

export function FilterPanel({ companies, onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<Filters>({});

  const handleClear = () => {
    setFilters({});
    onFilterChange?.({});
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted rounded-md">
      <div>
        <label className="text-xs font-medium uppercase text-muted-foreground">Cédula</label>
        <Input
          placeholder="Ingrese cédula"
          className="mt-1 max-w-sm"
          value={filters.cedula ?? ''}
          onChange={(e) => {
            const newFilters = { ...filters, cedula: e.target.value || undefined };
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase text-muted-foreground">Nombre</label>
        <Input
          placeholder="Ingrese nombre"
          className="mt-1 max-w-sm"
          value={filters.nombre ?? ''}
          onChange={(e) => {
            const newFilters = { ...filters, nombre: e.target.value || undefined };
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase text-muted-foreground">Empresa</label>
        <Select value={filters.empresa ?? ''} onValueChange={(value) => {
          const newFilters = { ...filters, empresa: value || undefined };
          setFilters(newFilters);
          onFilterChange?.(newFilters);
        }}>
          <SelectTrigger className="mt-1 w-[180px]">
            <SelectValue placeholder="Todas las compañías" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.name}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium uppercase text-muted-foreground">Sub-Estado</label>
        <Select value={filters.subEstado ?? 'todos'} onValueChange={(value) => {
          const newFilters = { ...filters, subEstado: value as 'todos' | 'atrasada', estado: 'activa' };
          setFilters(newFilters);
          onFilterChange?.(newFilters);
        }}>
          <SelectTrigger className="mt-1 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Activos</SelectItem>
            <SelectItem value="atrasada">Solo Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 items-end">
        <div className="min-w-[120px]">
          <label className="text-xs font-medium uppercase text-muted-foreground">Fecha Proximo Pago</label>
          <Select value={filters.dateRange ?? ''} onValueChange={(value) => {
            if (value === '') {
              const newFilters = { ...filters, dateRange: undefined, dateFrom: undefined, dateTo: undefined };
              setFilters(newFilters);
              onFilterChange?.(newFilters);
              return;
            }
            const range = value as 'today' | 'week' | 'month' | 'custom';
            const newFilters = { ...filters, dateRange: range };
            if (range !== 'custom') {
              const { from, to } = getDateRangePreset(range);
              newFilters.dateFrom = from;
              newFilters.dateTo = to;
            }
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sin filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filters.dateRange === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2 mt-1 min-w-[200px] justify-start text-left font-normal">
                {filters.dateFrom ? (
                  <>
                    {new Date(filters.dateFrom).toLocaleDateString('es-PA')} - {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString('es-PA') : 'Indefinido'}
                  </>
                ) : (
                  <span>Selecciona rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateFrom ? (() => {
                    const [y, m, d] = filters.dateFrom.split('-').map(Number);
                    return new Date(y, m - 1, d);
                  })() : undefined,
                  to: filters.dateTo ? (() => {
                    const [y, m, d] = filters.dateTo.split('-').map(Number);
                    return new Date(y, m - 1, d);
                  })() : undefined,
                }}
                onSelect={(range) => {
                  const newFilters = { ...filters, dateRange: 'custom' as const };
                  if (range?.from) {
                    newFilters.dateFrom = range.from.toLocaleDateString('en-CA');
                  } else {
                    newFilters.dateFrom = undefined;
                  }
                  if (range?.to) {
                    newFilters.dateTo = range.to.toLocaleDateString('en-CA');
                  } else {
                    newFilters.dateTo = undefined;
                  }
                  setFilters(newFilters);
                  onFilterChange?.(newFilters);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={handleClear}>Limpiar</Button>
      </div>
    </div>
  );
}