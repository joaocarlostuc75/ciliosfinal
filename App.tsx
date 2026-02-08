import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { db } from './services/mockDb';

// Public Pages
import { Splash } from './pages/public/Splash';
import { ServicesList } from './pages/public/ServicesList';
import { Booking } from './pages/public/Booking';
import { Login } from './pages/admin/Login';

// Admin Pages
import { AdminLayout } from './components/Layout';
import { Dashboard } from './pages/admin/Dashboard';
import { Schedule } from './pages/admin/Schedule';
import { ServicesManager } from './pages/admin/ServicesManager';
import { Settings } from './pages/admin/Settings';
import { ProductsManager } from './pages/admin/ProductsManager';
import { ClientsManager } from './pages/admin/ClientsManager';
import { OrdersManager } from './pages/admin/OrdersManager';

// Mock Auth wrapper for Admin
const ProtectedRoute = () => {
  const isAuthenticated = db.isAuthenticated();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// Admin Wrapper to inject Layout
const AdminRouteWrapper = ({ title, component: Component }: { title: string, component: React.FC }) => (
    <AdminLayout title={title}>
        <Component />
    </AdminLayout>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/services" element={<ServicesList />} />
        <Route path="/book/:serviceId" element={<Booking />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
           <Route index element={<AdminRouteWrapper title="Dashboard" component={Dashboard} />} />
           <Route path="schedule" element={<AdminRouteWrapper title="Agenda" component={Schedule} />} />
           <Route path="orders" element={<AdminRouteWrapper title="Pedidos" component={OrdersManager} />} />
           <Route path="services" element={<AdminRouteWrapper title="Serviços" component={ServicesManager} />} />
           <Route path="clients" element={<AdminRouteWrapper title="Clientes" component={ClientsManager} />} />
           <Route path="products" element={<AdminRouteWrapper title="Produtos" component={ProductsManager} />} />
           <Route path="settings" element={<AdminRouteWrapper title="Configurações" component={Settings} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;