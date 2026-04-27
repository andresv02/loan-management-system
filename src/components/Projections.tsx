'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Totals {
  recibido: CategoryBreakdown;
  porRecibir: CategoryBreakdown;
  porCobrar: CategoryBreakdown;
  count: number;
}

interface ProjectionsData {
  projections: Projection[];
  totals: Totals;
}

export function Projections() {
  const [data, setData] = useState<ProjectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [allMonths, setAllMonths] = useState<{ value: string; label: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthFilter && monthFilter !== 'all') {
        params.append('month', monthFilter);
      }

      const response = await fetch(`/api/payments/projections?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch projections');

      const result = await response.json();
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las proyecciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchAllMonths = async () => {
      try {
        const response = await fetch('/api/payments/projections');
        if (response.ok) {
          const result = await response.json();
          const months = result.projections.map((p: Projection) => ({
            value: p.monthKey,
            label: p.monthLabel,
          }));
          setAllMonths(months);
        }
      } catch (error) {
        console.error('Error fetching months:', error);
      }
    };
    fetchAllMonths();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeData = data || {
    projections: [],
    totals: {
      recibido: { total: 0, capital: 0, interes: 0 },
      porRecibir: { total: 0, capital: 0, interes: 0 },
      porCobrar: { total: 0, capital: 0, interes: 0 },
      count: 0,
    },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB',
      maximumFractionDigits: 0,
    }).format(value);

  // Chart data: total of the month (recibido + porRecibir + porCobrar)
  // Always show 12 months starting from the current month
  const now = new Date();

  // Build a map of existing projection data by monthKey
  const projectionMap = new Map(
    safeData.projections.map((p) => [
      p.monthKey,
      {
        monthLabel: p.monthLabel,
        capital: p.recibido.capital + p.porRecibir.capital + p.porCobrar.capital,
        interes: p.recibido.interes + p.porRecibir.interes + p.porCobrar.interes,
      },
    ])
  );

  // Generate 12 months starting from current month
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('es-PA', { month: 'long', year: 'numeric' });
    const existing = projectionMap.get(monthKey);
    return {
      monthLabel: existing?.monthLabel || monthLabel,
      capital: existing?.capital || 0,
      interes: existing?.interes || 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const capital = payload.find((p: any) => p.dataKey === 'capital')?.value || 0;
      const interes = payload.find((p: any) => p.dataKey === 'interes')?.value || 0;
      const total = capital + interes;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-800 capitalize mb-1">{label}</p>
          <p className="text-sm text-emerald-600">Capital: {formatCurrency(capital)}</p>
          <p className="text-sm text-blue-600">Interés: {formatCurrency(interes)}</p>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Recibido</p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(safeData.totals.recibido.total)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                <span className="text-emerald-700 text-lg">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Por Recibir</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(safeData.totals.porRecibir.total)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-blue-700 text-lg">📥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Por Cobrar</p>
                <p className="text-xl font-bold text-amber-700">
                  {formatCurrency(safeData.totals.porCobrar.total)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                <span className="text-amber-700 text-lg">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Quincenas</p>
                <p className="text-xl font-bold text-purple-700">{safeData.totals.count}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-purple-700 text-lg">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Bar Chart - Future projection only */}
      {chartData.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-800">
              📊 Proyección Mensual de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
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
                  <Legend
                    formatter={(value: string) =>
                      value === 'capital' ? 'Capital' : 'Interés'
                    }
                  />
                  <Bar
                    dataKey="capital"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 4, 4]}
                    name="capital"
                  />
                  <Bar
                    dataKey="interes"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="interes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projections Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-bold text-slate-800">
              📋 Tabla de Proyecciones
            </CardTitle>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {allMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Mes</th>
                  <th className="text-right py-2 px-3 font-semibold text-emerald-700">Recibido</th>
                  <th className="text-right py-2 px-3 font-semibold text-blue-700">Por Recibir</th>
                  <th className="text-right py-2 px-3 font-semibold text-amber-700">Por Cobrar</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Total</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">Quincenas</th>
                </tr>
              </thead>
              <tbody>
                {safeData.projections.map((item) => {
                  const monthTotal =
                    item.recibido.total + item.porRecibir.total + item.porCobrar.total;
                  return (
                    <tr key={item.monthKey} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-800 capitalize">
                        {item.monthLabel}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                        {item.recibido.total > 0 ? formatCurrency(item.recibido.total) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-blue-600 font-medium">
                        {item.porRecibir.total > 0 ? formatCurrency(item.porRecibir.total) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-600 font-medium">
                        {item.porCobrar.total > 0 ? formatCurrency(item.porCobrar.total) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">
                        {formatCurrency(monthTotal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-semibold">
                  <td className="py-2 px-3 text-slate-800">Total</td>
                  <td className="py-2 px-3 text-right text-emerald-700">
                    {safeData.totals.recibido.total > 0
                      ? formatCurrency(safeData.totals.recibido.total)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-blue-700">
                    {safeData.totals.porRecibir.total > 0
                      ? formatCurrency(safeData.totals.porRecibir.total)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-amber-700">
                    {safeData.totals.porCobrar.total > 0
                      ? formatCurrency(safeData.totals.porCobrar.total)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    {formatCurrency(
                      safeData.totals.recibido.total +
                        safeData.totals.porRecibir.total +
                        safeData.totals.porCobrar.total
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">{safeData.totals.count}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {safeData.projections.length === 0 && (
            <p className="text-center py-8 text-slate-500">
              No hay proyecciones disponibles.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
