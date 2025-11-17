import React from 'react';
import type { Sale, MenuItem, Table, PaymentMethod } from '../types';
import { formatPrice } from '../utils/formatPrice';

interface DashboardProps {
  sales: Sale[];
  menuItems: MenuItem[];
  tables: Table[];
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
  <div className="bg-[var(--card-bg)] p-5 rounded-xl shadow-lg flex items-center space-x-4 border border-[var(--card-border)]">
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 text-[var(--primary-red)]">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
      {subtext && <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtext}</p>}
    </div>
  </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ sales, menuItems, tables }) => {
  const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString());
  const totalRevenue = todaySales.reduce((acc, sale) => acc + sale.total, 0);
  const totalOrders = todaySales.length;

  const revenueByPaymentMethod = todaySales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const getTopSellingItems = () => {
    const itemCounts: { [key: string]: number } = {};
    todaySales.forEach(sale => {
      sale.order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };
  
  const topItems = getTopSellingItems();
  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const getSaleDestination = (sale: Sale): string => {
      if (sale.order.orderType === 'delivery') {
          return `Delivery: ${sale.order.deliveryInfo?.name || 'N/A'}`;
      }
      if (sale.order.orderType === 'to-go') {
        return `Para Llevar: ${sale.order.toGoName || 'N/A'}`;
      }
      const tableName = tables.find(t => t.id === sale.order.tableId)?.name;
      return tableName || 'Mesa N/A';
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Ventas de Hoy" value={formatPrice(totalRevenue)} subtext={`${totalOrders} órdenes`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Mesas Disponibles" value={`${availableTables}`} subtext={`de ${tables.length} totales`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8z" /></svg>} />
        <StatCard title="Mesas Ocupadas" value={`${occupiedTables}`} subtext={`${((occupiedTables / tables.length) * 100 || 0).toFixed(0)}% de ocupación`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Platillos en Menú" value={menuItems.length.toString()} subtext="Actualmente disponibles" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border border-[var(--card-border)]">
          <h3 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Ventas Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs text-[var(--text-secondary)] uppercase bg-white/5">
                <tr>
                  <th scope="col" className="px-4 py-3">ID Orden</th>
                  <th scope="col" className="px-4 py-3">Destino</th>
                  <th scope="col" className="px-4 py-3">Método Pago</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3 text-right">Hora</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{sale.id.slice(-6)}</td>
                    <td className="px-4 py-3">{getSaleDestination(sale)}</td>
                    <td className="px-4 py-3">{sale.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)] text-right">{formatPrice(sale.total)}</td>
                    <td className="px-4 py-3 text-right">{new Date(sale.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8">No hay ventas recientes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
            <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border border-[var(--card-border)]">
                <h3 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Ingresos por Método (Hoy)</h3>
                <div className="mt-2 space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[var(--text-secondary)]">Efectivo:</span>
                        <span className="font-semibold text-[var(--text-primary)] text-lg">{formatPrice(revenueByPaymentMethod['Efectivo'] || 0)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-[var(--text-secondary)]">Tarjeta:</span>
                        <span className="font-semibold text-[var(--text-primary)] text-lg">{formatPrice(revenueByPaymentMethod['Tarjeta'] || 0)}</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-[var(--text-secondary)]">Transferencia:</span>
                        <span className="font-semibold text-[var(--text-primary)] text-lg">{formatPrice(revenueByPaymentMethod['Transferencia'] || 0)}</span>
                    </div>
                </div>
            </div>
            <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border border-[var(--card-border)]">
              <h3 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Top 3 Platillos de Hoy</h3>
              {topItems.length > 0 ? (
                <ul className="space-y-4">
                  {topItems.map(([name, count], index) => (
                    <li key={name} className="flex items-center justify-between text-[var(--text-primary)]">
                      <span className="flex items-center">
                        <span className={`font-bold text-lg mr-3 ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{index+1}</span>
                        {name}
                      </span>
                      <span className="font-semibold bg-[var(--accent-yellow)] text-black text-sm px-2.5 py-1 rounded-full">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-[var(--text-secondary)] pt-8">No hay datos de ventas para hoy.</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};