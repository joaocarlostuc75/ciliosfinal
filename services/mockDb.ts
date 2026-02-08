import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule } from '../types';
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
  }
];

const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
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
      // Cast auth to any to handle potential type mismatch between v1 types and v2 code
      const { error } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
      if (error) {
        console.error("Login failed:", error.message);
        return { success: false, message: error.message };
      }
      localStorage.setItem('admin_auth', 'true'); // Keep sync flag for router
      return { success: true };
    } else {
      // Sem Supabase e sem Backdoor: Retorna erro
      return { success: false, message: 'Erro: Banco de dados desconectado. Verifique as variáveis de ambiente.' };
    }
  }

  async signUp(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { data, error } = await (this.supabase.auth as any).signUp({ email, password: pass });
      if (error) {
        return { success: false, message: error.message };
      }
      
      // 1. Sessão retornada imediatamente (Email confirmation OFF)
      if (data?.session) {
          localStorage.setItem('admin_auth', 'true');
          return { success: true, message: 'Conta criada e logada com sucesso!' };
      }

      // 2. Tentar login manual imediato (Caso Supabase não retorne sessão no signUp por config)
      if (data?.user && !data.session) {
         const { data: loginData, error: loginError } = await (this.supabase.auth as any).signInWithPassword({ email, password: pass });
         if (!loginError && loginData?.session) {
            localStorage.setItem('admin_auth', 'true');
            return { success: true, message: 'Conta criada e logada com sucesso!' };
         }
      }

      return { success: true, message: 'Conta criada! Se não conseguir entrar, verifique seu email para confirmar o cadastro.' };
    } else {
      // Mock Fallback: Apenas para desenvolvimento local sem backend
      localStorage.setItem('admin_auth', 'true');
      return { success: true, message: 'Conta criada (Modo Simulação Offline).' };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    if (this.supabase) {
      const { error } = await (this.supabase.auth as any).resetPasswordForEmail(email);
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Email de recuperação enviado!' };
    } else {
      // Mock Fallback
      return { success: true, message: 'Email de recuperação enviado (Modo Simulação).' };
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('admin_auth');
    if (this.supabase) {
      // Cast auth to any to handle potential type mismatch
      await (this.supabase.auth as any).signOut();
    }
  }

  isAuthenticated(): boolean {
    // Keep this synchronous for Router guards convenience
    return localStorage.getItem('admin_auth') === 'true';
  }

  // --- Salon ---
  async getSalon(): Promise<Salon> {
    if (this.supabase) {
      // For public side, we assume a single salon or find by slug. 
      // Using slug hardcoded for demo or fetching the first one.
      const { data, error } = await this.supabase.from('salons').select('*').limit(1).single();
      if (error) throw error;
      return data;
    }
    return getStorage<Salon>('salon', initialSalon);
  }

  async updateSalon(salon: Salon): Promise<Salon> {
    if (this.supabase) {
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
        if (error) throw error;
        return data;
    }
    setStorage('salon', salon);
    return salon;
  }

  // --- Services ---
  async getServices(): Promise<Service[]> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('services').select('*');
        if (error) throw error;
        return data || [];
    }
    return getStorage<Service[]>('services', initialServices);
  }

  async addService(service: Service): Promise<Service> {
    if (this.supabase) {
        // Remove ID to let DB generate it if it's a new UUID not generated by client
        // But our code generates UUID on client. Supabase handles upsert or insert ok.
        const { data, error } = await this.supabase.from('services').insert(service).select().single();
        if (error) throw error;
        return data;
    }
    const services = await this.getServices();
    const newServices = [...services, service];
    setStorage('services', newServices);
    return service;
  }

  async updateService(updated: Service): Promise<Service> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('services').update(updated).eq('id', updated.id).select().single();
        if (error) throw error;
        return data;
    }
    const services = await this.getServices();
    const newServices = services.map(s => s.id === updated.id ? updated : s);
    setStorage('services', newServices);
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    if (this.supabase) {
        await this.supabase.from('services').delete().eq('id', id);
        return;
    }
    const services = await this.getServices();
    setStorage('services', services.filter(s => s.id !== id));
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('clients').select('*');
        if (error) throw error;
        return data || [];
    }
    return getStorage<Client[]>('clients', []);
  }

  async createClient(client: Client): Promise<Client> {
    if (this.supabase) {
        // Check exist by whatsapp using Supabase unique constraint or manual check?
        // Let's use upsert or select first.
        const { data: existing } = await this.supabase.from('clients').select('*').eq('whatsapp', client.whatsapp).single();
        if (existing) return existing;

        const { data, error } = await this.supabase.from('clients').insert(client).select().single();
        if (error) throw error;
        return data;
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
        const { data, error } = await this.supabase.from('clients').update(updated).eq('id', updated.id).select().single();
        if (error) throw error;
        return data;
    }
    const clients = await this.getClients();
    const newClients = clients.map(c => c.id === updated.id ? updated : c);
    setStorage('clients', newClients);
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    if (this.supabase) {
        await this.supabase.from('clients').delete().eq('id', id);
        return;
    }
    const clients = await this.getClients();
    setStorage('clients', clients.filter(c => c.id !== id));
  }

  async getClientHistory(clientId: string): Promise<Appointment[]> {
     if (this.supabase) {
        const { data, error } = await this.supabase.from('appointments').select('*').eq('client_id', clientId);
        if (error) throw error;
        return data || [];
     }
    const appointments = await this.getAppointments();
    return appointments.filter(a => a.client_id === clientId);
  }

  // --- Appointments & Blocking ---
  async getAppointments(): Promise<Appointment[]> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('appointments').select('*');
        if (error) throw error;
        return data || [];
    }
    return getStorage<Appointment[]>('appointments', []);
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('blocked_times').select('*');
        if (error) throw error;
        return data || [];
    }
    return getStorage<BlockedTime[]>('blocked_times', []);
  }

  // New Method for Booking Page to use the Secure View
  async getBusyTimes(salonId: string, startDate: string): Promise<{start: string, end: string}[]> {
     if (this.supabase) {
         const { data, error } = await this.supabase
            .from('public_busy_times') // The View created in SQL
            .select('start_time, end_time')
            .eq('salon_id', salonId)
            .gte('start_time', startDate);
         
         if (error) throw error;
         return data.map((d: any) => ({ start: d.start_time, end: d.end_time }));
     }

     // Mock Fallback: Calculate from arrays
     const appts = await this.getAppointments();
     const blocks = await this.getBlockedTimes();
     const all = [
         ...appts.filter(a => a.status !== AppointmentStatus.CANCELLED).map(a => ({ start: a.start_time, end: a.end_time })),
         ...blocks.map(b => ({ start: b.start_time, end: b.end_time }))
     ];
     // Filter by date roughly
     return all.filter(a => new Date(a.start) >= new Date(startDate));
  }

  async addBlockedTime(block: BlockedTime): Promise<void> {
    if (this.supabase) {
        await this.supabase.from('blocked_times').insert(block);
        return;
    }
    const blocks = await this.getBlockedTimes();
    setStorage('blocked_times', [...blocks, block]);
  }

  async deleteBlockedTime(id: string): Promise<void> {
     if (this.supabase) {
        await this.supabase.from('blocked_times').delete().eq('id', id);
        return;
     }
    const blocks = await this.getBlockedTimes();
    setStorage('blocked_times', blocks.filter(b => b.id !== id));
  }

  async createAppointment(appt: Appointment): Promise<Appointment> {
    // Conflict check is better done on server or via DB constraints, but we do client side check too
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
        const { data, error } = await this.supabase.from('appointments').insert(appt).select().single();
        if (error) throw error;
        return data;
    }

    const appointments = await this.getAppointments();
    setStorage('appointments', [...appointments, appt]);
    return appt;
  }

  async updateAppointment(updated: Appointment): Promise<void> {
     // Skip conflict check for simplicity in edit, or reuse logic
    if (this.supabase) {
        await this.supabase.from('appointments').update(updated).eq('id', updated.id);
        return;
    }

     const appointments = await this.getAppointments();
     const newAppts = appointments.filter(a => a.id !== updated.id);
     setStorage('appointments', [...newAppts, updated]);
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
     if (this.supabase) {
        await this.supabase.from('appointments').update({ status }).eq('id', id);
        return;
     }
    const appointments = await this.getAppointments();
    const newAppointments = appointments.map(a => a.id === id ? { ...a, status } : a);
    setStorage('appointments', newAppointments);
  }

  async deleteAppointment(id: string): Promise<void> {
     if (this.supabase) {
        await this.supabase.from('appointments').delete().eq('id', id);
        return;
     }
    const appointments = await this.getAppointments();
    setStorage('appointments', appointments.filter(a => a.id !== id));
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    if (this.supabase) {
        const { data, error } = await this.supabase.from('products').select('*');
        if (error) throw error;
        return data || [];
    }
    return getStorage<Product[]>('products', []);
  }

  async addProduct(product: Product): Promise<void> {
     if (this.supabase) {
        await this.supabase.from('products').insert(product);
        return;
     }
    const products = await this.getProducts();
    setStorage('products', [...products, product]);
  }

  async updateProduct(updated: Product): Promise<Product> {
     if (this.supabase) {
        const { data, error } = await this.supabase.from('products').update(updated).eq('id', updated.id).select().single();
        if (error) throw error;
        return data;
     }
    const products = await this.getProducts();
    const newProducts = products.map(p => p.id === updated.id ? updated : p);
    setStorage('products', newProducts);
    return updated;
  }
  
  async deleteProduct(id: string): Promise<void> {
     if (this.supabase) {
        await this.supabase.from('products').delete().eq('id', id);
        return;
     }
    const products = await this.getProducts();
    setStorage('products', products.filter(p => p.id !== id));
  }
}

export const db = new ApiService();