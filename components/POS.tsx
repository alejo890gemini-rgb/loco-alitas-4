import React, { useState, useMemo, useEffect } from 'react';
import type { MenuItem, Table, Order, OrderItem, MenuItemCategory, Sauce, OrderType, DeliveryInfo, PaymentMethod } from '../types';
import { MENU_CATEGORIES, SALSAS_ALITAS, SALSAS_PAPAS, SUBMENU_CHOICES, GELATO_FLAVORS } from '../constants';
import { EditIcon, TruckIcon, UserIcon, CheckCircleIcon, ShoppingBagIcon, SparklesIcon } from './Icons';
import { CategoryIcon } from './CategoryIcon';
import { formatPrice } from '../utils/formatPrice';
import { getUpsellSuggestions } from '../services/geminiService';
import { useToast } from '../hooks/useToast';

const ItemOptionsModal: React.FC<{
    item: OrderItem;
    onClose: () => void;
    onSave: (item: OrderItem) => void;
}> = ({ item, onClose, onSave }) => {
    const [selectedWingSauces, setSelectedWingSauces] = useState<Sauce[]>(item.selectedWingSauces);
    const [selectedFrySauces, setSelectedFrySauces] = useState<Sauce[]>(item.selectedFrySauces);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(item.selectedChoice);
    const [selectedGelatoFlavors, setSelectedGelatoFlavors] = useState<string[]>(item.selectedGelatoFlavors);
    const [notes, setNotes] = useState<string>(item.notes || '');

    const handleWingSauceChange = (sauce: Sauce, checked: boolean) => {
        setSelectedWingSauces(prev => checked ? [...prev, sauce] : prev.filter(s => s.key !== sauce.key));
    };

    const handleFrySauceChange = (sauce: Sauce, checked: boolean) => {
        setSelectedFrySauces(prev => checked ? [...prev, sauce] : prev.filter(s => s.key !== sauce.key));
    };

    const handleGelatoFlavorChange = (index: number, flavor: string) => {
        const newFlavors = [...selectedGelatoFlavors];
        newFlavors[index] = flavor;
        setSelectedGelatoFlavors(newFlavors);
    };

    const handleSave = () => {
        onSave({ ...item, selectedWingSauces, selectedFrySauces, selectedChoice, selectedGelatoFlavors, notes });
        onClose();
    };
    
    const choices = item.submenuKey ? SUBMENU_CHOICES[item.submenuKey] : [];

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-6 w-full max-w-lg border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-4 text-white">Personalizar: {item.name}</h2>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {item.maxChoices && item.maxChoices > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">Selecciona {item.maxChoices} Sabor(es)</h3>
                            <div className="space-y-2">
                                {[...Array(item.maxChoices)].map((_, index) => {
                                    const currentSelection = selectedGelatoFlavors[index];
                                    const otherSelectedFlavors = selectedGelatoFlavors.filter((_, i) => i !== index);
                                    const availableFlavors = GELATO_FLAVORS.filter(f => !otherSelectedFlavors.includes(f));
                                    
                                    return (
                                        <select 
                                            key={index}
                                            value={currentSelection || ''}
                                            onChange={(e) => handleGelatoFlavorChange(index, e.target.value)}
                                            className="w-full p-2 rounded-lg bg-black/20 border-[var(--card-border)] text-white focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)]"
                                        >
                                            <option value="" disabled>Sabor {index + 1}</option>
                                            {availableFlavors.map(flavor => <option key={flavor} value={flavor}>{flavor}</option>)}
                                        </select>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {item.hasWings && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">Salsas para Alitas</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SALSAS_ALITAS.map(sauce => (
                                    <label key={sauce.key} className="flex items-center space-x-2 p-2 rounded-md bg-black/20 cursor-pointer border border-transparent has-[:checked]:border-[var(--primary-red)] has-[:checked]:bg-red-900/40">
                                        <input type="checkbox"
                                            checked={selectedWingSauces.some(s => s.key === sauce.key)}
                                            onChange={(e) => handleWingSauceChange(sauce, e.target.checked)}
                                            className="h-4 w-4 rounded-sm border-gray-500 bg-gray-800 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"
                                        />
                                        <span className="text-sm text-gray-200">{sauce.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                     {item.hasFries && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">Salsas para Papas</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SALSAS_PAPAS.map(sauce => (
                                    <label key={sauce.key} className="flex items-center space-x-2 p-2 rounded-md bg-black/20 cursor-pointer border border-transparent has-[:checked]:border-[var(--primary-red)] has-[:checked]:bg-red-900/40">
                                        <input type="checkbox"
                                            checked={selectedFrySauces.some(s => s.key === sauce.key)}
                                            onChange={(e) => handleFrySauceChange(sauce, e.target.checked)}
                                            className="h-4 w-4 rounded-sm border-gray-500 bg-gray-800 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"
                                        />
                                        <span className="text-sm text-gray-200">{sauce.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {item.submenuKey && choices.length > 0 && (
                         <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">Elige una opción</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                               {choices.map(choice => (
                                   <label key={choice} className="flex items-center space-x-2 p-2 rounded-md bg-black/20 cursor-pointer border border-transparent has-[:checked]:border-[var(--primary-red)] has-[:checked]:bg-red-900/40">
                                        <input type="radio"
                                            name={`${item.instanceId}-choice`}
                                            value={choice}
                                            checked={selectedChoice === choice}
                                            onChange={(e) => setSelectedChoice(e.target.value)}
                                            className="h-4 w-4 border-gray-500 bg-gray-800 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"
                                        />
                                        <span className="text-sm text-gray-200">{choice}</span>
                                   </label>
                               ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-300">Notas Especiales (ej. sin cebolla)</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full p-2 rounded-lg bg-black/20 border-[var(--card-border)] text-white focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)]"
                            placeholder="Añadir petición del cliente..."
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-[var(--card-border)]">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar Cambios</button>
                </div>
            </div>
        </div>
    )
};

const DeliveryInfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: DeliveryInfo) => void;
    initialInfo: DeliveryInfo | null;
}> = ({ isOpen, onClose, onSave, initialInfo }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        setName(initialInfo?.name || '');
        setPhone(initialInfo?.phone || '');
        setAddress(initialInfo?.address || '');
    }, [initialInfo, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, phone, address });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><UserIcon className="mr-2"/> Información del Cliente</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre del cliente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="tel" placeholder="Teléfono de contacto" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <textarea placeholder="Dirección de entrega" value={address} onChange={e => setAddress(e.target.value)} required rows={3} className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white"></textarea>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ToGoNameModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: { name: string; phone: string }) => void;
    initialInfo: { name: string; phone: string } | null;
}> = ({ isOpen, onClose, onSave, initialInfo }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        setName(initialInfo?.name || '');
        setPhone(initialInfo?.phone || '');
    }, [initialInfo, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, phone });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-sm border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><UserIcon className="mr-2"/> Info Para Llevar</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre para la orden" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="tel" placeholder="Teléfono (Opcional)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentMethod: PaymentMethod) => void;
    total: number;
}> = ({ isOpen, onClose, onConfirm, total }) => {
    const [method, setMethod] = useState<PaymentMethod>('Efectivo');
    const [amountReceived, setAmountReceived] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setMethod('Efectivo');
            setAmountReceived('');
        }
    }, [isOpen]);

    const change = useMemo(() => {
        const received = parseFloat(amountReceived);
        if (method === 'Efectivo' && !isNaN(received) && received >= total) {
            return received - total;
        }
        return 0;
    }, [amountReceived, total, method]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-2 text-white">Confirmar Pago</h2>
                <p className="text-4xl font-semibold text-[var(--accent-yellow)] mb-6">{formatPrice(total)}</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-300">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['Efectivo', 'Tarjeta', 'Transferencia'] as PaymentMethod[]).map(m => (
                                <button key={m} onClick={() => setMethod(m)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${method === m ? 'bg-[var(--primary-red)] text-white ring-2 ring-red-500' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {method === 'Efectivo' && (
                        <div>
                            <label htmlFor="amount-received" className="text-sm font-semibold text-gray-300">Efectivo Recibido</label>
                            <input
                                id="amount-received"
                                type="number"
                                placeholder="Monto"
                                value={amountReceived}
                                onChange={e => setAmountReceived(e.target.value)}
                                className="w-full mt-2 p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white"
                            />
                            <p className="mt-2 text-lg text-white">Cambio: <span className="font-bold text-[var(--accent-yellow)]">{formatPrice(change)}</span></p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-[var(--card-border)]">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="button" onClick={() => onConfirm(method)} className="px-6 py-2 bg-[var(--accent-yellow)] text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors">Confirmar Venta</button>
                </div>
            </div>
        </div>
    );
};

interface POSProps {
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  createOrder: (order: Order) => void;
  completeSale: (order: Order, paymentMethod: PaymentMethod) => void;
}

export const POS: React.FC<POSProps> = ({ menuItems, tables, orders, createOrder, completeSale }) => {
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<{type: 'table' | 'delivery-order' | 'togo-order', id: string} | null>(null);
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'All'>('All');
    const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
    const [orderType, setOrderType] = useState<OrderType>('dine-in');
    const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
    const [toGoInfo, setToGoInfo] = useState<{name: string; phone: string} | null>(null);
    const [isDeliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [isToGoModalOpen, setToGoModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<MenuItem[]>([]);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
    const { addToast } = useToast();
    
    const activeOrder = useMemo(() => {
        if(!selectedEntity) return null;
        const foundOrder = orders.find(o => {
            if (o.status === 'completed' || o.status === 'cancelled') return false;
            if (selectedEntity.type === 'table') return o.tableId === selectedEntity.id;
            return o.id === selectedEntity.id;
        });
        return foundOrder || null;
    }, [selectedEntity, orders]);

    const displayItems = useMemo(() => activeOrder ? activeOrder.items : currentOrderItems, [activeOrder, currentOrderItems]);

    // Debounced effect for AI suggestions
    useEffect(() => {
        if (activeOrder || currentOrderItems.length === 0) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(() => {
            setIsSuggestionLoading(true);
            const simpleItems = currentOrderItems.map(item => ({ name: item.name, quantity: item.quantity }));
            const simpleMenu = menuItems.map(item => ({ name: item.name, category: item.category }));

            getUpsellSuggestions(simpleItems, simpleMenu)
                .then(suggestionNames => {
                    const suggestedItems = menuItems.filter(item => suggestionNames.includes(item.name));
                    setSuggestions(suggestedItems);
                })
                .catch(error => {
                    console.error("Failed to fetch suggestions:", error);
                    addToast('Error al obtener sugerencias.', 'error');
                })
                .finally(() => {
                    setIsSuggestionLoading(false);
                });
        }, 750);

        return () => {
            clearTimeout(handler);
        };
    }, [currentOrderItems, menuItems, activeOrder, addToast]);

    const resetStateForNewOrder = () => {
        setCurrentOrderItems([]);
        setSelectedEntity(null);
        setDeliveryInfo(null);
        setToGoInfo(null);
    }
    
    const handleOrderTypeChange = (type: OrderType) => {
        setOrderType(type);
        resetStateForNewOrder();
    }

    const addToOrder = (item: MenuItem) => {
        if(activeOrder) return;
        
        const newItem: OrderItem = {
            ...item,
            instanceId: `${item.id}-${Date.now()}`,
            quantity: 1,
            selectedWingSauces: [],
            selectedFrySauces: [],
            selectedChoice: null,
            selectedGelatoFlavors: [],
            notes: '',
        };
        setCurrentOrderItems(prev => [...prev, newItem]);
    };
    
    const updateItemQuantity = (instanceId: string, change: number) => {
        if(activeOrder) return;
        setCurrentOrderItems(prev => {
            const item = prev.find(i => i.instanceId === instanceId);
            if (!item) return prev;
            
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                return prev.filter(i => i.instanceId !== instanceId);
            }
            return prev.map(i => i.instanceId === instanceId ? { ...i, quantity: newQuantity } : i);
        });
    };
    
    const handleEntitySelect = (type: 'table' | 'delivery-order' | 'togo-order', id: string) => {
        setSelectedEntity({type, id});
        setCurrentOrderItems([]);
        setDeliveryInfo(null);
        setToGoInfo(null);
    }

    const handleCreateOrder = () => {
        let newOrder: Order | null = null;
        if (orderType === 'dine-in' && selectedEntity?.type === 'table' && currentOrderItems.length > 0) {
            newOrder = {
                id: `order-${Date.now()}`,
                orderType: 'dine-in',
                tableId: selectedEntity.id,
                items: currentOrderItems,
                status: 'open',
                createdAt: new Date().toISOString(),
            };
        } else if (orderType === 'delivery' && deliveryInfo && currentOrderItems.length > 0) {
            newOrder = {
                id: `order-${Date.now()}`,
                orderType: 'delivery',
                deliveryInfo: deliveryInfo,
                items: currentOrderItems,
                status: 'open',
                createdAt: new Date().toISOString(),
            };
        } else if (orderType === 'to-go' && toGoInfo && currentOrderItems.length > 0) {
            newOrder = {
                id: `order-${Date.now()}`,
                orderType: 'to-go',
                toGoName: toGoInfo.name,
                toGoPhone: toGoInfo.phone,
                items: currentOrderItems,
                status: 'open',
                createdAt: new Date().toISOString(),
            };
        }

        if (newOrder) {
            createOrder(newOrder);
            resetStateForNewOrder();
        }
    };
    
    const handleConfirmPayment = (paymentMethod: PaymentMethod) => {
        if (activeOrder) {
            completeSale(activeOrder, paymentMethod);
            resetStateForNewOrder();
            setPaymentModalOpen(false);
        }
    };

    const handleSaveItemEdit = (updatedItem: OrderItem) => {
        setCurrentOrderItems(prev => prev.map(item => item.instanceId === updatedItem.instanceId ? updatedItem : item));
    }
    
    const filteredMenuItems = useMemo(() => {
        if (activeCategory === 'All') return menuItems;
        return menuItems.filter(item => item.category === activeCategory);
    }, [menuItems, activeCategory]);
    
    const orderTotal = displayItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const availableTables = useMemo(() => tables.filter(t => t.status === 'available'), [tables]);
    const openDineInOrders = useMemo(() => orders.filter(o => o.status === 'open' || o.status === 'ready').filter(o => o.orderType === 'dine-in'), [orders]);

    const canAddToOrder = 
        (orderType === 'dine-in' && selectedEntity?.type === 'table' && !activeOrder) || 
        (orderType === 'delivery' && deliveryInfo && !activeOrder) ||
        (orderType === 'to-go' && toGoInfo && !activeOrder);

    const canCreateOrder = 
        (orderType === 'dine-in' && selectedEntity?.type === 'table' && !activeOrder && currentOrderItems.length > 0) || 
        (orderType === 'delivery' && deliveryInfo && !activeOrder && currentOrderItems.length > 0) ||
        (orderType === 'to-go' && toGoInfo && !activeOrder && currentOrderItems.length > 0);

    const renderDestination = () => {
        if (activeOrder) {
            if (activeOrder.orderType === 'dine-in') return tables.find(t => t.id === activeOrder.tableId)?.name;
            if (activeOrder.orderType === 'delivery') return activeOrder.deliveryInfo?.name;
            if (activeOrder.orderType === 'to-go') return activeOrder.toGoName;
        }
        if (orderType === 'dine-in') {
            return selectedEntity ? tables.find(t => t.id === selectedEntity.id)?.name : 'Seleccione una mesa';
        }
        if (orderType === 'delivery') {
            return deliveryInfo ? (
               <span className="flex items-center gap-2 text-emerald-400">
                   <CheckCircleIcon /> {deliveryInfo.name}
                   <button onClick={() => setDeliveryModalOpen(true)} className="text-sky-400 hover:text-sky-300"><EditIcon /></button>
               </span>
           ) : <button onClick={() => setDeliveryModalOpen(true)} className="text-base font-normal underline">Añadir Info de Cliente</button>;
        }
        if (orderType === 'to-go') {
            return toGoInfo ? (
               <span className="flex items-center gap-2 text-emerald-400">
                   <CheckCircleIcon /> {toGoInfo.name}
                   <button onClick={() => setToGoModalOpen(true)} className="text-sky-400 hover:text-sky-300"><EditIcon /></button>
               </span>
           ) : <button onClick={() => setToGoModalOpen(true)} className="text-base font-normal underline">Añadir Info de Cliente</button>;
        }
        return 'N/A';
    };


    return (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-9rem)] gap-6">
            {editingItem && <ItemOptionsModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveItemEdit} />}
            {isDeliveryModalOpen && <DeliveryInfoModal isOpen={isDeliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} onSave={setDeliveryInfo} initialInfo={deliveryInfo} />}
            {isToGoModalOpen && <ToGoNameModal isOpen={isToGoModalOpen} onClose={() => setToGoModalOpen(false)} onSave={setToGoInfo} initialInfo={toGoInfo} />}
            {isPaymentModalOpen && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onConfirm={handleConfirmPayment} total={orderTotal} />}
            
            <div className="lg:w-2/3 flex flex-col gap-6">
                 <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow-lg flex-none border border-[var(--card-border)]">
                     <div className="flex gap-2">
                        <button onClick={() => handleOrderTypeChange('dine-in')} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${orderType === 'dine-in' ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>
                           <CategoryIcon category="HAMBURGUESAS" className="w-6 h-6" /> En Restaurante
                        </button>
                        <button onClick={() => handleOrderTypeChange('delivery')} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${orderType === 'delivery' ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>
                            <TruckIcon /> Delivery
                        </button>
                         <button onClick={() => handleOrderTypeChange('to-go')} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${orderType === 'to-go' ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>
                            <ShoppingBagIcon /> Para Llevar
                        </button>
                     </div>
                </div>

                <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow-lg border border-[var(--card-border)]">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                        {orderType === 'dine-in' && "Seleccionar Mesa / Orden"}
                        {orderType === 'delivery' && "Órdenes de Delivery Activas"}
                        {orderType === 'to-go' && "Órdenes Para Llevar Activas"}
                    </h3>
                    {orderType === 'dine-in' && (
                        <div className="flex flex-wrap gap-2">
                            {availableTables.map(table => (
                                <button key={table.id} onClick={() => handleEntitySelect('table', table.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedEntity?.id === table.id && selectedEntity.type === 'table' ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'}`}>
                                    {table.name}
                                </button>
                            ))}
                            {openDineInOrders.map(order => {
                                const isReady = order.status === 'ready';
                                return (
                                 <button key={order.id} onClick={() => handleEntitySelect('table', order.tableId!)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedEntity?.id === order.tableId ? 'bg-[var(--accent-yellow)] text-black' : (isReady ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-600 text-white hover:bg-amber-700')}`}>
                                    {tables.find(t => t.id === order.tableId)?.name} {isReady ? '(Listo!)' : '(Ocupada)'}
                                </button>
                                )
                            })}
                        </div>
                    )}
                    {orderType === 'delivery' && (
                         <div className="flex flex-wrap gap-2">
                            {orders.filter(o => (o.status === 'open' || o.status === 'ready') && o.orderType === 'delivery').map(order => {
                                const isReady = order.status === 'ready';
                                return (
                                <button key={order.id} onClick={() => handleEntitySelect('delivery-order', order.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedEntity?.id === order.id ? 'bg-[var(--accent-yellow)] text-black' : (isReady ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-600 text-white hover:bg-amber-700')}`}>
                                    {order.deliveryInfo?.name} {isReady ? '(Listo!)' : ''}
                                </button>
                                )
                            })}
                             {orders.filter(o => o.status === 'open' && o.orderType === 'delivery').length === 0 && <p className="text-gray-400 text-sm">No hay órdenes de delivery activas.</p>}
                        </div>
                    )}
                     {orderType === 'to-go' && (
                         <div className="flex flex-wrap gap-2">
                             {orders.filter(o => (o.status === 'open' || o.status === 'ready') && o.orderType === 'to-go').map(order => {
                                 const isReady = order.status === 'ready';
                                 return (
                                <button key={order.id} onClick={() => handleEntitySelect('togo-order', order.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedEntity?.id === order.id ? 'bg-[var(--accent-yellow)] text-black' : (isReady ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-600 text-white hover:bg-amber-700')}`}>
                                    {order.toGoName} {isReady ? '(Listo!)' : ''}
                                </button>
                                 )
                            })}
                             {orders.filter(o => o.status === 'open' && o.orderType === 'to-go').length === 0 && <p className="text-gray-400 text-sm">No hay órdenes para llevar activas.</p>}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-[var(--card-bg)] p-4 rounded-xl shadow-lg flex flex-col border border-[var(--card-border)]">
                    <div className="border-b border-[var(--card-border)] mb-4">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                            <button onClick={() => setActiveCategory('All')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-semibold text-sm ${activeCategory === 'All' ? 'border-[var(--primary-red)] text-[var(--accent-yellow)]' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>Todos</button>
                            {MENU_CATEGORIES.map(cat => (
                               <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap py-2 px-1 border-b-2 font-semibold text-sm ${activeCategory === cat ? 'border-[var(--primary-red)] text-[var(--accent-yellow)]' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>{cat}</button>
                            ))}
                        </nav>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto p-1 flex-1">
                        {filteredMenuItems.map(item => (
                            <button key={item.id} onClick={() => addToOrder(item)} disabled={!canAddToOrder} className="text-left bg-black/20 rounded-xl shadow-md overflow-hidden transition-all duration-200 border border-[var(--card-border)] hover:border-[var(--primary-red)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--card-border)] disabled:hover:scale-100 flex flex-col">
                                <div className="h-20 relative flex-grow flex items-center justify-center bg-black/20">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <CategoryIcon category={item.category} className="w-9 h-9 text-gray-500" />
                                    )}
                                    <span className="absolute bottom-0 right-0 text-white font-extrabold text-sm px-2 py-1 rounded-tl-lg bg-[var(--dark-red)]">{formatPrice(item.price)}</span>
                                </div>
                                <div className="p-2">
                                    <h4 className="font-semibold text-sm truncate text-white leading-tight">{item.name}</h4>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:w-1/3 bg-[var(--card-bg)] p-6 rounded-xl shadow-lg flex flex-col border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-4 text-white">Orden Actual</h2>
                <div className="mb-4 text-lg font-semibold text-[var(--accent-yellow)]">
                   Destino: {renderDestination()}
                </div>
                <div className="flex-1 overflow-y-auto -mx-6 px-6 border-t border-b border-[var(--card-border)] py-4 space-y-3">
                    {displayItems.length === 0 ? (
                        <p className="text-gray-400 text-center pt-10">Añada platillos a la orden.</p>
                    ) : (
                        displayItems.map(item => (
                            <div key={item.instanceId} className="flex flex-col p-3 rounded-md bg-black/20">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-2">
                                        <p className="font-semibold text-white">{item.name}</p>
                                        <p className="text-sm text-gray-400">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!activeOrder && <button onClick={() => updateItemQuantity(item.instanceId, -1)} className="w-6 h-6 rounded-full bg-white/5 text-white">-</button>}
                                        <span className="font-semibold w-6 text-center text-white">{item.quantity}</span>
                                        {!activeOrder && <button onClick={() => updateItemQuantity(item.instanceId, 1)} className="w-6 h-6 rounded-full bg-white/5 text-white">+</button>}
                                        <span className="font-bold w-20 text-right text-white">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-2 space-y-1">
                                    {item.selectedChoice && <p><span className="font-semibold">Opción:</span> {item.selectedChoice}</p>}
                                    {item.selectedWingSauces.length > 0 && <p><span className="font-semibold">Salsas Alitas:</span> {item.selectedWingSauces.map(s => s.name).join(', ')}</p>}
                                    {item.selectedFrySauces.length > 0 && <p><span className="font-semibold">Salsas Papas:</span> {item.selectedFrySauces.map(s => s.name).join(', ')}</p>}
                                    {item.selectedGelatoFlavors.length > 0 && <p><span className="font-semibold">Sabores Gelato:</span> {item.selectedGelatoFlavors.filter(f => f).join(', ')}</p>}
                                    {item.notes && <p className="text-amber-300 italic"><span className="font-semibold">Nota:</span> {item.notes}</p>}
                                </div>
                                {!activeOrder && (item.hasWings || item.hasFries || item.submenuKey || (item.maxChoices && item.maxChoices > 0)) && (
                                    <button onClick={() => setEditingItem(item)} className="text-[var(--accent-yellow)] hover:text-yellow-500 text-xs font-semibold mt-2 flex items-center self-start gap-1">
                                        <EditIcon /> Personalizar
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
                {!activeOrder && (isSuggestionLoading || suggestions.length > 0) && (
                    <div className="py-4 border-b border-[var(--card-border)]">
                        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <SparklesIcon className="text-purple-400 w-4 h-4"/>
                            Sugerencias AI
                        </h3>
                        {isSuggestionLoading ? (
                            <p className="text-xs text-gray-400">Buscando recomendaciones...</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => addToOrder(item)}
                                        className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium px-2 py-1 rounded-full hover:bg-purple-500/20"
                                    >
                                        + {item.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className="pt-4">
                    <div className="flex justify-between text-xl font-bold mb-4 text-white">
                        <span>Total</span>
                        <span className="text-[var(--accent-yellow)]">{formatPrice(orderTotal)}</span>
                    </div>
                    {activeOrder ? (
                         <button onClick={() => setPaymentModalOpen(true)} disabled={displayItems.length === 0} className="w-full bg-[var(--accent-yellow)] text-black py-3 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Cobrar
                        </button>
                    ) : (
                        <button onClick={handleCreateOrder} disabled={!canCreateOrder} className="w-full bg-[var(--primary-red)] text-white py-3 rounded-lg font-bold text-lg hover:bg-[var(--dark-red)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Crear Orden
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};