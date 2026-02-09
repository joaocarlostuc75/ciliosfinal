
import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule, Order, OrderStatus, SubscriptionStatus, SubscriptionPlan, GlobalSettings } from '../types';
import { supabase } from './supabaseClient';

// Constants
const MOCK_SALON_ID = 'e2c0a884-6d9e-4861-a9d5-17154238805f';
const SUPER_ADMIN_EMAIL = 'joaocarlostuc75@gmail.com';

const defaultSchedule: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, slots: [] },
  { dayOfWeek: 1, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 2, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 3, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 4, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 5, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 6, isOpen: true, slots: [{ start: '09:00', end: '14:00' }] },
];

const getStorage = <T>(key: string, initial: T | null): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn(`Failed to parse storage for key ${key}`, e);
    localStorage.removeItem(key);
  }
  if (initial !== null) {
      localStorage.setItem(key, JSON.stringify(initial));
  }
  return initial;
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

class ApiService {
  private supabase = supabase;
  private currentSalonId: string | null = null;

  constructor() {
      // Initialize Global Settings if not exists
      if (!getStorage('global_settings', null)) {
          setStorage('global_settings', {
              id: 'global',
              default_logo_url: '',
              updated_at: new Date().toISOString()
          });
      }
      
      // Attempt to restore session salon
      const storedId = localStorage.getItem('active_salon_id');
      if (storedId) this.currentSalonId = storedId;
      else this.currentSalonId = MOCK_SALON_ID; // Default to Demo
  }

  // --- Auth & Security ---
  
  async login(email: string, pass: string): Promise<{ success: boolean; message?: string; role?: 'ADMIN' | 'SUPER_ADMIN' }> {
    // Super Admin Credentials
    if (email === SUPER_ADMIN_EMAIL && pass === 'admin123') {
        localStorage.setItem('auth_role', 'SUPER_ADMIN');
        return { success: true, role: 'SUPER_ADMIN' };
    }

    // Normal Admin Login (Mock Logic for multi-tenant simulation)
    const salons = await this.getAllSalons();
    const userSalon = salons.find(s => s.owner_email === email);

    if (userSalon) {
         // Simple password check (In real app, hash check)
         // For mock purposes, any password works if email matches, or specific mock pass
         localStorage.setItem('auth_role', 'ADMIN');
         this.setCurrentSalon(userSalon.id);
         
         if (!this.checkSubscriptionValidity(userSalon)) {
             if (userSalon.subscription_status === SubscriptionStatus.BLOCKED) {
                 return { success: false, message: 'Conta bloqueada. Contate o suporte.' };
             }
             if (userSalon.subscription_status === SubscriptionStatus.EXPIRED) {
                 return { success: true, role: 'ADMIN', message: 'Assinatura expirada. Renove para liberar agendamentos.' };
             }
         }
         return { success: true, role: 'ADMIN' };
    }

    // Supabase Fallback
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
      if (error) return { success: false, message: error.message };
      localStorage.setItem('auth_role', 'ADMIN');
      return { success: true, role: 'ADMIN' };
    }

