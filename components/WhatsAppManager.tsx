import React from 'react';
import type { Order } from '../types';
import { WhatsAppIcon } from './Icons';
import { formatPrice } from '../utils/formatPrice';

const TimeElapsed: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsedMinutes, setElapsedMinutes] = React.useState(
        Math.floor((Date.now() - new Date(startTime).getTime()) / 60000)
    );

    React.useEffect(() => {
        const interval = setInterval(() => {
            setElapsedMinutes(Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
        }, 60000);
        return () => clearInterval(interval);
    }, [startTime]);

    return <span className="text-sm text-gray-400">Hace {elapsedMinutes} min</span>;
};


export const WhatsAppManager: React.FC<{ orders: Order[] }> = ({ orders }) => {

    const generateWhatsAppLink = (phone: string, message: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        // Assuming a country code if not present, e.g., 57 for Colombia
        const fullPhone = cleanPhone.length > 10 ? cleanPhone : `57${cleanPhone}`;
        return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    };

    const getOrderDetailsText = (order: Order) => {
        const items = order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
        const total = formatPrice(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0));
        return `Detalles de tu pedido:\n${items}\n\n*Total: ${total}*`;
    };

    const getCustomerInfo = (order: Order) => {
        if (order.orderType === 'delivery') {
            return { name: order.deliveryInfo?.name || 'N/A', phone: order.deliveryInfo?.phone || '' };
        }
        if (order.orderType === 'to-go') {
            return { name: order.toGoName || 'N/A', phone: order.toGoPhone || '' };
        }
        return { name: 'N/A', phone: '' };
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white">Centro de Comunicación WhatsApp</h2>
                <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 transition-colors font-semibold"
                >
                    <WhatsAppIcon />
                    <span className="ml-2">Abrir WhatsApp Web</span>
                </a>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl mb-8 text-emerald-300 text-sm">
                <p>
                    <strong className="font-semibold">¡Importante!</strong> No podemos integrar WhatsApp directamente en esta pantalla por políticas de seguridad de WhatsApp.
                    Usa el botón "Abrir WhatsApp Web" para chatear con tus clientes en una pestaña nueva. Utiliza las tarjetas de abajo para enviar notificaciones rápidas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-xl text-gray-500">No hay pedidos de Delivery o Para Llevar activos.</p>
                    </div>
                ) : (
                    orders.map(order => {
                        const customer = getCustomerInfo(order);
                        const orderDetails = getOrderDetailsText(order);
                        const hasPhone = customer.phone.trim() !== '';

                        const messages = {
                            confirm: `¡Hola ${customer.name}! 👋 Tu pedido en Loco Alitas ha sido confirmado. Estamos preparando todo para ti.\n\n${orderDetails}`,
                            ready: `¡Buenas noticias, ${customer.name}! Tu pedido de Loco Alitas está listo para que lo recojas. ¡Te esperamos! 🍗`,
                            on_way: `¡Hola ${customer.name}! Tu pedido de Loco Alitas ya va en camino. 🛵 ¡Prepárate para disfrutar!`,
                        };
                        
                        return (
                            <div key={order.id} className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] flex flex-col">
                                <div className="p-4 border-b border-[var(--card-border)]">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                                            <p className="text-sm text-sky-400 font-semibold">{order.orderType === 'delivery' ? 'Delivery' : 'Para Llevar'}</p>
                                            <p className="text-xs text-gray-400 font-mono">ID: {order.id.slice(-6).toUpperCase()}</p>
                                        </div>
                                        <div className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                            {order.status === 'ready' ? 'Listo' : 'Abierto'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-gray-400">{customer.phone}</p>
                                        <TimeElapsed startTime={order.createdAt} />
                                    </div>
                                </div>
                                <div className="p-4 flex-grow">
                                     <h4 className="font-semibold text-sm mb-2 text-gray-300">Resumen del Pedido:</h4>
                                     <ul className="text-sm text-gray-400 space-y-1 max-h-24 overflow-y-auto pr-2">
                                         {order.items.map(item => (
                                             <li key={item.instanceId} className="flex justify-between">
                                                 <span>{item.quantity}x {item.name}</span>
                                                 <span>{formatPrice(item.price * item.quantity)}</span>
                                             </li>
                                         ))}
                                     </ul>
                                </div>
                                <div className="p-4 border-t border-[var(--card-border)]">
                                    <h4 className="font-semibold text-sm mb-3 text-gray-300">Enviar Notificación Rápida:</h4>
                                    <div className="flex flex-col gap-2">
                                        <a href={generateWhatsAppLink(customer.phone, messages.confirm)} target="_blank" rel="noopener noreferrer" className={`w-full text-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${!hasPhone ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-sky-600/80 text-white hover:bg-sky-700'}`}>
                                            Confirmar Pedido
                                        </a>
                                        {order.orderType === 'to-go' && (
                                            <a href={generateWhatsAppLink(customer.phone, messages.ready)} target="_blank" rel="noopener noreferrer" className={`w-full text-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${!hasPhone ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600/80 text-white hover:bg-emerald-700'}`}>
                                                Listo para Retirar
                                            </a>
                                        )}
                                        {order.orderType === 'delivery' && (
                                             <a href={generateWhatsAppLink(customer.phone, messages.on_way)} target="_blank" rel="noopener noreferrer" className={`w-full text-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${!hasPhone ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600/80 text-white hover:bg-emerald-700'}`}>
                                                Pedido en Camino
                                            </a>
                                        )}
                                    </div>
                                    {!hasPhone && <p className="text-xs text-red-400 mt-2 text-center">No hay número de teléfono para enviar notificaciones.</p>}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};