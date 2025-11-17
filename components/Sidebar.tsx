import React from 'react';
import type { View, User } from '../types';
import { DashboardIcon, POSIcon, MenuBookIcon, TableIcon, ReportsIcon, UsersIcon, LogoutIcon, ClipboardCheckIcon, WhatsAppIcon, InventoryIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  closeSidebar: () => void;
  user: User;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`relative flex items-center p-3 my-1 rounded-lg transition-colors duration-200 group ${
        isActive
          ? 'bg-red-900/40 text-white font-semibold'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-[var(--primary-red)] rounded-r-full"></span>
      )}
      {icon}
      <span className="ml-4">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, closeSidebar, user }) => {
  const handleNavClick = (view: View) => {
    setCurrentView(view);
    closeSidebar();
  };
  
  const isAdmin = user.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)] text-white">
      <div className="flex items-center justify-center h-20 border-b border-[var(--card-border)]">
        <h1 className="text-4xl font-bangers tracking-wider">
          <span className="text-[var(--accent-yellow)]">LOCO</span> <span className="text-[var(--primary-red)]">ALITAS</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul>
          {isAdmin && (
            <NavItem
              icon={<DashboardIcon />}
              label="Dashboard"
              isActive={currentView === 'DASHBOARD'}
              onClick={() => handleNavClick('DASHBOARD')}
            />
          )}
          <NavItem
            icon={<POSIcon />}
            label="POS"
            isActive={currentView === 'POS'}
            onClick={() => handleNavClick('POS')}
          />
           <NavItem
            icon={<TableIcon />}
            label="Mesas"
            isActive={currentView === 'TABLES'}
            onClick={() => handleNavClick('TABLES')}
          />
          {isAdmin && (
            <>
              <NavItem
                icon={<MenuBookIcon />}
                label="Menú"
                isActive={currentView === 'MENU'}
                onClick={() => handleNavClick('MENU')}
              />
               <NavItem
                icon={<InventoryIcon />}
                label="Inventario"
                isActive={currentView === 'INVENTORY'}
                onClick={() => handleNavClick('INVENTORY')}
              />
               <NavItem
                icon={<ClipboardCheckIcon />}
                label="Monitor Cocina"
                isActive={currentView === 'KITCHEN'}
                onClick={() => handleNavClick('KITCHEN')}
              />
              <NavItem
                icon={<ReportsIcon />}
                label="Reportes"
                isActive={currentView === 'REPORTS'}
                onClick={() => handleNavClick('REPORTS')}
              />
              <NavItem
                icon={<UsersIcon />}
                label="Usuarios"
                isActive={currentView === 'USERS'}
                onClick={() => handleNavClick('USERS')}
              />
              <NavItem
                icon={<WhatsAppIcon />}
                label="WhatsApp"
                isActive={currentView === 'WHATSAPP'}
                onClick={() => handleNavClick('WHATSAPP')}
              />
            </>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-[var(--card-border)]">
        <div className="p-3 rounded-lg bg-black/20 mb-4">
            <p className="text-sm text-white font-semibold">{user.username}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role === 'admin' ? 'Administrador' : 'Mesero'}</p>
        </div>
      </div>
    </div>
  );
};