import React, { useState, useMemo, useEffect } from 'react';
import type { Table, TableStatus } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface TableManagerProps {
  tables: Table[];
  addTable: (table: Omit<Table, 'id' | 'status'>) => void;
  updateTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
}

const statusStyles: { [key in TableStatus]: { dot: string; text: string; bg: string; border: string } } = {
  available: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50' },
  occupied: { dot: 'bg-red-400', text: 'text-red-300', bg: 'bg-red-900/40', border: 'border-red-500/50' },
  reserved: { dot: 'bg-sky-400', text: 'text-sky-300', bg: 'bg-sky-900/40', border: 'border-sky-500/50' },
  cleaning: { dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-900/40', border: 'border-amber-500/50' },
};

const statusText: { [key in TableStatus]: string } = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpieza',
};

const TableFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (table: Omit<Table, 'status'>) => void;
    tableToEdit: Omit<Table, 'status'> | null;
}> = ({ isOpen, onClose, onSave, tableToEdit }) => {
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');

    useEffect(() => {
        if (tableToEdit) {
            setName(tableToEdit.name);
            setCapacity(tableToEdit.capacity.toString());
        } else {
            setName('');
            setCapacity('');
        }
    }, [tableToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: tableToEdit?.id || '', // id will be replaced for new items
            name,
            capacity: parseInt(capacity, 10) || 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{tableToEdit ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre de la mesa (ej. Mesa 5, Barra 2)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="number" placeholder="Capacidad (asientos)" value={capacity} onChange={e => setCapacity(e.target.value)} required min="1" className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TableCard: React.FC<{ 
    table: Table;
    onStatusChange: (status: TableStatus) => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ table, onStatusChange, onEdit, onDelete }) => {
    const styles = statusStyles[table.status];
    return (
        <div className={`bg-[var(--card-bg)] p-4 rounded-xl shadow-md flex flex-col justify-between border ${styles.border} transition-transform hover:scale-105 hover:shadow-2xl`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">{table.name}</h3>
                    <div className="flex gap-1">
                        <button onClick={onEdit} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/10 transition-colors"><EditIcon /></button>
                        <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
                    </div>
                </div>
                <p className="text-sm text-gray-400">{table.capacity} asientos</p>
            </div>
            <div className="mt-4">
                 <div className="flex items-center justify-between w-full p-2 border rounded-md text-sm bg-black/20 border-gray-600/50">
                    <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-2 ${styles.dot}`}></span>
                        <span className={styles.text}>{statusText[table.status]}</span>
                    </div>
                    <select 
                        value={table.status} 
                        onChange={(e) => onStatusChange(e.target.value as TableStatus)}
                        className="bg-transparent border-none focus:ring-0 text-white"
                    >
                        {Object.keys(statusText).map(status => (
                            <option key={status} value={status} className="bg-gray-800">{statusText[status as TableStatus]}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

const TableCardMap: React.FC<{
    table: Table;
    onStatusChange: (status: TableStatus) => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ table, onStatusChange, onEdit, onDelete }) => {
    const styles = statusStyles[table.status];
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('tableId', table.id);
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                e.dataTransfer.setData('offsetX', offsetX.toString());
                e.dataTransfer.setData('offsetY', offsetY.toString());
                e.currentTarget.style.cursor = 'grabbing';
            }}
            onDragEnd={(e) => {
                e.currentTarget.style.cursor = 'grab';
            }}
            style={{ 
                position: 'absolute',
                left: `${table.x || 0}px`,
                top: `${table.y || 0}px`,
                cursor: 'grab',
                touchAction: 'none'
            }}
            className={`w-40 p-3 rounded-lg shadow-lg flex flex-col justify-between border ${styles.border} ${styles.bg} transition-all duration-200`}
        >
             <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{table.name}</h3>
                </div>
                <p className="text-xs text-gray-400">{table.capacity} asientos</p>
                 <div className={`mt-1 text-xs flex items-center ${styles.text}`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${styles.dot}`}></span>
                    {statusText[table.status]}
                </div>
            </div>
        </div>
    );
};

export const TableManager: React.FC<TableManagerProps> = ({ tables, addTable, updateTable, deleteTable, updateTableStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const { addToast } = useToast();

  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
      const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tables, searchTerm, statusFilter]);
  
  const openAddModal = () => {
    setTableToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setTableToEdit(table);
    setIsModalOpen(true);
  };

  const handleSave = (table: Omit<Table, 'status'>) => {
    if (tableToEdit) {
      updateTable({ ...tableToEdit, name: table.name, capacity: table.capacity });
      addToast('Mesa actualizada con éxito', 'success');
    } else {
      addTable(table);
      addToast('Mesa añadida con éxito', 'success');
    }
  };

  const handleDelete = (tableId: string) => {
      if (window.confirm("¿Estás seguro de que quieres eliminar esta mesa?")) {
          deleteTable(tableId);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const tableId = e.dataTransfer.getData('tableId');
    const offsetX = parseFloat(e.dataTransfer.getData('offsetX'));
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY'));
    const table = tables.find(t => t.id === tableId);
    
    if (table) {
        const mapRect = e.currentTarget.getBoundingClientRect();
        let newX = e.clientX - mapRect.left - offsetX;
        let newY = e.clientY - mapRect.top - offsetY;

        const tableWidth = 160; // w-40 = 10rem = 160px
        const tableHeight = 90; // Approximate height
        newX = Math.max(0, Math.min(newX, mapRect.width - tableWidth));
        newY = Math.max(0, Math.min(newY, mapRect.height - tableHeight));
        
        updateTable({ ...table, x: newX, y: newY });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <TableFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tableToEdit={tableToEdit}
      />
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-white">Gestión de Mesas</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-black/20 p-1 rounded-lg border border-[var(--card-border)]">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>
                Grid
            </button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'map' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>
                Mapa
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white w-full sm:w-auto"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | TableStatus)}
            className="p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white w-full sm:w-auto"
          >
            <option value="all">Todos los Estados</option>
            {Object.keys(statusText).map(status => (
              <option key={status} value={status} className="bg-gray-800">{statusText[status as TableStatus]}</option>
            ))}
          </select>
           <button onClick={openAddModal} className="flex items-center justify-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors w-full sm:w-auto font-semibold">
              <PlusIcon />
              <span className="ml-2">Añadir Mesa</span>
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTables.length > 0 ? (
              filteredTables.map(table => (
                <TableCard 
                  key={table.id} 
                  table={table} 
                  onStatusChange={(status) => updateTableStatus(table.id, status)}
                  onEdit={() => openEditModal(table)}
                  onDelete={() => handleDelete(table.id)}
                />
              ))
          ) : (
              <div className="col-span-full text-center py-10">
                  <p className="text-gray-400">No se encontraron mesas que coincidan con la búsqueda.</p>
              </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative w-full h-[60vh] min-h-[500px] bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {filteredTables.map(table => (
            <TableCardMap 
              key={table.id} 
              table={table}
              onStatusChange={(status) => updateTableStatus(table.id, status)}
              onEdit={() => openEditModal(table)}
              onDelete={() => handleDelete(table.id)}
            />
          ))}
           {filteredTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">No se encontraron mesas que coincidan con la búsqueda.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};