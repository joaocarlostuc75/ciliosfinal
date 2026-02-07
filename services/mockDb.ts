import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule } from '../types';

// Initial Mock Data
const MOCK_SALON_ID = 'salon-123';

const defaultSchedule: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, slots: [] }, // Dom
  { dayOfWeek: 1, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] }, // Seg
  { dayOfWeek: 2, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] }, // Ter
  { dayOfWeek: 3, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] }, // Qua
  { dayOfWeek: 4, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] }, // Qui
  { dayOfWeek: 5, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] }, // Sex
  { dayOfWeek: 6, isOpen: true, slots: [{ start: '09:00', end: '14:00' }] }, // Sab
];

const initialSalon: Salon = {
  id: MOCK_SALON_ID,
  name: 'Cílios de Luxo',
  slug: 'cilios-de-luxo',
  logo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ',
  phone: '11999999999',
  address: 'Rua F nº 143, Santa Mônica',
  opening_hours: defaultSchedule
};

const initialServices: Service[] = [
  {
    id: '1',
    salon_id: MOCK_SALON_ID,
    name: 'Volume Brasileiro',
    description: 'Técnica queridinha do momento. Fios em Y para volume e leveza.',
    price: 130.00,
    duration_min: 105,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
  },
  {
    id: '2',
    salon_id: MOCK_SALON_ID,
    name: 'Volume Russo',
    description: 'Olhar dramático e sofisticado com máxima densidade.',
    price: 150.00,
    duration_min: 120,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ' // Reusing placeholder for demo
  },
  {
    id: '3',
    salon_id: MOCK_SALON_ID,
    name: 'Cílios Fio a Fio',
    description: 'Clássico para quem busca naturalidade e definição.',
    price: 110.00,
    duration_min: 90,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
  }
];

// Helper for local storage
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// API Services Class
class ApiService {
  // Auth Methods
  login(username: string, pass: string): boolean {
    // Hardcoded credentials as requested
    if (username === 'admin' && pass === 'admin123') {
      localStorage.setItem('admin_auth', 'true');
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('admin_auth');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('admin_auth') === 'true';
  }

  getSalon() {
    return getStorage<Salon>('salon', initialSalon);
  }

  updateSalon(salon: Salon) {
    setStorage('salon', salon);
    return salon;
  }

  getServices() {
    return getStorage<Service[]>('services', initialServices);
  }

  addService(service: Service) {
    const services = this.getServices();
    const newServices = [...services, service];
    setStorage('services', newServices);
    return service;
  }

  updateService(updated: Service) {
    const services = this.getServices();
    const newServices = services.map(s => s.id === updated.id ? updated : s);
    setStorage('services', newServices);
    return updated;
  }

  deleteService(id: string) {
    const services = this.getServices();
    const newServices = services.filter(s => s.id !== id);
    setStorage('services', newServices);
  }

  // --- Clients CRUD ---
  getClients() {
    return getStorage<Client[]>('clients', []);
  }

  createClient(client: Client) {
    const clients = this.getClients();
    const existing = clients.find(c => c.whatsapp === client.whatsapp);
    if (existing) return existing;
    
    const newClients = [...clients, client];
    setStorage('clients', newClients);
    return client;
  }

  updateClient(updated: Client) {
    const clients = this.getClients();
    const newClients = clients.map(c => c.id === updated.id ? updated : c);
    setStorage('clients', newClients);
    return updated;
  }

  deleteClient(id: string) {
    const clients = this.getClients();
    // Also optional: delete or archive appointments for this client
    setStorage('clients', clients.filter(c => c.id !== id));
  }

  getClientHistory(clientId: string) {
    const appointments = this.getAppointments();
    return appointments.filter(a => a.client_id === clientId);
  }

  // --- Appointments & Blocking ---
  getAppointments() {
    return getStorage<Appointment[]>('appointments', []);
  }

  getBlockedTimes() {
    return getStorage<BlockedTime[]>('blocked_times', []);
  }

  addBlockedTime(block: BlockedTime) {
    const blocks = this.getBlockedTimes();
    setStorage('blocked_times', [...blocks, block]);
  }

  deleteBlockedTime(id: string) {
    const blocks = this.getBlockedTimes();
    setStorage('blocked_times', blocks.filter(b => b.id !== id));
  }

  createAppointment(appt: Appointment) {
    const appointments = this.getAppointments();
    const blockedTimes = this.getBlockedTimes();
    
    const newStart = new Date(appt.start_time).getTime();
    const newEnd = new Date(appt.end_time).getTime();

    // Check Overbooking with other Appointments
    const hasApptConflict = appointments.some(existing => {
        if(existing.status === AppointmentStatus.CANCELLED) return false;
        if(existing.id === appt.id) return false; // Skip self if updating

        const exStart = new Date(existing.start_time).getTime();
        const exEnd = new Date(existing.end_time).getTime();
        return (newStart < exEnd && newEnd > exStart);
    });

    // Check Conflict with Blocked Times
    const hasBlockConflict = blockedTimes.some(block => {
        const blStart = new Date(block.start_time).getTime();
        const blEnd = new Date(block.end_time).getTime();
        return (newStart < blEnd && newEnd > blStart);
    });

    if (hasApptConflict || hasBlockConflict) {
      throw new Error('Horário indisponível devido a conflito de agenda ou bloqueio.');
    }

    const newAppointments = [...appointments, appt];
    setStorage('appointments', newAppointments);
    return appt;
  }

  updateAppointment(updated: Appointment) {
     // Reuse logic: first remove old, then check conflict, then add
     const appointments = this.getAppointments().filter(a => a.id !== updated.id);
     const blockedTimes = this.getBlockedTimes();

     const newStart = new Date(updated.start_time).getTime();
     const newEnd = new Date(updated.end_time).getTime();

     const hasApptConflict = appointments.some(existing => {
        if(existing.status === AppointmentStatus.CANCELLED) return false;
        const exStart = new Date(existing.start_time).getTime();
        const exEnd = new Date(existing.end_time).getTime();
        return (newStart < exEnd && newEnd > exStart);
    });

    const hasBlockConflict = blockedTimes.some(block => {
        const blStart = new Date(block.start_time).getTime();
        const blEnd = new Date(block.end_time).getTime();
        return (newStart < blEnd && newEnd > blStart);
    });

    if (hasApptConflict || hasBlockConflict) {
      throw new Error('Horário conflitante ao remarcar.');
    }

    setStorage('appointments', [...appointments, updated]);
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const appointments = this.getAppointments();
    const newAppointments = appointments.map(a => a.id === id ? { ...a, status } : a);
    setStorage('appointments', newAppointments);
  }

  deleteAppointment(id: string) {
    const appointments = this.getAppointments();
    setStorage('appointments', appointments.filter(a => a.id !== id));
  }

  // --- Products ---
  getProducts() {
    return getStorage<Product[]>('products', []);
  }

  addProduct(product: Product) {
    const products = this.getProducts();
    setStorage('products', [...products, product]);
  }

  updateProduct(updated: Product) {
    const products = this.getProducts();
    const newProducts = products.map(p => p.id === updated.id ? updated : p);
    setStorage('products', newProducts);
    return updated;
  }
  
  deleteProduct(id: string) {
    const products = this.getProducts();
    setStorage('products', products.filter(p => p.id !== id));
  }
}

export const db = new ApiService();