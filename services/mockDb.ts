
import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule, Order, OrderStatus, SubscriptionStatus } from '../types';
import { supabase } from './supabaseClient';
import { differenceInDays } from 'date-fns';

// Initial Mock Data
// EMPTY FOR FRESH INSTALL
const MOCK_SALON_ID = 'e2c0a884-6d9e-4861-a9d5-17154238805f';

const defaultSchedule: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, slots: [] },
  { dayOfWeek: 1, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 2, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 3, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 4, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 5, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 6, isOpen: true, slots: [{ start: '09:00', end: '14:00' }] },
];

// Template for NEW accounts (SignUp)
const templateSalon: Salon = {
  id: MOCK_SALON_ID,
  name: 'Novo Estabelecimento',
  slug: 'novo-estabelecimento',
  logo_url: 'https://via.placeholder.com/150?text=Logo',
  phone: '',
  address: '',
  opening_hours: defaultSchedule,
  subscription_status: SubscriptionStatus.TRIAL,
  created_at: new Date().toISOString(),
  owner_email: ''
};

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

  // --- Auth & Security ---
  
  async login(email: string, pass: string): Promise<{ success: boolean; message?: string; role?: 'ADMIN' | 'SUPER_ADMIN' }> {
    // Super Admin Credentials
    if (email === 'jc@sistemas.com' && pass === 'admin123') {
        localStorage.setItem('auth_role', 'SUPER_ADMIN');
        return { success: true, role: 'SUPER_ADMIN' };
    }

    // Normal Admin Login
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
      if (error) {
        return { success: false, message: error.message };
      }
      localStorage.setItem('auth_role', 'ADMIN');
      
      const salon = await this.getSalon();
      if (salon && !this.checkSubscriptionValidity(salon)) {
          if (salon.subscription_status !== SubscriptionStatus.ACTIVE) {
               return { success: false, message: 'Período de teste expirado. Regularize sua assinatura.' };
          }
      }
      return { success: true, role: 'ADMIN' };
    }
    
    // Mock Logic
    const salon = await this.getSalon();
    // Allow login if salon exists and email matches (simple mock check) or if just created
    if (salon && salon.owner_email === email) {
         localStorage.setItem('auth_role', 'ADMIN');
         return { success: true, role: 'ADMIN' };
    } else if (!salon) {
        return { success: false, message: 'Nenhum estabelecimento cadastrado. Crie uma conta.' };
    }

    return { success: false, message: 'Credenciais inválidas.' };
  }

  async signUp(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    // Logic for new account - starts with 10 days trial
    if (this.supabase) {
      const { data, error } = await (this.supabase.auth as any).signUp({ email, password: pass });
      if (error) return { success: false, message: error.message };
      if (data?.session) {
          localStorage.setItem('auth_role', 'ADMIN');
          return { success: true, message: 'Conta criada e logada com sucesso!' };
      }
    }
    
    // Mock fallback: Create the FIRST salon in local storage
    const newSalon = {
        ...templateSalon,
        id: crypto.randomUUID(), // New ID
        owner_email: email,
        created_at: new Date().toISOString(),
        subscription_status: SubscriptionStatus.TRIAL
    };
    
    // Overwrite existing mock data to simulate fresh tenant
    setStorage('salon', newSalon);
    localStorage.setItem('auth_role', 'ADMIN');
    
    return { success: true, message: 'Conta criada! Período de teste de 10 dias iniciado.' };
  }

  async changeEmail(newEmail: string): Promise<void> {
      const salon = await this.getSalon();
      if (salon) {
        salon.owner_email = newEmail;
        await this.updateSalon(salon);
      }
  }

  async changePassword(newPass: string): Promise<void> {
      if (this.supabase) {
          const { error } = await (this.supabase.auth as any).updateUser({ password: newPass });
          if (error) throw error;
      }
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Email de recuperação enviado.' };
    }
    return { success: true, message: 'Email de recuperação enviado (Simulado).' };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_role');
    if (this.supabase) {
      await (this.supabase.auth as any).signOut();
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_role');
  }

  isSuperAdmin(): boolean {
      return localStorage.getItem('auth_role') === 'SUPER_ADMIN';
  }

  // --- Subscription Logic ---

  checkSubscriptionValidity(salon: Salon | null): boolean {
      if (!salon) return false;
      if (salon.subscription_status === SubscriptionStatus.ACTIVE) return true;
      if (salon.subscription_status === SubscriptionStatus.BLOCKED) return false;
      if (salon.subscription_status === SubscriptionStatus.EXPIRED) return false;

      // Check Trial
      if (salon.subscription_status === SubscriptionStatus.TRIAL) {
          const daysUsed = differenceInDays(new Date(), new Date(salon.created_at));
          if (daysUsed > 10) {
              salon.subscription_status = SubscriptionStatus.EXPIRED;
              this.updateSalon(salon);
              return false;
          }
          return true;
      }
      return false;
  }

  // --- Super Admin Capabilities ---

  async getAllSalons(): Promise<Salon[]> {
      const current = await this.getSalon();
      if (!current) return [];
      return [current];
  }

  async toggleSalonStatus(salonId: string, status: SubscriptionStatus): Promise<void> {
      const salon = await this.getSalon();
      if (salon && salon.id === salonId) {
          salon.subscription_status = status;
          await this.updateSalon(salon);
      }
  }

  // --- Storage ---
  async uploadImage(file: File): Promise<string> {
    if (this.supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('salon-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = this.supabase.storage.from('salon-media').getPublicUrl(filePath);
      return data.publicUrl;
    }
    return URL.createObjectURL(file);
  }

  // --- Salon ---
  async getSalon(): Promise<Salon | null> {
    if (this.supabase) {
      try {
          const { data, error } = await this.supabase.from('salons').select('*').limit(1).maybeSingle();
          if (error) throw error;
          if (data) return data;
      } catch (e) {
          console.warn("Supabase Fetch Error (getSalon):", e);
      }
    }
    // Return null if no salon is configured (Fresh install state)
    return getStorage<Salon | null>('salon', null);
  }

  async updateSalon(salon: Salon): Promise<Salon> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase
                .from('salons')
                .update({ 
                    name: salon.name, 
                    phone: salon.phone, 
                    address: salon.address, 
                    logo_url: salon.logo_url, 
                    opening_hours: salon.opening_hours,
                    subscription_status: salon.subscription_status,
                    owner_email: salon.owner_email
                })
                .eq('id', salon.id)
                .select()
                .single();
            if (!error && data) return data;
            if (error) throw error;
        } catch(e) { console.error(e); }
    }
    setStorage('salon', salon);
    return salon;
  }

  // --- Services ---
  async getServices(): Promise<Service[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('services').select('*');
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
    }
    // Empty default for fresh install
    return getStorage<Service[]>('services', []);
  }

  async addService(service: Service): Promise<Service> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('services').insert(service).select().single();
            if (!error && data) return data;
        } catch(e) { console.error(e); }
    }
    const services = await this.getServices();
    const newServices = [...services, service];
    setStorage('services', newServices);
    return service;
  }

  async updateService(updated: Service): Promise<Service> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('services').update(updated).eq('id', updated.id).select().single();
            if (!error && data) return data;
        } catch(e) { console.error(e); }
    }
    const services = await this.getServices();
    const newServices = services.map(s => s.id === updated.id ? updated : s);
    setStorage('services', newServices);
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    if (this.supabase) {
        try { await this.supabase.from('services').delete().eq('id', id); return; } 
        catch(e) { console.error(e); }
    }
    const services = await this.getServices();
    setStorage('services', services.filter(s => s.id !== id));
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('clients').select('*');
            if (error) throw error;
            if (data) return data;
        } catch(e) { console.warn(e); }
    }
    return getStorage<Client[]>('clients', []);
  }

  async createClient(client: Client): Promise<Client> {
    const salon = await this.getSalon();
    if (!this.checkSubscriptionValidity(salon)) {
        throw new Error("O estabelecimento está temporariamente indisponível. Entre em contato diretamente.");
    }

    if (this.supabase) {
        try {
            const { data: existing } = await this.supabase.from('clients').select('*').eq('whatsapp', client.whatsapp).maybeSingle();
            if (existing) return existing;

            const { data, error } = await this.supabase.from('clients').insert(client).select().single();
            if (!error && data) return data;
        } catch(e) { console.error(e); }
    }

    const clients = await this.getClients();
    const existing = clients.find(c => c.whatsapp === client.whatsapp);
    if (existing) return existing;
    
    const newClients = [...clients, client];
    setStorage('clients', newClients);
    return client;
  }

  async updateClient(updated: Client): Promise<Client> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('clients').update(updated).eq('id', updated.id).select().single();
            if (!error && data) return data;
        } catch(e) { console.error(e); }
    }
    const clients = await this.getClients();
    const newClients = clients.map(c => c.id === updated.id ? updated : c);
    setStorage('clients', newClients);
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    if (this.supabase) {
        try { await this.supabase.from('clients').delete().eq('id', id); return; }
        catch(e) { console.error(e); }
    }
    const clients = await this.getClients();
    setStorage('clients', clients.filter(c => c.id !== id));
  }

  async getClientHistory(clientId: string): Promise<Appointment[]> {
     if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('appointments').select('*').eq('client_id', clientId);
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
     }
    const appointments = await this.getAppointments();
    return appointments.filter(a => a.client_id === clientId);
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

  // --- Appointments & Blocking ---
  async getAppointments(): Promise<Appointment[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('appointments').select('*');
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
    }
    return getStorage<Appointment[]>('appointments', []);
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('blocked_times').select('*');
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
    }
    return getStorage<BlockedTime[]>('blocked_times', []);
  }

  async getBusyTimes(salonId: string, startDate: string): Promise<{start: string, end: string}[]> {
     if (this.supabase) {
         try {
            const { data, error } = await this.supabase
                .from('public_busy_times')
                .select('start_time, end_time')
                .eq('salon_id', salonId)
                .gte('start_time', startDate);
            
            if (!error && data) return data.map((d: any) => ({ start: d.start_time, end: d.end_time }));
         } catch(e) { console.warn("Using fallback busy times", e); }
     }

     const appts = await this.getAppointments();
     const blocks = await this.getBlockedTimes();
     const all = [
         ...appts.filter(a => a.status !== AppointmentStatus.CANCELLED).map(a => ({ start: a.start_time, end: a.end_time })),
         ...blocks.map(b => ({ start: b.start_time, end: b.end_time }))
     ];
     return all.filter(a => new Date(a.start) >= new Date(startDate));
  }

  async addBlockedTime(block: BlockedTime): Promise<void> {
    if (this.supabase) {
        try { await this.supabase.from('blocked_times').insert(block); return; }
        catch(e) { console.error(e); }
    }
    const blocks = await this.getBlockedTimes();
    setStorage('blocked_times', [...blocks, block]);
  }

  async deleteBlockedTime(id: string): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('blocked_times').delete().eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const blocks = await this.getBlockedTimes();
    setStorage('blocked_times', blocks.filter(b => b.id !== id));
  }

  async createAppointment(appt: Appointment): Promise<Appointment> {
    const busy = await this.getBusyTimes(appt.salon_id, appt.start_time.split('T')[0]);
    const newStart = new Date(appt.start_time).getTime();
    const newEnd = new Date(appt.end_time).getTime();

    const hasConflict = busy.some(t => {
        const exStart = new Date(t.start).getTime();
        const exEnd = new Date(t.end).getTime();
        return (newStart < exEnd && newEnd > exStart);
    });

    if (hasConflict) {
      throw new Error('Horário indisponível devido a conflito de agenda ou bloqueio.');
    }

    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('appointments').insert(appt).select().single();
            if (!error && data) return data;
            if (error) throw error;
        } catch(e) { console.error(e); }
    }

    const appointments = await this.getAppointments();
    setStorage('appointments', [...appointments, appt]);
    return appt;
  }

  async updateAppointment(updated: Appointment): Promise<void> {
    if (this.supabase) {
        try { await this.supabase.from('appointments').update(updated).eq('id', updated.id); return; }
        catch(e) { console.error(e); }
    }
     const appointments = await this.getAppointments();
     const newAppts = appointments.filter(a => a.id !== updated.id);
     setStorage('appointments', [...newAppts, updated]);
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('appointments').update({ status }).eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const appointments = await this.getAppointments();
    const newAppointments = appointments.map(a => a.id === id ? { ...a, status } : a);
    setStorage('appointments', newAppointments);
  }

  async deleteAppointment(id: string): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('appointments').delete().eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const appointments = await this.getAppointments();
    setStorage('appointments', appointments.filter(a => a.id !== id));
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('products').select('*');
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
    }
    return getStorage<Product[]>('products', []);
  }

  async addProduct(product: Product): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('products').insert(product); return; }
        catch(e) { console.error(e); }
     }
    const products = await this.getProducts();
    setStorage('products', [...products, product]);
  }

  async updateProduct(updated: Product): Promise<Product> {
     if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('products').update(updated).eq('id', updated.id).select().single();
            if (!error && data) return data;
        } catch(e) { console.error(e); }
     }
    const products = await this.getProducts();
    const newProducts = products.map(p => p.id === updated.id ? updated : p);
    setStorage('products', newProducts);
    return updated;
  }
  
  async deleteProduct(id: string): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('products').delete().eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const products = await this.getProducts();
    setStorage('products', products.filter(p => p.id !== id));
  }

  // --- Product Orders (Orders) ---
  async getOrders(): Promise<Order[]> {
    if (this.supabase) {
        try {
            const { data, error } = await this.supabase.from('product_orders').select('*');
            if (!error && data) return data;
        } catch(e) { console.warn(e); }
    }
    return getStorage<Order[]>('product_orders', []);
  }

  async createOrder(order: Order): Promise<void> {
     const salon = await this.getSalon();
     if (!this.checkSubscriptionValidity(salon)) {
         throw new Error("O estabelecimento está temporariamente indisponível para novos pedidos.");
     }

     if (this.supabase) {
        try { await this.supabase.from('product_orders').insert(order); return; }
        catch(e) { console.error(e); }
     }
    const orders = await this.getOrders();
    setStorage('product_orders', [...orders, order]);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('product_orders').update({ status }).eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const orders = await this.getOrders();
    const newOrders = orders.map(o => o.id === id ? { ...o, status } : o);
    setStorage('product_orders', newOrders);
  }

  async deleteOrder(id: string): Promise<void> {
     if (this.supabase) {
        try { await this.supabase.from('product_orders').delete().eq('id', id); return; }
        catch(e) { console.error(e); }
     }
    const orders = await this.getOrders();
    setStorage('product_orders', orders.filter(o => o.id !== id));
  }
}

export const db = new ApiService();
