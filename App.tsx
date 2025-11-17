import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { MenuManager } from './components/MenuManager';
import { TableManager } from './components/TableManager';
import { Reports } from './components/Reports';
import type { View, MenuItem, Table, Order, Sale, TableStatus, User, Role, PaymentMethod, OrderStatus, InventoryItem, Ingredient } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_USERS, INITIAL_INVENTORY_ITEMS } from './constants';
import { MenuIcon, XIcon, ChatBotIcon } from './components/Icons';
import { KitchenTicketModal } from './components/KitchenTicketModal';
import { UserManager } from './components/UserManager';
import { useToast } from './hooks/useToast';
import { KitchenMonitor } from './components/KitchenMonitor';
import { WhatsAppManager } from './components/WhatsAppManager';
import { Chatbot } from './components/Chatbot';
import { InventoryManager } from './components/InventoryManager';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orderForTicket, setOrderForTicket] = useState<Order | null>(null);
  const [isChatbotOpen, setChatbotOpen] = useState(false);

  // Hardcode the admin user. The entire app now runs under this user.
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const currentUser = users.find(user => user.role === 'admin');
  
  const { addToast } = useToast();

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    addToast('Usuario creado con éxito', 'success');
  };

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    };
    setMenuItems(prev => [...prev, newItem]);
  }, []);

  const updateMenuItem = useCallback((updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, []);

  const deleteMenuItem = useCallback((itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    addToast('Platillo eliminado con éxito', 'success');
  }, [addToast]);

  const addTable = useCallback((table: Omit<Table, 'id' | 'status'>) => {
    const newTable: Table = {
      ...table,
      id: `table-${Date.now()}`,
      status: 'available'
    };
    setTables(prev => [...prev, newTable]);
  }, []);

  const updateTable = useCallback((updatedTable: Table) => {
    setTables(prev => prev.map(table => table.id === updatedTable.id ? updatedTable : table));
  }, []);
  
  const deleteTable = useCallback((tableId: string) => {
    const tableToDelete = tables.find(t => t.id === tableId);
    if (tableToDelete && tableToDelete.status === 'occupied') {
        addToast("No se puede eliminar una mesa que está ocupada.", 'error');
        return;
    }
    setTables(prev => prev.filter(table => table.id !== tableId));
    addToast('Mesa eliminada con éxito', 'success');
  }, [tables, addToast]);

  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(table => table.id === tableId ? { ...table, status } : table));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
    if(status === 'ready') {
      addToast(`Orden ${orderId.slice(-6)} marcada como lista!`, 'info');
    }
  }, [addToast]);

  const createOrder = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
    if (order.orderType === 'dine-in' && order.tableId) {
      updateTableStatus(order.tableId, 'occupied');
    }
    setOrderForTicket(order);
    addToast('Orden creada con éxito', 'success');
  }, [updateTableStatus, addToast]);

  const deductStockFromRecipe = (recipe: Ingredient[], quantitySold: number) => {
      setInventoryItems(currentInventory => {
          const newInventory = [...currentInventory];
          recipe.forEach(ingredient => {
              const itemIndex = newInventory.findIndex(invItem => invItem.id === ingredient.inventoryItemId);
              if (itemIndex > -1) {
                  const totalDeduction = ingredient.quantity * quantitySold;
                  newInventory[itemIndex] = {
                      ...newInventory[itemIndex],
                      stock: newInventory[itemIndex].stock - totalDeduction,
                  };
              }
          });
          return newInventory;
      });
  };

  const completeSale = useCallback((order: Order, paymentMethod: PaymentMethod) => {
    const itemsTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Deduct from inventory
    order.items.forEach(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.id);
        if (menuItem && menuItem.recipe && menuItem.recipe.length > 0) {
            deductStockFromRecipe(menuItem.recipe, orderItem.quantity);
        }
    });

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      order,
      timestamp: new Date().toISOString(),
      total: itemsTotal,
      paymentMethod,
    };
    setSales(prev => [newSale, ...prev]);
    setOrders(prev => prev.filter(o => o.id !== order.id));
    
    if (order.orderType === 'dine-in' && order.tableId) {
      updateTableStatus(order.tableId, 'available');
    }
    addToast('Venta completada con éxito', 'success');
  }, [updateTableStatus, addToast, menuItems]);
  
  const closeTicketModal = () => {
    setOrderForTicket(null);
  };
  
  // Inventory Management Functions
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: `inv-${Date.now()}` };
    setInventoryItems(prev => [...prev, newItem]);
    addToast('Ingrediente añadido al inventario', 'success');
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    setInventoryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    addToast('Ingrediente actualizado', 'success');
  };

  const adjustInventoryItemStock = (itemId: string, newStock: number) => {
    setInventoryItems(prev => prev.map(item => item.id === itemId ? { ...item, stock: newStock } : item));
    addToast('Stock actualizado', 'info');
  };


  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard sales={sales} menuItems={menuItems} tables={tables} />;
      case 'POS':
        return <POS 
          menuItems={menuItems} 
          tables={tables} 
          createOrder={createOrder}
          completeSale={completeSale}
          orders={orders}
        />;
      case 'MENU':
        return <MenuManager 
          menuItems={menuItems}
          addMenuItem={addMenuItem}
          updateMenuItem={updateMenuItem}
          deleteMenuItem={deleteMenuItem}
          inventoryItems={inventoryItems}
        />;
      case 'TABLES':
        return <TableManager 
          tables={tables} 
          addTable={addTable} 
          updateTable={updateTable}
          deleteTable={deleteTable}
          updateTableStatus={updateTableStatus} 
        />;
      case 'REPORTS':
        return <Reports sales={sales} tables={tables} />;
       case 'USERS':
        return <UserManager users={users} addUser={addUser} />;
       case 'KITCHEN':
        return <KitchenMonitor orders={orders.filter(o => o.status === 'open')} updateOrderStatus={updateOrderStatus} tables={tables} />;
       case 'WHATSAPP':
        return <WhatsAppManager orders={orders.filter(o => (o.orderType === 'delivery' || o.orderType === 'to-go') && (o.status === 'open' || o.status === 'ready'))} />;
       case 'INVENTORY':
        return <InventoryManager 
          inventoryItems={inventoryItems}
          addInventoryItem={addInventoryItem}
          updateInventoryItem={updateInventoryItem}
          adjustStock={adjustInventoryItemStock}
        />;
      default:
        return <Dashboard sales={sales} menuItems={menuItems} tables={tables} />;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center p-8 border border-red-500 rounded-lg">
          <h1 className="text-2xl font-bold text-red-500">Error de Configuración</h1>
          <p>El usuario administrador no se encuentra en los datos iniciales.</p>
          <p>Por favor, revise el archivo `constants.ts`.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-[var(--black-bg)] text-gray-100">
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--card-bg)] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-[var(--card-border)]`}>
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            closeSidebar={() => setSidebarOpen(false)}
            user={currentUser}
          />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center p-4 bg-[var(--card-bg)] border-b border-[var(--card-border)] md:hidden">
            <h1 className="text-2xl font-bangers tracking-wider">
              <span className="text-[var(--accent-yellow)]">LOCO</span> <span className="text-[var(--primary-red)]">ALITAS</span>
            </h1>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 focus:outline-none">
              {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon />}
            </button>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
            {renderView()}
          </main>
        </div>
      </div>
      {orderForTicket && <KitchenTicketModal order={orderForTicket} onClose={closeTicketModal} tables={tables} />}
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-6 right-6 bg-[var(--primary-red)] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:bg-[var(--dark-red)] transition-transform hover:scale-110 z-40"
        aria-label="Open Chatbot"
      >
        <ChatBotIcon className="w-8 h-8"/>
      </button>
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setChatbotOpen(false)}
        menuItems={menuItems}
        tables={tables}
        sales={sales}
        inventory={inventoryItems}
      />
    </>
  );
};

export default App;