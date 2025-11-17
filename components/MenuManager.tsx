import React, { useState, useMemo } from 'react';
import type { MenuItem, MenuItemCategory, Ingredient, InventoryItem } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SparklesIcon, XIcon, SpinnerIcon } from './Icons';
import { generateMenuDescription, generateImageForDish } from '../services/geminiService';
import { MENU_CATEGORIES } from '../constants';
import { CategoryIcon } from './CategoryIcon';
import { formatPrice } from '../utils/formatPrice';
import { useToast } from '../hooks/useToast';

interface MenuManagerProps {
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  inventoryItems: InventoryItem[];
}

const MenuItemFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: any) => void;
    itemToEdit: MenuItem | null;
    inventoryItems: InventoryItem[];
}> = ({ isOpen, onClose, onSave, itemToEdit, inventoryItems }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<MenuItemCategory>('Main Course');
    const [hasWings, setHasWings] = useState(false);
    const [hasFries, setHasFries] = useState(false);
    const [submenuKey, setSubmenuKey] = useState('');
    const [maxChoices, setMaxChoices] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>('');
    const [recipe, setRecipe] = useState<Ingredient[]>([]);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const { addToast } = useToast();

    // Recipe state
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [ingredientQuantity, setIngredientQuantity] = useState('');

    React.useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setDescription(itemToEdit.description);
            setPrice(itemToEdit.price.toString());
            setCategory(itemToEdit.category);
            setHasWings(itemToEdit.hasWings || false);
            setHasFries(itemToEdit.hasFries || false);
            setSubmenuKey(itemToEdit.submenuKey || '');
            setMaxChoices(itemToEdit.maxChoices?.toString() || '');
            setImageUrl(itemToEdit.imageUrl || '');
            setRecipe(itemToEdit.recipe || []);
        } else {
            setName('');
            setDescription('');
            setPrice('');
            setCategory(MENU_CATEGORIES[0] || 'Other');
            setHasWings(false);
            setHasFries(false);
            setSubmenuKey('');
            setMaxChoices('');
            setImageUrl('');
            setRecipe([]);
        }
    }, [itemToEdit, isOpen]);
    
    const handleAddIngredientToRecipe = () => {
        if (!selectedIngredient || !ingredientQuantity) {
            addToast('Selecciona un ingrediente y define una cantidad.', 'error');
            return;
        }
        if (recipe.some(ing => ing.inventoryItemId === selectedIngredient)) {
            addToast('Ese ingrediente ya está en la receta.', 'info');
            return;
        }
        const newIngredient: Ingredient = {
            inventoryItemId: selectedIngredient,
            quantity: parseFloat(ingredientQuantity),
        };
        setRecipe(prev => [...prev, newIngredient]);
        setSelectedIngredient('');
        setIngredientQuantity('');
    };
    
    const handleRemoveIngredient = (inventoryItemId: string) => {
        setRecipe(prev => prev.filter(ing => ing.inventoryItemId !== inventoryItemId));
    };

    const handleGenerateDescription = async () => {
        if (!name) return;
        setIsGeneratingDesc(true);
        try {
            const desc = await generateMenuDescription(name);
            setDescription(desc);
        } catch (error) {
            console.error("Failed to generate description", error);
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!name || !description) {
            addToast('El nombre y la descripción son necesarios para generar la imagen.', 'error');
            return;
        };
        setIsGeneratingImg(true);
        try {
            const generatedUrl = await generateImageForDish(name, description);
            setImageUrl(generatedUrl);
        } catch (error) {
            addToast('Error al generar la imagen.', 'error');
            console.error("Failed to generate image", error);
        } finally {
            setIsGeneratingImg(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            id: itemToEdit?.id,
            name, 
            description, 
            price: parseFloat(price), 
            category,
            hasWings,
            hasFries,
            submenuKey: submenuKey || undefined,
            maxChoices: maxChoices ? parseInt(maxChoices, 10) : undefined,
            imageUrl,
            recipe,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-[var(--card-border)] max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-white flex-none">{itemToEdit ? 'Editar Platillo' : 'Nuevo Platillo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Dish Info */}
                        <div className="space-y-4">
                            {imageUrl || isGeneratingImg ? (
                                <div className="w-full h-40 bg-black/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                                    {isGeneratingImg ? <span className="text-gray-400">Generando imagen...</span> : <img src={imageUrl} alt={name} className="w-full h-full object-cover" />}
                                </div>
                            ) : null}

                            <input type="text" placeholder="Nombre del platillo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            <div className="relative">
                                <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white"></textarea>
                                <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !name} className="absolute bottom-2 right-2 flex items-center bg-purple-600 text-white px-2 py-1 rounded-md text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                  <SparklesIcon className="w-4 h-4" />
                                  <span className="ml-1">{isGeneratingDesc ? '...' : 'AI'}</span>
                                </button>
                            </div>
                            <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImg || !name || !description} className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <SparklesIcon />
                                <span>{isGeneratingImg ? 'Generando Imagen...' : 'Generar Imagen con IA'}</span>
                            </button>
                            <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            <input type="text" placeholder="Categoría" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            
                            {category === '🍨 LOCOGELATOS ARTESANALES' && (
                                <input type="number" placeholder="Máx. Opciones (Gelato)" value={maxChoices} onChange={e => setMaxChoices(e.target.value)} min="0" step="1" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            )}
                            
                            <input type="text" placeholder="Clave de Submenú (ej. jugos_naturales)" value={submenuKey} onChange={e => setSubmenuKey(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />

                            <div className="flex space-x-6 pt-2">
                                <label className="flex items-center"><input type="checkbox" checked={hasWings} onChange={e => setHasWings(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"/><span className="ml-2 text-sm text-gray-300">Incluye Alitas</span></label>
                                <label className="flex items-center"><input type="checkbox" checked={hasFries} onChange={e => setHasFries(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"/><span className="ml-2 text-sm text-gray-300">Incluye Papas</span></label>
                            </div>
                        </div>

                        {/* Right Column: Recipe Manager */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white border-b-2 border-[var(--accent-yellow)] pb-1">Receta / Ingredientes</h3>
                            <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-[var(--card-border)]">
                                <div className="flex gap-2">
                                    <select value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
                                        <option value="" disabled>Seleccionar ingrediente...</option>
                                        {inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Cant." value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} min="0" step="any" className="w-24 p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                                </div>
                                <button type="button" onClick={handleAddIngredientToRecipe} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors text-sm">Añadir Ingrediente</button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {recipe.length > 0 ? recipe.map(ing => {
                                    const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);
                                    return (
                                        <div key={ing.inventoryItemId} className="flex justify-between items-center p-2 rounded-md bg-white/5">
                                            <div>
                                                <span className="font-semibold text-white">{invItem?.name || 'Desconocido'}</span>
                                                <span className="text-gray-400 text-sm"> ({ing.quantity} {invItem?.unit})</span>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveIngredient(ing.inventoryItemId)} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    );
                                }) : <p className="text-center text-gray-500 text-sm py-4">Aún no hay ingredientes en la receta.</p>}
                            </div>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-[var(--card-border)] flex-none">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                </div>
            </div>
        </div>
    );
};


export const MenuManager: React.FC<MenuManagerProps> = ({ menuItems, addMenuItem, updateMenuItem, deleteMenuItem, inventoryItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const [generatingDescId, setGeneratingDescId] = useState<string | null>(null);
  const { addToast } = useToast();

  const itemsByCategory = useMemo(() => {
    return menuItems.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: MenuItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };
  
  const handleSave = (item: any) => {
    if(item.id) {
        updateMenuItem(item);
        addToast('Platillo actualizado con éxito', 'success');
    } else {
        addMenuItem(item);
        addToast('Platillo añadido con éxito', 'success');
    }
  };

  const handleGenerateDescriptionForRow = async (item: MenuItem) => {
    if (!item.name) {
        addToast('El platillo necesita un nombre para generar una descripción.', 'error');
        return;
    }
    setGeneratingDescId(item.id);
    try {
        const newDescription = await generateMenuDescription(item.name);
        updateMenuItem({ ...item, description: newDescription });
        addToast(`Descripción generada para ${item.name}`, 'success');
    } catch (error) {
        console.error("Failed to generate description for row", error);
        addToast('Error al generar la descripción.', 'error');
    } finally {
        setGeneratingDescId(null);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Gestión de Menú</h2>
        <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[var(--dark-red)] transition-colors font-semibold">
          <PlusIcon />
          <span className="ml-2">Añadir Platillo</span>
        </button>
      </div>
      
      <div className="space-y-8">
        {MENU_CATEGORIES.map(category => (
            itemsByCategory[category] && (
            <div key={category}>
                <h3 className="text-2xl font-semibold mb-4 text-white flex items-center gap-3">
                  <span className="text-[var(--primary-red)]"><CategoryIcon category={category} /></span>
                  <span className="border-b-2 border-[var(--accent-yellow)] pb-1">{category}</span>
                </h3>
                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs uppercase bg-white/5 text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-3/5">Platillo</th>
                                    <th scope="col" className="px-6 py-3">Precio</th>
                                    <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsByCategory[category].map(item => (
                                    <tr key={item.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 rounded-md mr-4 flex items-center justify-center bg-black/20 flex-shrink-0 overflow-hidden border border-[var(--card-border)]">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <CategoryIcon category={item.category} className="w-7 h-7 text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-base font-semibold">{item.name}</div>
                                                    {item.description ? (
                                                      <div className="font-normal text-gray-500 text-xs max-w-xs truncate hidden sm:block">{item.description}</div>
                                                    ) : (
                                                      <div className="hidden sm:block mt-1">
                                                          {generatingDescId === item.id ? (
                                                              <div className="flex items-center gap-2 text-xs text-purple-400">
                                                                  <SpinnerIcon className="w-4 h-4 animate-spin"/>
                                                                  <span>Generando...</span>
                                                              </div>
                                                          ) : (
                                                              <button 
                                                                  onClick={() => handleGenerateDescriptionForRow(item)}
                                                                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                                              >
                                                                  <SparklesIcon className="w-4 h-4" />
                                                                  <span>Generar con IA</span>
                                                              </button>
                                                          )}
                                                      </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 font-semibold text-white">{formatPrice(item.price)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditModal(item)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon /></button>
                                            <button onClick={() => deleteMenuItem(item.id)} className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )
        ))}
      </div>
      
      <MenuItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        itemToEdit={itemToEdit}
        inventoryItems={inventoryItems}
      />
    </div>
  );
};