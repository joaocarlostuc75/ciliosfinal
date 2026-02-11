
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';
import { Salon } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gold-500 transition-colors"
      title="Alternar Tema"
    >
      <span className="material-symbols-outlined">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

const SidebarItem = ({ icon, label, to, active, onClick }: { icon: string; label: string; to: string; active: boolean; onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
      active
        ? 'bg-gold-500 text-white shadow-lg'
        : 'text-gold-900 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-zinc-800'
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
  const [salon, setSalon] = useState<Salon | null>(null);

  useEffect(() => {
      const loadSalon = async () => {
          const s = await db.getSalon();
          setSalon(s);
      };
      loadSalon();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await db.logout();
    navigate('/');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-luxury-light dark:bg-luxury-charcoal overflow-hidden transition-colors duration-300">
      
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
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-luxury-card border-r border-gold-300 dark:border-luxury-border flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-8 flex flex-col items-center border-b border-gold-100 dark:border-luxury-border relative">
           <div className="w-20 h-20 rounded-full border-2 border-gold-500 flex items-center justify-center bg-luxury-light dark:bg-luxury-charcoal mb-3 overflow-hidden shadow-sm">
             {salon?.logo_url ? (
                 <ImageWithFallback 
                    src={salon.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    fallbackIcon="diamond"
                 />
             ) : (
                 <span className="material-symbols-outlined text-gold-600 dark:text-gold-500 text-3xl">diamond</span>
             )}
           </div>
           <h1 className="font-serif font-bold text-lg text-gold-700 dark:text-gold-500 text-center leading-tight">
               {salon?.name || 'Admin Panel'}
           </h1>
           <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gerenciamento</p>
           
           <button 
             onClick={closeSidebar}
             className="absolute top-4 right-4 text-gray-400 hover:text-red-500 md:hidden"
           >
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto no-scrollbar">
          <SidebarItem icon="dashboard" label="Dashboard" to="/admin" active={location.pathname === '/admin'} onClick={closeSidebar} />
          <SidebarItem icon="calendar_month" label="Agenda" to="/admin/schedule" active={location.pathname.startsWith('/admin/schedule')} onClick={closeSidebar} />
          <SidebarItem icon="shopping_cart" label="Pedidos" to="/admin/orders" active={location.pathname.startsWith('/admin/orders')} onClick={closeSidebar} />
          <SidebarItem icon="spa" label="Serviços" to="/admin/services" active={location.pathname.startsWith('/admin/services')} onClick={closeSidebar} />
          <SidebarItem icon="group" label="Clientes" to="/admin/clients" active={location.pathname.startsWith('/admin/clients')} onClick={closeSidebar} />
          <SidebarItem icon="inventory_2" label="Produtos" to="/admin/products" active={location.pathname.startsWith('/admin/products')} onClick={closeSidebar} />
          <SidebarItem icon="workspace_premium" label="Meu Plano" to="/admin/plan" active={location.pathname.startsWith('/admin/plan')} onClick={closeSidebar} />
          <SidebarItem icon="settings" label="Configurações" to="/admin/settings" active={location.pathname.startsWith('/admin/settings')} onClick={closeSidebar} />
        </nav>

        <div className="p-6 border-t border-gold-100 dark:border-luxury-border mt-auto">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors w-full"
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

        {/* Header */}
        <header className="bg-white dark:bg-luxury-card h-16 border-b border-gold-200 dark:border-luxury-border flex items-center justify-between px-4 md:px-10 z-10 shrink-0 shadow-sm transition-colors">
             <div className="flex items-center gap-4">
                 <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gold-700 dark:text-gold-500 hover:bg-gold-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                 </button>
                 <span className="font-serif font-bold text-gold-700 dark:text-gold-500 hidden md:block text-xl">
                   {title}
                 </span>
                 <span className="font-serif font-bold text-gold-700 dark:text-gold-500 md:hidden">
                   {title}
                 </span>
             </div>
             
             <div className="flex items-center gap-2">
                 <ThemeToggle />
                 <div className="w-8 h-8 rounded-full bg-gold-50 dark:bg-zinc-800 flex items-center justify-center border border-gold-200 dark:border-luxury-border">
                    <span className="material-symbols-outlined text-gold-600 dark:text-gold-500 text-lg">person</span>
                 </div>
             </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative scroll-smooth">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gold-100/50 dark:from-gold-900/10 to-transparent pointer-events-none transition-colors" />
            <div className="relative z-0 max-w-6xl mx-auto">
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
    <div className="flex h-screen bg-luxury-light dark:bg-luxury-charcoal overflow-hidden transition-colors duration-300">
      
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
        {/* Header */}
        <header className="bg-white dark:bg-luxury-card h-16 border-b border-gold-200 dark:border-luxury-border flex items-center justify-between px-4 md:px-10 z-10 shrink-0 shadow-sm transition-colors">
             <div className="flex items-center gap-4">
                 <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gold-900 dark:text-gold-500 hover:bg-gold-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                 </button>
                 <span className="font-serif font-bold text-gold-900 dark:text-gold-500 hidden md:block text-xl">
                   {title}
                 </span>
                 <span className="font-serif font-bold text-gold-900 dark:text-gold-500 md:hidden">
                   {title}
                 </span>
             </div>
             
             <div className="flex items-center gap-2">
                 <ThemeToggle />
             </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative scroll-smooth bg-gray-50 dark:bg-luxury-charcoal transition-colors">
            <div className="relative z-0 max-w-6xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};
