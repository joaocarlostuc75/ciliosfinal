
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { db } from './services/mockDb';

// Public Pages
import { Splash } from './pages/public/Splash';
import { ServicesList } from './pages/public/ServicesList';
import { Booking } from './pages/public/Booking';
import { ProductOrder } from './pages/public/ProductOrder';
import { MySchedule } from './pages/public/MySchedule';
import { Login } from './pages/admin/Login';

// Admin Pages
import { AdminLayout, SuperAdminLayout } from './components/Layout';
import { Dashboard } from './pages/admin/Dashboard';
import { Schedule } from './pages/admin/Schedule';
import { ServicesManager } from './pages/admin/ServicesManager';
import { Settings } from './pages/admin/Settings';
import { ProductsManager } from './pages/admin/ProductsManager';
import { ClientsManager } from './pages/admin/ClientsManager';
import { OrdersManager } from './pages/admin/OrdersManager';
import { MyPlan } from './pages/admin/MyPlan';

// Super Admin Pages
import { SuperDashboard } from './pages/superadmin/SuperDashboard';
import { SuperPlans } from './pages/superadmin/SuperPlans';
import { SuperClientDetail } from './pages/superadmin/SuperClientDetail';
import { SuperSalons } from './pages/superadmin/SuperSalons';
import { SuperSettings } from './pages/superadmin/SuperSettings';

// Mock Auth wrapper for Admin
const ProtectedRoute = () => {
  const isAuthenticated = db.isAuthenticated();
  const isSuper = db.isSuperAdmin();
  // Ensure Super Admin doesn't get stuck in Admin routes
  if (isSuper) return <Navigate to="/super-admin" replace />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const SuperAdminRoute = () => {
    const isSuper = db.isSuperAdmin();
    return isSuper ? <Outlet /> : <Navigate to="/login" replace />;
};

// Admin Wrapper to inject Layout
const AdminRouteWrapper = ({ title, component: Component }: { title: string, component: React.FC }) => (
    <AdminLayout title={title}>
        <Component />
    </AdminLayout>
);

const SuperAdminRouteWrapper = ({ title, component: Component }: { title: string, component: React.FC }) => (
    <SuperAdminLayout title={title}>
        <Component />
    </SuperAdminLayout>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/services" element={<ServicesList />} />
        <Route path="/book/:serviceId" element={<Booking />} />
        <Route path="/order/:productId" element={<ProductOrder />} />
        <Route path="/my-schedule" element={<MySchedule />} />
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
           <Route path="plan" element={<AdminRouteWrapper title="Meu Plano" component={MyPlan} />} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<SuperAdminRoute />}>
            <Route index element={<SuperAdminRouteWrapper title="Visão Geral" component={SuperDashboard} />} />
            <Route path="plans" element={<SuperAdminRouteWrapper title="Planos" component={SuperPlans} />} />
            <Route path="salons" element={<SuperAdminRouteWrapper title="Salões" component={SuperSalons} />} />
            <Route path="client/:id" element={<SuperAdminRouteWrapper title="Detalhes do Salão" component={SuperClientDetail} />} />
            <Route path="settings" element={<SuperAdminRouteWrapper title="Configurações Globais" component={SuperSettings} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
