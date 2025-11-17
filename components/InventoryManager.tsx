import React, { useState } from 'react';
import type { InventoryItem, InventoryUnit } from '../types';
import { PlusIcon, EditIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/formatPrice';

interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  adjustStock: (itemId: string, newStock: number) => void;
}

const UNITS: InventoryUnit[] = ['kg', 'g', 'L', 'ml', 'unidad'];

const InventoryItemFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  itemToEdit: InventoryItem | null;
}> = ({ isOpen, onClose, onSave, itemToEdit }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('unidad');
  const [stock, setStock] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');

  React.useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCost(itemToEdit.cost.toString());
      setUnit(itemToEdit.unit);
      setStock(itemToEdit.stock.toString());
      setAlertThreshold(itemToEdit.alertThreshold.toString());
    } else {
      setName('');
      setCost('');
      setUnit('unidad');
      setStock('0');
      setAlertThreshold('0');
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: itemToEdit?.id,
      name,
      cost: parseFloat(cost),
      unit,
      stock: itemToEdit ? parseFloat(stock) : 0, // Stock is managed via adjustments
      alertThreshold: parseFloat(alertThreshold),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
        <h2 className="text-2xl font-bold mb-6 text-white">{itemToEdit ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nombre del ingrediente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Costo por unidad" value={cost} onChange={e => setCost(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
            <select value={unit} onChange={e => setUnit(e.target.value as InventoryUnit)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
              {UNITS.map(u => <option key={u} value={u} className="bg-gray-800">{u}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {itemToEdit && (
                <input type="number" placeholder="Stock Actual" value={stock} onChange={e => setStock(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
             )}
            <input type="number" placeholder="Alerta de Stock Bajo" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const StockAdjustModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newStock: number) => void;
    item: InventoryItem;
}> = ({ isOpen, onClose, onSave, item }) => {
    const [adjustment, setAdjustment] = useState('');
    const [action, setAction] = useState<'add' | 'set'>('add');

    const handleSave = () => {
        const value = parseFloat(adjustment);
        if(isNaN(value)) return;
        
        let newStock = item.stock;
        if(action === 'add') {
            newStock += value;
        } else {
            newStock = value;
        }
        onSave(Math.max(0, newStock));
        onClose();
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-sm border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-2 text-white">Ajustar Stock</h2>
                <p className="text-lg text-[var(--accent-yellow)] mb-6">{item.name}</p>
                <div className="space-y-4">
                    <p className="text-center text-gray-300">Stock Actual: <span className="font-bold text-2xl">{item.stock.toFixed(2)} {item.unit}</span></p>
                    <div className="flex items-center bg-black/20 p-1 rounded-lg border border-[var(--card-border)]">
                        <button onClick={() => setAction('add')} className={`flex-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${action === 'add' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>Añadir / Quitar</button>
                        <button onClick={() => setAction('set')} className={`flex-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${action === 'set' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>Establecer Total</button>
                    </div>
                    <input type="number" placeholder={action === 'add' ? "Ej: 10 para añadir, -5 para quitar" : "Ej: 50 para establecer a 50"} value={adjustment} onChange={e => setAdjustment(e.target.value)} step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors">Aplicar Ajuste</button>
                </div>
            </div>
        </div>
    );
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventoryItems, addInventoryItem, updateInventoryItem, adjustStock }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);

  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };
  
  const openAdjustModal = (item: InventoryItem) => {
    setItemToAdjust(item);
    setIsAdjustModalOpen(true);
  }

  const handleSave = (item: any) => {
    if (item.id) {
      updateInventoryItem(item);
    } else {
      addInventoryItem(item);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Gestión de Inventario</h2>
        <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[var(--dark-red)] transition-colors font-semibold">
          <PlusIcon />
          <span className="ml-2">Añadir Ingrediente</span>
        </button>
      </div>

      <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Ingrediente</th>
                <th scope="col" className="px-6 py-3 text-center">Stock Actual</th>
                <th scope="col" className="px-6 py-3 text-center">Unidad</th>
                <th scope="col" className="px-6 py-3">Costo / Unidad</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => {
                const isLowStock = item.stock <= item.alertThreshold;
                return (
                  <tr key={item.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name}</th>
                    <td className={`px-6 py-4 font-bold text-center ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                        {item.stock.toFixed(2)}
                        {isLowStock && <span className="ml-2 text-xs">(Bajo)</span>}
                    </td>
                    <td className="px-6 py-4 text-center">{item.unit}</td>
                    <td className="px-6 py-4">{formatPrice(item.cost)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openAdjustModal(item)} className="text-amber-400 hover:text-amber-300 mr-4 transition-colors p-2 rounded-full hover:bg-amber-500/10 font-semibold text-xs">AJUSTAR</button>
                      <button onClick={() => openEditModal(item)} className="text-sky-400 hover:text-sky-300 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        itemToEdit={itemToEdit}
      />
      {itemToAdjust && (
          <StockAdjustModal
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            onSave={(newStock) => adjustStock(itemToAdjust.id, newStock)}
            item={itemToAdjust}
          />
      )}
    </div>
  );
};