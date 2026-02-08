import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule, Order, OrderStatus } from '../types';
import { supabase } from './supabaseClient';

// Initial Mock Data
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
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
  },
  {
    id: '3',
    salon_id: MOCK_SALON_ID,
    name: 'Cílios Fio a Fio',
    description: 'Clássico para quem busca naturalidade e definição.',
    price: 110.00,
    duration_min: 90,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
  },
  {
    id: '4',
    salon_id: MOCK_SALON_ID,
    name: 'Manutenção',
    description: 'Manutenção de cílios para manter o volume e formato por mais tempo.',
    price: 80.00,
    duration_min: 60,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
  }
];

const getStorage = <T>(key: string, initial: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn(`Failed to parse storage for key ${key}`, e);
    // Remove corrupted data to prevent future crashes
    localStorage.removeItem(key);
  }
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

class ApiService {
  private supabase = supabase;

  // --- Auth ---
  async login(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
      if (error) {
        console.error("Login failed:", error.message);
        return { success: false, message: error.message };
      }
      localStorage.setItem('admin_auth', 'true');
      return { success: true };
    }
    return { success: false, message: 'Banco de dados desconectado.' };
  }

  async signUp(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { data, error } = await (this.supabase.auth as any).signUp({ email, password: pass });
      if (error) {
        return { success: false, message: error.message };
      }
      if (data?.session) {
          localStorage.setItem('admin_auth', 'true');
          return { success: true, message: 'Conta criada e logada com sucesso!' };
      }
      if (data?.user && !data.session) {
         const { data: loginData, error: loginError } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
         if (!loginError && loginData?.session) {
            localStorage.setItem('admin_auth', 'true');
            return { success: true, message: 'Conta criada e logada com sucesso!' };
         }
      }
      return { success: true, message: 'Conta criada! Se não conseguir entrar, verifique seu email para confirmar o cadastro.' };
    }
    return { success: false, message: 'Banco de dados desconectado.' };
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).resetPasswordForEmail(email);
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Email de recuperação enviado!' };
    }
    return { success: false, message: 'Banco de dados desconectado.' };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('admin_auth');
    if (this.supabase) {
      await (this.supabase.auth as any).signOut();
    }
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('admin_auth') === 'true';
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
    // Fallback for mock/offline (will not persist well but prevents crash)
    return URL.createObjectURL(file);
  }

  // --- Salon ---
  async getSalon(): Promise<Salon> {
    if (this.supabase) {
      try {
          // Use maybeSingle to avoid crash if DB is empty
          const { data, error } = await this.supabase.from('salons').select('*').limit(1).maybeSingle();
          if (error) throw error;
          if (data) return data;
      } catch (e) {
          console.warn("Supabase Fetch Error (getSalon):", e);
          // Fallback to mock data below
      }
    }
    return getStorage<Salon>('salon', initialSalon);
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
                    opening_hours: salon.opening_hours 
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
            if (error) throw error;
            if (data) return data;
        } catch(e) {
            console.warn("Supabase Fetch Error (getServices):", e);
        }
    }
    return getStorage<Service[]>('services', initialServices);
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