    return { success: false, message: 'Credenciais inválidas.' };
  }

  async signUp(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    // Check if email exists
    const salons = await this.getAllSalons();
    if (salons.some(s => s.owner_email === email)) {
        return { success: false, message: 'Email já cadastrado.' };
    }

    // Create New Salon (Empty State)
    const newSalonId = crypto.randomUUID();
    const newSalon: Salon = {
        id: newSalonId,
        name: 'Novo Estabelecimento',
        slug: `novo-${newSalonId.slice(0, 8)}`,
        logo_url: '', // Empty to force default logo usage
        phone: '',
        address: '',
        opening_hours: defaultSchedule,
        subscription_status: SubscriptionStatus.TRIAL,
        subscription_plan: 'FREE',
        created_at: new Date().toISOString(),
        owner_email: email,
        is_lifetime_free: false
    };

    // Save to "DB"
    setStorage('salons_list', [...salons, newSalon]);
    
    // Auto Login
    this.setCurrentSalon(newSalonId);
    localStorage.setItem('auth_role', 'ADMIN');

    return { success: true, message: 'Conta criada! Configure seu estabelecimento.' };
  }

  async changeEmail(newEmail: string): Promise<void> {
      const salon = await this.getSalon();
      if (salon) {
        salon.owner_email = newEmail;
        await this.updateSalon(salon);
      }
  }

  async changePassword(newPass: string): Promise<void> {
      // In mock DB, we don't really store passwords, so we just acknowledge
      // In a real app, this would update the auth provider
      console.log("Password updated to", newPass);
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: 'Email de recuperação enviado (Simulado).' };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_role');
    localStorage.removeItem('active_salon_id');
    this.currentSalonId = null; // Reset to null or default
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_role');
  }

  isSuperAdmin(): boolean {
      return localStorage.getItem('auth_role') === 'SUPER_ADMIN';
  }

  setCurrentSalon(id: string) {
      this.currentSalonId = id;
      localStorage.setItem('active_salon_id', id);
  }

  // --- Global Settings (Super Admin) ---
  
  async getGlobalSettings(): Promise<GlobalSettings> {
      return getStorage<GlobalSettings>('global_settings', {
          id: 'global',
          default_logo_url: '',
          updated_at: new Date().toISOString()
      })!;
  }

  async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
      setStorage('global_settings', settings);
  }

  // --- Subscription Logic ---

  checkSubscriptionValidity(salon: Salon | null): boolean {
      if (!salon) return false;
      
      // Admin overrides
      if (salon.is_lifetime_free) return true;
      if (salon.subscription_status === SubscriptionStatus.BLOCKED) return false;
      if (salon.subscription_status === SubscriptionStatus.CANCELLED) return false;

      // Check Expiration Date
      if (salon.subscription_end_date) {
          const endDate = new Date(salon.subscription_end_date);
          const now = new Date();
          if (endDate < now) {
              // Auto-expire if date passed
              if (salon.subscription_status !== SubscriptionStatus.EXPIRED) {
                  salon.subscription_status = SubscriptionStatus.EXPIRED;
                  this.updateSalon(salon); // Persist change
              }
              return false;
          }
      }

      // Check Trial (10 days)
      if (salon.subscription_status === SubscriptionStatus.TRIAL) {
          const now = new Date();
          const created = new Date(salon.created_at);
          const diffTime = now.getTime() - created.getTime();
          const daysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (daysUsed > 10) {
              salon.subscription_status = SubscriptionStatus.EXPIRED;
              this.updateSalon(salon);
              return false;
          }
          return true;
      }

      return salon.subscription_status === SubscriptionStatus.ACTIVE;
  }

  // --- Super Admin Capabilities ---

  async getAllSalons(): Promise<Salon[]> {
      // In this Mock, we store all salons in a 'salons_list' array AND the default MOCK_SALON separately to avoid breaking legacy code
      // We merge them here
      const list = getStorage<Salon[]>('salons_list', []);
      const defaultSalon = getStorage<Salon | null>('salon', null);
      
      // Ensure default salon is in the list for Super Admin view
      if (defaultSalon && !list.find(s => s.id === defaultSalon.id)) {
          list.push(defaultSalon);
      }
      return list;
  }

  async adminUpdateSalon(salon: Salon): Promise<void> {
      // Update in the list
      const list = await this.getAllSalons();
      const newList = list.map(s => s.id === salon.id ? salon : s);
      setStorage('salons_list', newList);

      // If it's the default salon, update that storage too
      const defaultSalon = getStorage<Salon | null>('salon', null);
      if (defaultSalon && defaultSalon.id === salon.id) {
          setStorage('salon', salon);
      }
  }

  // --- Storage ---
  async uploadImage(file: File): Promise<string> {
    // Simulating upload
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
  }

  // --- Salon Data Access ---
  
  async getSalon(): Promise<Salon | null> {
      const all = await this.getAllSalons();
      // If we have a specific context ID, return that salon
      if (this.currentSalonId) {
          const found = all.find(s => s.id === this.currentSalonId);
          if (found) return found;
      }
      // Fallback: Return the default/first one
      return getStorage<Salon | null>('salon', null);
  }

  async updateSalon(salon: Salon): Promise<Salon> {
      await this.adminUpdateSalon(salon);
      return salon;
  }

  // --- Services (Filtered by Salon ID) ---
  
  async getServices(): Promise<Service[]> {
    const all = getStorage<Service[]>('services', []);
    if (!this.currentSalonId) return [];
    return all.filter(s => s.salon_id === this.currentSalonId);
  }

  async addService(service: Service): Promise<Service> {
    const all = getStorage<Service[]>('services', []);
    // Ensure salon_id is set to current context
    service.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('services', [...all, service]);
    return service;
  }

  async updateService(updated: Service): Promise<Service> {
    const all = getStorage<Service[]>('services', []);
    const newAll = all.map(s => s.id === updated.id ? updated : s);
    setStorage('services', newAll);
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    const all = getStorage<Service[]>('services', []);
    setStorage('services', all.filter(s => s.id !== id));
  }

  // --- Clients (Filtered) ---
  
  async getClients(): Promise<Client[]> {
    const all = getStorage<Client[]>('clients', []);
    if (!this.currentSalonId) return [];
    return all.filter(c => c.salon_id === this.currentSalonId);
  }

  async createClient(client: Client): Promise<Client> {
    const all = getStorage<Client[]>('clients', []);
    
    // Check duplication within this salon
    const existing = all.find(c => c.salon_id === client.salon_id && c.whatsapp === client.whatsapp);
    if (existing) return existing;

    setStorage('clients', [...all, client]);
    return client;
  }

  async updateClient(updated: Client): Promise<Client> {
    const all = getStorage<Client[]>('clients', []);
    setStorage('clients', all.map(c => c.id === updated.id ? updated : c));
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    const all = getStorage<Client[]>('clients', []);
    setStorage('clients', all.filter(c => c.id !== id));
  }

  async getClientHistory(clientId: string): Promise<Appointment[]> {
    const allAppts = await this.getAppointments();
    return allAppts.filter(a => a.client_id === clientId);
  }

  async getClientAppointmentsByPhone(phone: string): Promise<Appointment[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const clients = await this.getClients();
    const client = clients.find(c => c.whatsapp.replace(/\D/g, '') === cleanPhone);
    if (!client) return [];
    return this.getClientHistory(client.id);
  }

  async getClientOrders(phone: string): Promise<Order[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const orders = await this.getOrders();
    return orders.filter(o => o.client_phone.replace(/\D/g, '') === cleanPhone);
  }

  // --- Appointments (Filtered) ---
  
  async getAppointments(): Promise<Appointment[]> {
    const all = getStorage<Appointment[]>('appointments', []);
    if (!this.currentSalonId) return [];
    return all.filter(a => a.salon_id === this.currentSalonId);
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    const all = getStorage<BlockedTime[]>('blocked_times', []);
    if (!this.currentSalonId) return [];
    return all.filter(b => b.salon_id === this.currentSalonId);
  }

  async getBusyTimes(salonId: string, startDate: string): Promise<{start: string, end: string}[]> {
     // Get ALL appointments/blocks for the specific salon ID provided
     const allAppts = getStorage<Appointment[]>('appointments', []);
     const allBlocks = getStorage<BlockedTime[]>('blocked_times', []);

     const salonAppts = allAppts.filter(a => a.salon_id === salonId && a.status !== AppointmentStatus.CANCELLED);
     const salonBlocks = allBlocks.filter(b => b.salon_id === salonId);

     const all = [
         ...salonAppts.map(a => ({ start: a.start_time, end: a.end_time })),
         ...salonBlocks.map(b => ({ start: b.start_time, end: b.end_time }))
     ];
     return all.filter(a => new Date(a.start) >= new Date(startDate));
  }

  async addBlockedTime(block: BlockedTime): Promise<void> {
    const all = getStorage<BlockedTime[]>('blocked_times', []);
    block.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('blocked_times', [...all, block]);
  }

  async deleteBlockedTime(id: string): Promise<void> {
    const all = getStorage<BlockedTime[]>('blocked_times', []);
    setStorage('blocked_times', all.filter(b => b.id !== id));
  }

  async createAppointment(appt: Appointment): Promise<Appointment> {
    // Re-check busy times
    const busy = await this.getBusyTimes(appt.salon_id, appt.start_time.split('T')[0]);
    const newStart = new Date(appt.start_time).getTime();
    const newEnd = new Date(appt.end_time).getTime();

    const hasConflict = busy.some(t => {
        const exStart = new Date(t.start).getTime();
        const exEnd = new Date(t.end).getTime();
        return (newStart < exEnd && newEnd > exStart);
    });

    if (hasConflict) {
      throw new Error('Horário indisponível.');
    }

    const all = getStorage<Appointment[]>('appointments', []);
    setStorage('appointments', [...all, appt]);
    return appt;
  }

  async updateAppointment(updated: Appointment): Promise<void> {
    const all = getStorage<Appointment[]>('appointments', []);
    setStorage('appointments', all.map(a => a.id === updated.id ? updated : a));
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    const all = getStorage<Appointment[]>('appointments', []);
    setStorage('appointments', all.map(a => a.id === id ? { ...a, status } : a));
  }

  async deleteAppointment(id: string): Promise<void> {
    const all = getStorage<Appointment[]>('appointments', []);
    setStorage('appointments', all.filter(a => a.id !== id));
  }

  // --- Products (Filtered) ---
  
  async getProducts(): Promise<Product[]> {
    const all = getStorage<Product[]>('products', []);
    if (!this.currentSalonId) return [];
    return all.filter(p => p.salon_id === this.currentSalonId);
  }

  async addProduct(product: Product): Promise<void> {
    const all = getStorage<Product[]>('products', []);
    product.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('products', [...all, product]);
  }

  async updateProduct(updated: Product): Promise<Product> {
    const all = getStorage<Product[]>('products', []);
    setStorage('products', all.map(p => p.id === updated.id ? updated : p));
    return updated;
  }
  
  async deleteProduct(id: string): Promise<void> {
    const all = getStorage<Product[]>('products', []);
    setStorage('products', all.filter(p => p.id !== id));
  }

  // --- Orders (Filtered) ---
  
  async getOrders(): Promise<Order[]> {
    const all = getStorage<Order[]>('product_orders', []);
    if (!this.currentSalonId) return [];
    return all.filter(o => o.salon_id === this.currentSalonId);
  }

  async createOrder(order: Order): Promise<void> {
    const all = getStorage<Order[]>('product_orders', []);
    setStorage('product_orders', [...all, order]);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const all = getStorage<Order[]>('product_orders', []);
    setStorage('product_orders', all.map(o => o.id === id ? { ...o, status } : o));
  }

  async deleteOrder(id: string): Promise<void> {
    const all = getStorage<Order[]>('product_orders', []);
    setStorage('product_orders', all.filter(o => o.id !== id));
  }
}

export const db = new ApiService();
