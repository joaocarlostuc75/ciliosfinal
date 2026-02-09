
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const SidebarItem = ({ icon, label, to, active, onClick }: { icon: string; label: string; to: string; active: boolean; onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
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

const BroadcastBanner = () => {
    const [msg, setMsg] = useState('');
    useEffect(() => {
        db.getGlobalSettings().then(s => setMsg(s.broadcast_message || ''));
    }, []);

    if (!msg) return null;

    return (
        <div className="bg-gradient-to-r from-gray-800 to-black text-white text-xs font-bold text-center py-2 px-4 shadow-md flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm text-gold-500">campaign</span>
            {msg}
        </div>
    );
}

// --- Regular Admin Layout ---
export const AdminLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await db.logout();
    navigate('/');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-luxury-light overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gold-300 flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 flex flex-col items-center border-b border-gold-100 relative">
           <div className="w-16 h-16 rounded-full border-2 border-gold-500 flex items-center justify-center bg-luxury-light mb-3">
             <span className="material-symbols-outlined text-gold-600 text-3xl">diamond</span>
           </div>
           <h1 className="font-serif font-bold text-xl text-gold-700">Admin Panel</h1>
           
           <button 
             onClick={closeSidebar}
             className="absolute top-4 right-4 text-gray-400 hover:text-red-500 md:hidden"
           >
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          <SidebarItem icon="dashboard" label="Dashboard" to="/admin" active={location.pathname === '/admin'} onClick={closeSidebar} />
          <SidebarItem icon="calendar_month" label="Agenda" to="/admin/schedule" active={location.pathname.startsWith('/admin/schedule')} onClick={closeSidebar} />
          <SidebarItem icon="shopping_cart" label="Pedidos" to="/admin/orders" active={location.pathname.startsWith('/admin/orders')} onClick={closeSidebar} />
          <SidebarItem icon="spa" label="Serviços" to="/admin/services" active={location.pathname.startsWith('/admin/services')} onClick={closeSidebar} />
          <SidebarItem icon="group" label="Clientes" to="/admin/clients" active={location.pathname.startsWith('/admin/clients')} onClick={closeSidebar} />
          <SidebarItem icon="inventory_2" label="Produtos" to="/admin/products" active={location.pathname.startsWith('/admin/products')} onClick={closeSidebar} />
          <SidebarItem icon="workspace_premium" label="Meu Plano" to="/admin/plan" active={location.pathname.startsWith('/admin/plan')} onClick={closeSidebar} />
          <SidebarItem icon="settings" label="Configurações" to="/admin/settings" active={location.pathname.startsWith('/admin/settings')} onClick={closeSidebar} />
        </nav>

        <div className="p-6 border-t border-gold-100 mt-auto">
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
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Broadcast Banner */}
        <BroadcastBanner />

        {/* Mobile Header */}
        <header className="md:hidden bg-white h-16 border-b border-gold-200 flex items-center justify-between px-4 z-10 shrink-0">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gold-700 hover:bg-gold-50 rounded-lg transition-colors">
                <span className="material-symbols-outlined">menu</span>
             </button>
             <span className="font-serif font-bold text-gold-700">{title}</span>
             <div className="w-8"></div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative scroll-smooth">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gold-100/50 to-transparent pointer-events-none" />
            <div className="relative z-0 max-w-6xl mx-auto">
                <h2 className="font-serif text-3xl font-bold text-gold-900 mb-8 hidden md:block">{title}</h2>
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

// --- Super Admin Layout ---
export const SuperAdminLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await db.logout();
    navigate('/');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-luxury-light overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-zinc-900 text-white border-r border-gold-700/30 flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 flex flex-col items-center border-b border-white/10 relative">
           <div className="w-16 h-16 rounded-full border-2 border-gold-500 flex items-center justify-center bg-zinc-800 mb-3">
             <span className="material-symbols-outlined text-gold-500 text-3xl">admin_panel_settings</span>
           </div>
           <h1 className="font-serif font-bold text-xl text-gold-500">Super Admin</h1>
           
           <button 
             onClick={closeSidebar}
             className="absolute top-4 right-4 text-gray-400 hover:text-red-500 md:hidden"
           >
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          <SidebarItem 
             icon="monitoring" label="Visão Geral" to="/super-admin" 
             active={location.pathname === '/super-admin'} onClick={closeSidebar} 
          />
          <SidebarItem 
             icon="storefront" label="Salões" to="/super-admin/salons" 
             active={location.pathname.startsWith('/super-admin/salons') || location.pathname.startsWith('/super-admin/client')} onClick={closeSidebar} 
          />
          <SidebarItem 
             icon="subscriptions" label="Planos" to="/super-admin/plans" 
             active={location.pathname.startsWith('/super-admin/plans')} onClick={closeSidebar} 
          />
          <SidebarItem 
             icon="settings_applications" label="Config. Globais" to="/super-admin/settings" 
             active={location.pathname.startsWith('/super-admin/settings')} onClick={closeSidebar} 
          />
        </nav>

        <div className="p-6 border-t border-white/10 mt-auto">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold-500 transition-colors w-full"
            >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sair
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden bg-white h-16 border-b border-gold-200 flex items-center justify-between px-4 z-10 shrink-0">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gold-900 hover:bg-gold-50 rounded-lg transition-colors">
                <span className="material-symbols-outlined">menu</span>
             </button>
             <span className="font-serif font-bold text-gold-900">{title}</span>
             <div className="w-8"></div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative scroll-smooth bg-gray-50">
            <div className="relative z-0 max-w-6xl mx-auto">
                <h2 className="font-serif text-3xl font-bold text-gold-900 mb-8 hidden md:block">{title}</h2>
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};
