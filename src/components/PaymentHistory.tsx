'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyData {
  monthKey: string;
  month: string;
  year: number;
  totalCollected: number;
  totalCapital: number;
  totalInteres: number;
  totalPendiente: number;
  pendingCount: number;
  paymentCount: number;
  uniqueClients: number;
  uniqueLoans: number;
}

interface Summary {
  totalCollected: number;
  totalCapital: number;
  totalInteres: number;
  totalPayments: number;
  uniqueClients: number;
  uniqueLoans: number;
  averagePayment: number;
  totalOverdue?: number;
}

interface AllTimeData {
  monthlySummary: MonthlyData[];
  summary: Summary;
}

interface CategoryBreakdown {
  total: number;
  capital: number;
  interes: number;
}

interface Projection {
  monthKey: string;
  monthLabel: string;
  year: number;
  count: number;
  recibido: CategoryBreakdown;
  porRecibir: CategoryBreakdown;
  porCobrar: CategoryBreakdown;
}

export function PaymentHistory() {
  const [allTimeData, setAllTimeData] = useState<AllTimeData | null>(null);
  const [projectionData, setProjectionData] = useState<Projection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [groupBy, setGroupBy] = useState<'month' | 'quarter' | 'year'>('month');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchAllTimeData = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/historical?allTime=true`);
      if (!response.ok) throw new Error('Failed to fetch all-time data');

      const result = await response.json();
      setAllTimeData({
        monthlySummary: result.monthlySummary,
        summary: {
          ...result.summary,
          totalOverdue: result.totalOverdue || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching all-time data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial de pagos',
        variant: 'destructive',
      });
    }
  }, []);

  const fetchProjectionData = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/projections');
      if (!response.ok) throw new Error('Failed to fetch projections');
      const result = await response.json();
      setProjectionData(result.projections);
    } catch (error) {
      console.error('Error fetching projection data:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAllTimeData(), fetchProjectionData()]);
      setLoading(false);
    };
    load();
  }, [fetchAllTimeData, fetchProjectionData]);

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
          totalCapital: 0,
          totalInteres: 0,
          totalPendiente: 0,
          pendingCount: 0,
          paymentCount: 0,
          uniqueClients: 0,
          uniqueLoans: 0,
        };
      }

      grouped[key].totalCollected += month.totalCollected;
      grouped[key].totalCapital += month.totalCapital;
      grouped[key].totalInteres += month.totalInteres;
      grouped[key].totalPendiente += month.totalPendiente;
      grouped[key].pendingCount += month.pendingCount;
      grouped[key].paymentCount += month.paymentCount;
    });

    return Object.values(grouped).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const groupedData = getGroupedData();
  const displayedMonths = showAllMonths ? groupedData : groupedData.slice(0, 6);

  const toggleRow = (monthKey: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

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

  const safeSummary = allTimeData?.summary || {
    totalCollected: 0,
    totalCapital: 0,
    totalInteres: 0,
    totalPayments: 0,
    uniqueClients: 0,
    uniqueLoans: 0,
    averagePayment: 0,
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB',
      maximumFractionDigits: 0,
    }).format(value);

  // Build a map of projection data by monthKey for quick lookup
  const projectionByMonth = new Map<string, Projection>();
  projectionData?.forEach((p) => projectionByMonth.set(p.monthKey, p));

  // Chart data: stacked bars per category with capital+interes
  const chartData = projectionData?.map((p) => ({
    monthLabel: p.monthLabel,
    'Recibido - Capital': p.recibido.capital,
    'Recibido - Interés': p.recibido.interes,
    'Por Recibir - Capital': p.porRecibir.capital,
    'Por Recibir - Interés': p.porRecibir.interes,
    'Por Cobrar - Capital': p.porCobrar.capital,
    'Por Cobrar - Interés': p.porCobrar.interes,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const items = payload.filter((p: any) => p.value > 0);
      if (!items.length) return null;
      const total = items.reduce((sum: number, p: any) => sum + p.value, 0);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-800 capitalize mb-1">{label}</p>
          {items.map((item: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
          <div className="border-t mt-1 pt-1">
            <p className="text-sm font-bold text-slate-800">Total: {formatCurrency(total)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Prominent Total Recaudado + Total Pagos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium mb-0.5">Total Recaudado (Histórico)</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(safeSummary.totalCollected)}
                </p>
                <div className="flex gap-4 mt-1.5 text-sm">
                  <span className="text-emerald-600">
                    Capital: <strong>{formatCurrency(safeSummary.totalCapital)}</strong>
                  </span>
                  <span className="text-blue-600">
                    Interés: <strong>{formatCurrency(safeSummary.totalInteres)}</strong>
                  </span>
                </div>
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
                <p className="text-sm text-blue-600 font-medium mb-0.5">Total Pagos</p>
                <p className="text-2xl font-bold text-blue-700">{safeSummary.totalPayments}</p>
                <p className="text-xs text-blue-500 mt-0.5">Transacciones registradas</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Recibido / Por Recibir / Por Cobrar (stacked capital + interes) */}
      {chartData.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-800">
              📊 Recibido / Por Recibir / Por Cobrar (Capital + Interés)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(value: string) => {
                      const parts = value.split(' ');
                      return parts.slice(0, 2).join(' ');
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat('es-PA', {
                        notation: 'compact',
                        compactDisplay: 'short',
                        maximumFractionDigits: 0,
                      }).format(value)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {/* Recibido */}
                  <Bar dataKey="Recibido - Capital" stackId="recibido" fill="#059669" name="Recibido - Capital" />
                  <Bar dataKey="Recibido - Interés" stackId="recibido" fill="#34d399" name="Recibido - Interés" />
                  {/* Por Recibir */}
                  <Bar dataKey="Por Recibir - Capital" stackId="porRecibir" fill="#2563eb" name="Por Recibir - Capital" />
                  <Bar dataKey="Por Recibir - Interés" stackId="porRecibir" fill="#93c5fd" name="Por Recibir - Interés" />
                  {/* Por Cobrar */}
                  <Bar dataKey="Por Cobrar - Capital" stackId="porCobrar" fill="#d97706" name="Por Cobrar - Capital" />
                  <Bar dataKey="Por Cobrar - Interés" stackId="porCobrar" fill="#fcd34d" name="Por Cobrar - Interés" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
                {groupedData.length > 6 && (
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
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 w-8"></th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">
                      {groupBy === 'month' ? 'Mes' : groupBy === 'quarter' ? 'Trimestre' : 'Año'}
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Total Recaudado</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Capital</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Interés</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Por Pagar</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-700">Pagos Pendientes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMonths.map((item) => {
                    const isExpanded = expandedRows.has(item.monthKey);
                    const proj = projectionByMonth.get(item.monthKey);
                    return (
                      <>
                        <tr
                          key={item.monthKey}
                          className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => toggleRow(item.monthKey)}
                        >
                          <td className="py-2 px-3">
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 capitalize">
                            {item.month}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(item.totalCollected)}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                            {formatCurrency(item.totalCapital)}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-600 font-medium">
                            {formatCurrency(item.totalInteres)}
                          </td>
                          <td className="py-2 px-3 text-right text-red-600 font-medium">
                            {item.totalPendiente > 0 ? formatCurrency(item.totalPendiente) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.pendingCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                {item.pendingCount}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                        {isExpanded && proj && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={7} className="py-3 px-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Recibido */}
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">✅ Recibido</p>
                                  <p className="text-lg font-bold text-emerald-800">
                                    {formatCurrency(proj.recibido.total)}
                                  </p>
                                  <div className="flex gap-2 mt-1 text-xs text-emerald-600">
                                    <span>Capital: {formatCurrency(proj.recibido.capital)}</span>
                                    <span>Interes: {formatCurrency(proj.recibido.interes)}</span>
                                  </div>
                                </div>
                                {/* Por Cobrar */}
                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Por Cobrar</p>
                                  <p className="text-lg font-bold text-amber-800">
                                    {formatCurrency(proj.porCobrar.total)}
                                  </p>
                                  <div className="flex gap-2 mt-1 text-xs text-amber-600">
                                    <span>Capital: {formatCurrency(proj.porCobrar.capital)}</span>
                                    <span>Interes: {formatCurrency(proj.porCobrar.interes)}</span>
                                  </div>
                                </div>
                                {/* Por Recibir */}
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                  <p className="text-xs font-semibold text-blue-700 mb-1">📥 Por Recibir</p>
                                  <p className="text-lg font-bold text-blue-800">
                                    {formatCurrency(proj.porRecibir.total)}
                                  </p>
                                  <div className="flex gap-2 mt-1 text-xs text-blue-600">
                                    <span>Capital: {formatCurrency(proj.porRecibir.capital)}</span>
                                    <span>Interes: {formatCurrency(proj.porRecibir.interes)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-semibold">
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3 text-slate-800">Total Histórico</td>
                    <td className="py-2 px-3 text-right text-emerald-700">
                      {formatCurrency(allTimeData.summary.totalCollected)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700">
                      {formatCurrency(allTimeData.summary.totalCapital)}
                    </td>
                    <td className="py-2 px-3 text-right text-blue-700">
                      {formatCurrency(allTimeData.summary.totalInteres)}
                    </td>
                    <td className="py-2 px-3 text-right text-red-700">
                      {allTimeData.summary.totalOverdue && allTimeData.summary.totalOverdue > 0
                        ? formatCurrency(allTimeData.summary.totalOverdue)
                        : '-'}
                    </td>
                    <td className="py-2 px-3 text-center text-purple-700">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
