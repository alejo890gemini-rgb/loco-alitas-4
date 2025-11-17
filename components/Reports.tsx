import React, { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import type { Sale, Table, PaymentMethod, OrderType } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { SparklesIcon, DownloadIcon } from './Icons';
import { generateSalesReport, ReportData } from '../services/geminiService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ReportsProps {
  sales: Sale[];
  tables: Table[];
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; }> = ({ title, value, subtext }) => (
  <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border border-[var(--card-border)]">
    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
    {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
  </div>
);

const ChartContainer: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-xl shadow-lg border border-[var(--card-border)]">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 sm:h-80">{children}</div>
    </div>
);

export const Reports: React.FC<ReportsProps> = ({ sales, tables }) => {
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const filteredSales = useMemo(() => {
    const now = new Date();
    let startFilterDate: Date | null = null;
    let endFilterDate: Date | null = new Date(now);
    endFilterDate.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      startFilterDate = new Date(startDate);
      startFilterDate.setUTCHours(0, 0, 0, 0);
      endFilterDate = new Date(endDate);
      endFilterDate.setUTCHours(23, 59, 59, 999);
    } else {
      switch (filterType) {
        case 'today':
          startFilterDate = new Date(now);
          startFilterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startFilterDate = new Date(now);
          startFilterDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
          startFilterDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startFilterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startFilterDate.setHours(0, 0, 0, 0);
          break;
        case 'all':
        default:
          startFilterDate = null;
          endFilterDate = null;
      }
    }
    
    if (!startFilterDate || !endFilterDate) return sales;

    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startFilterDate! && saleDate <= endFilterDate!;
    });
  }, [sales, filterType, startDate, endDate]);

  const reportStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = filteredSales.length;
    const averageSale = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemCounts: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      sale.order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    const topSellingItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    const revenueByPaymentMethod = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {} as Record<PaymentMethod, number>);

    const revenueByOrderType = filteredSales.reduce((acc, sale) => {
      acc[sale.order.orderType] = (acc[sale.order.orderType] || 0) + sale.total;
      return acc;
    }, { 'dine-in': 0, 'delivery': 0, 'to-go': 0 } as Record<OrderType, number>);

    const dineInSales = filteredSales.filter(s => s.order.orderType === 'dine-in' && s.order.tableId);
    const uniqueTables = [...new Set(dineInSales.map(s => s.order.tableId))];
    const totalDineInRevenue = dineInSales.reduce((sum, sale) => sum + sale.total, 0);
    const averageRevenuePerTable = uniqueTables.length > 0 ? totalDineInRevenue / uniqueTables.length : 0;
    
    const salesOverTime = filteredSales.reduce((acc, sale) => {
      const key = new Date(sale.timestamp).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      acc[key] = (acc[key] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    return { totalRevenue, totalOrders, averageSale, topSellingItems, revenueByPaymentMethod, revenueByOrderType, averageRevenuePerTable, salesOverTime };
  }, [filteredSales]);
  
  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setAiSummary('');
    const reportData: ReportData = {
      totalRevenue: reportStats.totalRevenue,
      totalOrders: reportStats.totalOrders,
      topSellingItems: reportStats.topSellingItems.map(([name, count]) => ({ name, count })),
      revenueByPaymentMethod: reportStats.revenueByPaymentMethod,
    };
    try {
      const summary = await generateSalesReport(reportData);
      setAiSummary(summary);
    } catch (error) {
      setAiSummary('Ocurrió un error al generar el resumen.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["SaleID", "Timestamp", "OrderType", "Destination", "PaymentMethod", "SaleTotal", "ItemName", "ItemQuantity", "ItemPrice"];
    const rows = filteredSales.flatMap(sale => {
        const destination = sale.order.orderType === 'dine-in' ? tables.find(t => t.id === sale.order.tableId)?.name ?? 'N/A' : (sale.order.deliveryInfo?.name ?? sale.order.toGoName ?? 'N/A');
        return sale.order.items.map(item => [
            sale.id,
            new Date(sale.timestamp).toLocaleString('es-CO'),
            sale.order.orderType,
            destination,
            sale.paymentMethod,
            sale.total,
            item.name.replace(/,/g, ''),
            item.quantity,
            item.price
        ].join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  const commonChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#D1D5DB' } } },
    scales: { 
      y: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } }, 
      x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } }
    },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-white">Dashboard de Reportes</h2>
        <div className="flex gap-2">
            <button onClick={handleExportCSV} disabled={filteredSales.length === 0} className="flex items-center bg-emerald-600 text-white px-3 py-2 rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <DownloadIcon />
                <span className="ml-2 hidden sm:inline">Exportar a CSV</span>
            </button>
            <button onClick={handleGenerateSummary} disabled={isSummaryLoading || filteredSales.length === 0} className="flex items-center bg-purple-600 text-white px-3 py-2 rounded-lg shadow hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <SparklesIcon />
                <span className="ml-2 hidden sm:inline">{isSummaryLoading ? 'Analizando...' : 'Resumen IA'}</span>
            </button>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-center border border-[var(--card-border)]">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'today', 'week', 'month'] as const).map(type => (
            <button key={type} onClick={() => { setFilterType(type); setStartDate(''); setEndDate(''); }} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${filterType === type && !startDate ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>{ {all: 'Todo', today: 'Hoy', week: 'Semana', month: 'Mes'}[type] }</button>
          ))}
        </div>
        <div className="flex-grow hidden md:block border-t border-[var(--card-border)] mx-4"></div>
        <div className="flex gap-2 items-center flex-wrap">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white text-sm" />
            <span className="text-gray-400">a</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white text-sm" />
        </div>
      </div>
      
      {(isSummaryLoading || aiSummary) && (
        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg mb-8 border border-purple-500/30">
            <h3 className="font-semibold text-lg mb-2 text-white flex items-center gap-2"><SparklesIcon className="text-purple-400"/>Resumen del Periodo (IA)</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{isSummaryLoading ? "Generando análisis..." : aiSummary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Ingresos Totales" value={formatPrice(reportStats.totalRevenue)} />
        <StatCard title="Total de Órdenes" value={reportStats.totalOrders.toString()} />
        <StatCard title="Ticket Promedio" value={formatPrice(reportStats.averageSale)} />
        <StatCard title="Ingreso Promedio / Mesa" value={formatPrice(reportStats.averageRevenuePerTable)} subtext="Solo 'En Restaurante'" />
      </div>

      {filteredSales.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="Ventas a lo Largo del Tiempo">
                <Bar options={{...commonChartOptions, scales: {...commonChartOptions.scales, y: {...commonChartOptions.scales.y, ticks: { ...commonChartOptions.scales.y.ticks, callback: (value) => formatPrice(Number(value)) }}}}} data={{ labels: Object.keys(reportStats.salesOverTime), datasets: [{ label: 'Ingresos', data: Object.values(reportStats.salesOverTime), backgroundColor: '#E91D24', borderRadius: 4 }] }} />
            </ChartContainer>
            <ChartContainer title="Top 5 Productos Más Vendidos">
                <Bar options={{...commonChartOptions, indexAxis: 'y' as const, plugins: { legend: { display: false }}}} data={{ labels: reportStats.topSellingItems.map(([name]) => name), datasets: [{ label: 'Cantidad', data: reportStats.topSellingItems.map(([, count]) => count), backgroundColor: '#FFC300', borderRadius: 4}]}}/>
            </ChartContainer>
             <ChartContainer title="Ingresos por Método de Pago">
                <Doughnut options={{...commonChartOptions, plugins: { legend: { position: 'top' as const }}}} data={{ labels: Object.keys(reportStats.revenueByPaymentMethod), datasets: [{ data: Object.values(reportStats.revenueByPaymentMethod), backgroundColor: ['#E91D24', '#FFC300', '#3B82F6'], borderColor: 'var(--card-bg)', borderWidth: 4 }]}}/>
            </ChartContainer>
            <ChartContainer title="Ingresos por Tipo de Orden">
                 <Doughnut options={{...commonChartOptions, plugins: { legend: { position: 'top' as const }}}} data={{ labels: ['Restaurante', 'Delivery', 'Para Llevar'], datasets: [{ data: Object.values(reportStats.revenueByOrderType), backgroundColor: ['#10B981', '#F59E0B', '#8B5CF6'], borderColor: 'var(--card-bg)', borderWidth: 4 }]}}/>
            </ChartContainer>
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
          <p className="text-xl text-gray-400">No hay datos de ventas para mostrar en el período seleccionado.</p>
          <p className="text-gray-500">Intente seleccionar otro rango de fechas o espere a que se registren nuevas ventas.</p>
        </div>
      )}
    </div>
  );
};