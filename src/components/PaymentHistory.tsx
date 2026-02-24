'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Download, Search, X, TrendingUp, Users, CreditCard, PiggyBank, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: number;
  montoPagado: number;
  fechaPago: string | null;
  quincenaNum: number | null;
  prestamoId: number;
  createdAt: string;
  cedula: string;
  nombre: string;
  apellido: string;
  companyId: number | null;
  companyName: string | null;
}

interface MonthlyData {
  monthKey: string;
  month: string;
  year: number;
  totalCollected: number;
  paymentCount: number;
  uniqueClients: number;
  uniqueLoans: number;
}

interface Company {
  id: number;
  name: string;
}

interface Summary {
  totalCollected: number;
  totalPayments: number;
  uniqueClients: number;
  uniqueLoans: number;
  averagePayment: number;
}

interface AllTimeData {
  monthlySummary: MonthlyData[];
  summary: Summary;
}

interface PaymentHistoryData {
  payments: Payment[];
  monthlySummary: MonthlyData[];
  companies: Company[];
  summary: Summary;
}

export function PaymentHistory() {
  const [data, setData] = useState<PaymentHistoryData | null>(null);
  const [allTimeData, setAllTimeData] = useState<AllTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const clientFilterRef = useRef<HTMLInputElement>(null);
  const [appliedClientFilter, setAppliedClientFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [groupBy, setGroupBy] = useState<'month' | 'quarter' | 'year'>('month');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      if (appliedClientFilter) params.append('clientName', appliedClientFilter);
      if (companyFilter && companyFilter !== 'all') params.append('companyId', companyFilter);

      const response = await fetch(`/api/payments/historical?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial de pagos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, appliedClientFilter, companyFilter]);

  const fetchAllTimeData = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/historical?allTime=true`);
      if (!response.ok) throw new Error('Failed to fetch all-time data');
      
      const result = await response.json();
      setAllTimeData({
        monthlySummary: result.monthlySummary,
        summary: result.summary,
      });
    } catch (error) {
      console.error('Error fetching all-time data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAllTimeData();
  }, [fetchData, fetchAllTimeData]);

  const handleExport = () => {
    if (!safeData.payments.length) return;
    
    const csvContent = [
      ['Fecha', 'Cliente', 'Cédula', 'Empresa', 'Préstamo #', 'Quincena #', 'Monto'].join(','),
      ...safeData.payments.map(p => [
        p.fechaPago ? format(parseISO(p.fechaPago), 'dd/MM/yyyy') : 'N/A',
        `"${p.nombre} ${p.apellido}"`,
        p.cedula,
        p.companyName || 'Sin empresa',
        p.prestamoId,
        p.quincenaNum || 'N/A',
        p.montoPagado.toFixed(2),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-pagos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({
      title: 'Exportado',
      description: 'El historial de pagos ha sido exportado a CSV',
    });
  };

  const clearFilters = () => {
    if (clientFilterRef.current) {
      clientFilterRef.current.value = '';
    }
    setAppliedClientFilter('');
    setCompanyFilter('all');
    setStartDate(startOfMonth(subMonths(new Date(), 5)));
    setEndDate(endOfMonth(new Date()));
  };

  const getGroupedData = () => {
    if (!allTimeData?.monthlySummary) return [];
    
    if (groupBy === 'month') {
      return allTimeData.monthlySummary;
    }
    
    const grouped: Record<string, MonthlyData> = {};
    
    allTimeData.monthlySummary.forEach((month) => {
      let key: string;
      
      if (groupBy === 'quarter') {
        const quarter = Math.ceil(parseInt(month.monthKey.split('-')[1]) / 3);
        key = `${month.year}-Q${quarter}`;
      } else {
        key = month.year.toString();
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          monthKey: key,
          month: groupBy === 'quarter' ? `${key.replace('-Q', ' Q')}` : key,
          year: month.year,
          totalCollected: 0,
          paymentCount: 0,
          uniqueClients: 0,
          uniqueLoans: 0,
        };
      }
      
      grouped[key].totalCollected += month.totalCollected;
      grouped[key].paymentCount += month.paymentCount;
    });
    
    return Object.values(grouped).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const groupedData = getGroupedData();
  const displayedMonths = showAllMonths ? groupedData : groupedData.slice(0, 6);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeData = data || {
    payments: [],
    monthlySummary: [],
    companies: [],
    summary: {
      totalCollected: 0,
      totalPayments: 0,
      uniqueClients: 0,
      uniqueLoans: 0,
      averagePayment: 0,
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Total Recaudado</p>
                <p className="text-xl font-bold text-emerald-700">
                  ${safeData.summary.totalCollected.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Pagos</p>
                <p className="text-xl font-bold text-blue-700">{safeData.summary.totalPayments}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Clientes Únicos</p>
                <p className="text-xl font-bold text-purple-700">{safeData.summary.uniqueClients}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Promedio por Pago</p>
                <p className="text-xl font-bold text-amber-700">
                  ${safeData.summary.averagePayment.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary - All Time Data with Grouping */}
      {allTimeData && allTimeData.monthlySummary.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                Resumen Histórico Completo
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={groupBy} onValueChange={(v: 'month' | 'quarter' | 'year') => setGroupBy(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Por Mes</SelectItem>
                    <SelectItem value="quarter">Por Trimestre</SelectItem>
                    <SelectItem value="year">Por Año</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllMonths(!showAllMonths)}
                  className="text-slate-600"
                >
                  {showAllMonths ? (
                    <><ChevronUp className="w-4 h-4 mr-1" /> Ver menos</>
                  ) : (
                    <><ChevronDown className="w-4 h-4 mr-1" /> Ver todos ({groupedData.length})</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">
                      {groupBy === 'month' ? 'Mes' : groupBy === 'quarter' ? 'Trimestre' : 'Año'}
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Total Recaudado</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-700"># Pagos</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMonths.map((item) => (
                    <tr key={item.monthKey} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-800 capitalize">
                        {item.month}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                        ${item.totalCollected.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {item.paymentCount}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-semibold">
                    <td className="py-2 px-3 text-slate-800">Total Histórico</td>
                    <td className="py-2 px-3 text-right text-emerald-700">
                      ${allTimeData.summary.totalCollected.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3 text-center">{allTimeData.summary.totalPayments}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Payments */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Pagos Detallados</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Always Visible Filters */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Empresa</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Todas las empresas" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las empresas</SelectItem>
                    {safeData.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={clientFilterRef}
                    placeholder="Nombre o cédula..."
                    defaultValue={appliedClientFilter}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setAppliedClientFilter(clientFilterRef.current?.value || '');
                      }
                    }}
                    className="pl-8"
                    autoComplete="off"
                    spellCheck={false}
                    data-lpignore="true"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilters();
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppliedClientFilter(clientFilterRef.current?.value || '');
                }}
              >
                <Search className="w-4 h-4 mr-1" />
                Aplicar filtros
              </Button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Cédula</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Empresa</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Préstamo #</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Quincena #</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Monto</th>
                </tr>
              </thead>
              <tbody>
                {safeData.payments.slice(0, 100).map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      {payment.fechaPago
                        ? format(parseISO(payment.fechaPago), 'dd/MM/yyyy', { locale: es })
                        : format(parseISO(payment.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {payment.nombre} {payment.apellido}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{payment.cedula}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {payment.companyName ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {payment.companyName}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="font-mono">
                        #{payment.prestamoId}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {payment.quincenaNum || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      ${payment.montoPagado.toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {safeData.payments.length === 0 && (
              <p className="text-center py-8 text-slate-500">
                No hay pagos que coincidan con los filtros seleccionados.
              </p>
            )}
            
            {safeData.payments.length > 100 && (
              <p className="text-center py-4 text-sm text-slate-500">
                Mostrando 100 de {safeData.payments.length} pagos. Usa los filtros para refinar los resultados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
