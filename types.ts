export type View = 'DASHBOARD' | 'POS' | 'MENU' | 'TABLES' | 'REPORTS' | 'KITCHEN' | 'WHATSAPP' | 'INVENTORY';

// This is now a string to accommodate descriptive categories
export type MenuItemCategory = string;

export interface Sauce {
  name: string;
  key: string;
}

// Inventory & Recipe Types
export type InventoryUnit = 'kg' | 'g' | 'L' | 'ml' | 'unidad';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: InventoryUnit;
  cost: number; // Cost per unit
  alertThreshold: number;
}

export interface Ingredient {
  inventoryItemId: string; // links to InventoryItem id
  quantity: number;
}


export interface MenuItem {
  id: string; // Changed from number
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  hasWings?: boolean;
  hasFries?: boolean;
  submenuKey?: string;
  maxChoices?: number; // For limiting gelato flavor selections
  imageUrl?: string; // For AI-generated images
  recipe?: Ingredient[]; // For inventory tracking
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  x?: number;
  y?: number;
}

export interface OrderItem extends MenuItem {
  instanceId: string; // Unique ID for this specific item in the order
  quantity: number;
  selectedWingSauces: Sauce[];
  selectedFrySauces: Sauce[];
  selectedChoice: string | null;
  selectedGelatoFlavors: string[];
  notes?: string; // For special requests like 'no onions'
}

export type OrderType = 'dine-in' | 'delivery' | 'to-go';

export interface DeliveryInfo {
    name: string;
    phone: string;
    address: string;
}

export type OrderStatus = 'open' | 'completed' | 'cancelled' | 'ready';

export interface Order {
  id: string;
  orderType: OrderType;
  tableId?: string; // Optional for delivery/to-go orders
  deliveryInfo?: DeliveryInfo; // Optional for dine-in/to-go orders
  toGoName?: string; // Optional for dine-in/delivery orders
  toGoPhone?: string; // Optional phone for to-go orders
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';

export interface Sale {
  id: string;
  order: Order;
  total: number;
  timestamp: string;
  paymentMethod: PaymentMethod;
}

// Fix: Added missing User and Role types for UserManager component.
// User Management Types
export type Role = 'admin' | 'waiter';

export interface User {
  id: string;
  username: string;
  password?: string; // Password may not always be present in user objects passed around
  role: Role;
}

// Toast Notification Types
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}