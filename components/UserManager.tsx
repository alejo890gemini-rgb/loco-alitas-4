import React, { useState } from 'react';
import type { User, Role } from '../types';
import { PlusIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface UserManagerProps {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
}

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('waiter');
    const { addToast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            addToast("El nombre de usuario y la contraseña son obligatorios.", 'error');
            return;
        }
        onSave({ username, password, role });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-[var(--card-bg)] rounded-lg shadow-xl p-8 w-full max-w-md border-t-4 border-[var(--primary-red)]">
                <h2 className="text-2xl font-bold mb-6 text-white">Nuevo Usuario</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-2 border rounded bg-gray-700 border-gray-600 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded bg-gray-700 border-gray-600 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full p-2 border rounded bg-gray-700 border-gray-600 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
                        <option value="waiter">Mesero</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-lg hover:bg-[var(--dark-red)]">Crear Usuario</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const UserManager: React.FC<UserManagerProps> = ({ users, addUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (user: Omit<User, 'id'>) => {
    addUser(user);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Gestión de Usuarios</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors">
          <PlusIcon />
          <span className="ml-2">Añadir Usuario</span>
        </button>
      </div>

      <div className="bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-gray-700 text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre de Usuario</th>
                <th scope="col" className="px-6 py-3">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="bg-[var(--card-bg)] border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                  <td className="px-6 py-4 capitalize">{user.role === 'admin' ? 'Administrador' : 'Mesero'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};