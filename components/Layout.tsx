import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const SidebarItem = ({ icon, label, to, active }: { icon: string; label: string; to: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
      active
        ? 'bg-gold-500 text-white shadow-lg'
        : 'text-gold-900 hover:bg-gold-100'
    }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className="font-sans font-medium">{label}</span>
  </Link>
);

export const AdminLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await db.logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-luxury-light overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gold-300 flex flex-col shadow-xl z-10 hidden md:flex">
        <div className="p-8 flex flex-col items-center border-b border-gold-100">
           <div className="w-16 h-16 rounded-full border-2 border-gold-500 flex items-center justify-center bg-luxury-light mb-3">
             <span className="material-symbols-outlined text-gold-600 text-3xl">diamond</span>
           </div>
           <h1 className="font-serif font-bold text-xl text-gold-700">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1">
          <SidebarItem icon="dashboard" label="Dashboard" to="/admin" active={location.pathname === '/admin'} />
          <SidebarItem icon="calendar_month" label="Agenda" to="/admin/schedule" active={location.pathname.startsWith('/admin/schedule')} />
          <SidebarItem icon="spa" label="Serviços" to="/admin/services" active={location.pathname.startsWith('/admin/services')} />
          <SidebarItem icon="group" label="Clientes" to="/admin/clients" active={location.pathname.startsWith('/admin/clients')} />
          <SidebarItem icon="inventory_2" label="Produtos" to="/admin/products" active={location.pathname.startsWith('/admin/products')} />
          <SidebarItem icon="settings" label="Configurações" to="/admin/settings" active={location.pathname.startsWith('/admin/settings')} />
        </nav>

        <div className="p-6 border-t border-gold-100">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gold-600 transition-colors w-full"
            >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sair
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white h-16 border-b border-gold-200 flex items-center justify-between px-4 z-20">
             <span className="material-symbols-outlined text-gold-600">menu</span>
             <span className="font-serif font-bold text-gold-700">{title}</span>
             <div className="w-6"></div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gold-100/50 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-6xl mx-auto">
                <h2 className="font-serif text-3xl font-bold text-gold-900 mb-8 hidden md:block">{title}</h2>
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};