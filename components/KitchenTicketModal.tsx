import React from 'react';
import type { Order, Table } from '../types';

interface KitchenTicketModalProps {
  order: Order;
  onClose: () => void;
  tables: Table[];
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({ order, onClose, tables }) => {
  const getOrderDestination = () => {
    if (order.orderType === 'delivery') {
      return `DELIVERY: ${order.deliveryInfo?.name || 'N/A'}`;
    }
    if (order.orderType === 'to-go') {
        return `PARA LLEVAR: ${order.toGoName || 'N/A'}`;
    }
    const tableName = tables.find(t => t.id === order.tableId)?.name;
    return `MESA: ${tableName || 'N/A'}`;
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-lg shadow-xl w-full max-w-sm border-t-4 border-[var(--accent-yellow)]">
        <div id="kitchen-ticket-content" className="p-6 bg-white text-black">
          <div className="text-center">
            <h2 className="text-xl font-bold font-bangers tracking-wider">LOCO ALITAS</h2>
            <p className="text-sm font-semibold">Comanda de Cocina</p>
            <p className="text-xs">ID Orden: {order.id.slice(-6).toUpperCase()}</p>
            <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="border-t border-b border-dashed border-black my-2 py-2">
            <p className="text-lg font-bold text-center">{getOrderDestination()}</p>
          </div>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.instanceId} className="text-sm border-b border-dashed border-gray-300 pb-1 last:border-b-0">
                <p className="font-bold text-base">{item.quantity}x {item.name}</p>
                <div className="pl-3 text-xs space-y-0.5">
                  {item.selectedChoice && <p>- Opción: {item.selectedChoice}</p>}
                  {item.selectedWingSauces.length > 0 && <p>- Salsas Alitas: {item.selectedWingSauces.map(s => s.name).join(', ')}</p>}
                  {item.selectedFrySauces.length > 0 && <p>- Salsas Papas: {item.selectedFrySauces.map(s => s.name).join(', ')}</p>}
                  {item.selectedGelatoFlavors.length > 0 && <p>- Sabores Gelato: {item.selectedGelatoFlavors.join(', ')}</p>}
                  {item.notes && <p className="font-bold uppercase text-red-600">** NOTA: {item.notes} **</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 flex justify-end gap-4 bg-[var(--card-bg)] rounded-b-lg no-print">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 text-sm">Cerrar</button>
            <button type="button" onClick={handlePrint} className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-lg hover:bg-[var(--dark-red)] text-sm">Imprimir</button>
        </div>
      </div>
    </div>
  );
};