import React, { useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, Table } from '../types';

interface KitchenMonitorProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  tables: Table[];
}

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const OrderTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(
        Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
    );

    useInterval(() => {
        setElapsedSeconds(prev => prev + 1);
    }, 1000);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    const timerColor = 
        elapsedSeconds > 600 ? 'bg-red-600 text-white' : // > 10 mins
        elapsedSeconds > 300 ? 'bg-amber-500 text-black' : // > 5 mins
        'bg-gray-700 text-white';

    return (
        <div className={`text-xl font-bold font-mono px-3 py-1 rounded-md ${timerColor}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

export const KitchenMonitor: React.FC<KitchenMonitorProps> = ({ orders, updateOrderStatus, tables }) => {
    const prevOrderCount = useRef(orders.length);

    useEffect(() => {
        if (orders.length > prevOrderCount.current) {
            const sound = document.getElementById('kitchen-bell-sound') as HTMLAudioElement;
            if(sound) {
                sound.play().catch(e => console.error("Error playing sound:", e));
            }
        }
        prevOrderCount.current = orders.length;
    }, [orders.length]);

    const getOrderDestination = (order: Order): string => {
        if (order.orderType === 'delivery') return `DELIVERY: ${order.deliveryInfo?.name || 'N/A'}`;
        if (order.orderType === 'to-go') return `PARA LLEVAR: ${order.toGoName || 'N/A'}`;
        const tableName = tables.find(t => t.id === order.tableId)?.name;
        return `MESA: ${tableName || 'N/A'}`;
    };

    return (
        <div className="bg-gray-900 p-4 min-h-screen">
             <h2 className="text-3xl font-bold mb-6 text-white">Monitor de Cocina</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <p className="text-2xl text-gray-500">No hay órdenes activas.</p>
                    </div>
                )}
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-lg flex flex-col">
                        <div className="p-4 flex justify-between items-center bg-zinc-800 rounded-t-lg">
                            <div>
                                <h3 className="text-lg font-bold text-white">{getOrderDestination(order)}</h3>
                                <p className="text-xs text-gray-400 font-mono">ID: {order.id.slice(-6).toUpperCase()}</p>
                            </div>
                            <OrderTimer startTime={order.createdAt} />
                        </div>
                        <div className="p-4 flex-grow space-y-2 text-black font-mono">
                             {order.items.map(item => (
                                <div key={item.instanceId} className="text-sm border-b border-dashed border-gray-300 pb-2 mb-2 last:border-b-0">
                                    <p className="font-bold text-base text-gray-900">{item.quantity}x {item.name}</p>
                                    <div className="pl-3 text-xs space-y-0.5 text-gray-600">
                                        {item.selectedChoice && <p>- Opción: {item.selectedChoice}</p>}
                                        {item.selectedWingSauces.length > 0 && <p>- Salsas Alitas: {item.selectedWingSauces.map(s => s.name).join(', ')}</p>}
                                        {item.selectedFrySauces.length > 0 && <p>- Salsas Papas: {item.selectedFrySauces.map(s => s.name).join(', ')}</p>}
                                        {item.selectedGelatoFlavors.length > 0 && <p>- Sabores Gelato: {item.selectedGelatoFlavors.join(', ')}</p>}
                                        {item.notes && <p className="font-bold uppercase text-red-600">** NOTA: {item.notes} **</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2">
                             <button 
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="w-full bg-emerald-500 text-white font-bold py-3 rounded-md hover:bg-emerald-600 transition-colors text-lg"
                            >
                                MARCAR COMO LISTO
                            </button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};