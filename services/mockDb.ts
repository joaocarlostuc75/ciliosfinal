
import { Appointment, AppointmentStatus, Client, Product, Salon, Service, BlockedTime, DaySchedule, Order, OrderStatus, SubscriptionStatus, SubscriptionPlan, GlobalSettings, SystemPlan } from '../types';
import { supabase } from './supabaseClient';
import { addDays } from 'date-fns';

// --- CONSTANTES DE AMBIENTE (IDS FIXOS) ---
export const ESTETICA_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';

// O Demo Principal (Beauty Power) usa o ID de Estética
const MOCK_SALON_ID = ESTETICA_ID; 

// CONFIGURAÇÃO DE ACESSO:
// 1. Super Admin (Dono do Sistema): joaocarlostuc@gmail.com
// 2. Admin da Loja (Beauty Power): joaocarlostuc75@gmail.com
const SUPER_ADMIN_EMAIL = 'joaocarlostuc@gmail.com';

const defaultSchedule: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, slots: [] },
  { dayOfWeek: 1, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { dayOfWeek: 2, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { dayOfWeek: 3, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { dayOfWeek: 4, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { dayOfWeek: 5, isOpen: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  { dayOfWeek: 6, isOpen: true, slots: [{ start: '09:00', end: '14:00' }] },
];

// 1. ESTÉTICA (BEAUTY POWER) - LOJA PRINCIPAL
const DEMO_SALON: Salon = {
    id: MOCK_SALON_ID,
    name: 'Beauty Power',
    slug: 'beauty-power',
    logo_url: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&q=80&w=500', // Logo mais premium
    phone: '(11) 99999-9999',
    address: 'Rua Oscar Freire, 1500 - Jardins, SP',
    theme_color: '#C5A059',
    opening_hours: defaultSchedule,
    subscription_status: SubscriptionStatus.TRIAL,
    subscription_plan: 'Plano Gold VIP',
    subscription_end_date: addDays(new Date(), 14).toISOString(), // 14 dias restantes
    created_at: addDays(new Date(), -1).toISOString(),
    owner_email: 'joaocarlostuc75@gmail.com', // EMAIL DO ADMIN DA LOJA
    password: '123456', // SECURITY: Default password for demo
    is_lifetime_free: false,
    last_login: new Date().toISOString()
};

// --- SERVICES SEEDS (EXPANDIDO) ---

const DEMO_SERVICES: Service[] = [
    {
        id: 'srv-1', salon_id: MOCK_SALON_ID, name: 'Volume Russo Premium',
        description: 'Técnica avançada com fios de seda para um olhar marcante e volumoso. Durabilidade de até 20 dias.',
        price: 250.00, duration_min: 120,
        image_url: 'https://images.unsplash.com/photo-1587776536545-927974a72748?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-2', salon_id: MOCK_SALON_ID, name: 'Lash Lifting + Tintura',
        description: 'Curvatura natural dos seus próprios cílios com nutrição de queratina e coloração.',
        price: 180.00, duration_min: 60,
        image_url: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-3', salon_id: MOCK_SALON_ID, name: 'Brow Lamination',
        description: 'Sobrancelhas alinhadas, encorpadas e preenchidas com efeito natural e moderno.',
        price: 150.00, duration_min: 45,
        image_url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-4', salon_id: MOCK_SALON_ID, name: 'Hydra Gloss Lips',
        description: 'Hidratação profunda com ácido hialurônico e revitalização da cor dos lábios.',
        price: 200.00, duration_min: 40,
        image_url: 'https://images.unsplash.com/photo-1560049444-1845eb67a393?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-5', salon_id: MOCK_SALON_ID, name: 'Limpeza de Pele Profunda',
        description: 'Remoção de impurezas, extração de comedões e alta frequência. Inclui máscara de ouro.',
        price: 180.00, duration_min: 90,
        image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-6', salon_id: MOCK_SALON_ID, name: 'Micropigmentação Fio a Fio',
        description: 'Técnica realista para corrigir falhas e desenhar sobrancelhas perfeitas. Retoque incluso.',
        price: 550.00, duration_min: 150,
        image_url: 'https://images.unsplash.com/photo-1595867359994-d2c6734c4c84?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-7', salon_id: MOCK_SALON_ID, name: 'Drenagem Linfática Facial',
        description: 'Massagem suave para reduzir inchaço, olheiras e melhorar a circulação facial.',
        price: 120.00, duration_min: 30,
        image_url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'srv-8', salon_id: MOCK_SALON_ID, name: 'Spa dos Pés',
        description: 'Esfoliação, hidratação profunda e massagem relaxante nos pés.',
        price: 80.00, duration_min: 40,
        image_url: 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?auto=format&fit=crop&q=80&w=500'
    }
];

// --- PRODUCTS SEEDS (EXPANDIDO) ---

const DEMO_PRODUCTS: Product[] = [
    {
        id: 'prod-1', salon_id: MOCK_SALON_ID, name: 'Sérum de Crescimento Lash',
        description: 'Estimula o crescimento natural dos fios em 30 dias. Fórmula testada oftalmologicamente.',
        price: 89.90, stock: 15,
        image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'prod-2', salon_id: MOCK_SALON_ID, name: 'Espuma de Limpeza Facial',
        description: 'Higienização segura para extensões de cílios e pele sensível. pH balanceado.',
        price: 45.00, stock: 30,
        image_url: 'https://images.unsplash.com/photo-1556228720-1957be83f360?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'prod-3', salon_id: MOCK_SALON_ID, name: 'Kit Home Care Premium',
        description: 'Tudo o que você precisa para manter seu procedimento em casa: escovinha, espuma e sérum.',
        price: 120.00, stock: 5,
        image_url: 'https://images.unsplash.com/photo-1616943063809-7707e99732f9?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'prod-4', salon_id: MOCK_SALON_ID, name: 'Óleo Reparador de Cutículas',
        description: 'Blend de óleos essenciais para hidratação de cutículas e fortalecimento das unhas.',
        price: 35.90, stock: 20,
        image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'prod-5', salon_id: MOCK_SALON_ID, name: 'Protetor Solar Facial FPS 70',
        description: 'Toque seco, ideal para uso pós procedimentos estéticos. Não oleoso.',
        price: 95.00, stock: 12,
        image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=500'
    },
    {
        id: 'prod-6', salon_id: MOCK_SALON_ID, name: 'Esfoliante Labial de Café',
        description: 'Remove células mortas e ativa a circulação dos lábios. Aroma delicioso.',
        price: 29.90, stock: 25,
        image_url: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=500'
    }
];

const DEFAULT_PLANS: SystemPlan[] = [
    { 
        id: '1', name: 'Plano Bronze', price: 149, period: 'monthly', 
        features: ['1 Usuário', 'Agenda Básica', 'Suporte por Email'], is_popular: false, is_public: true
    },
    { 
        id: '2', name: 'Plano Silver', price: 289, period: 'monthly', 
        features: ['3 Usuários', 'Agenda Avançada', 'Gestão Financeira', 'Suporte Prioritário'], is_popular: true, is_public: true
    },
    { 
        id: '3', name: 'Plano Gold VIP', price: 450, period: 'monthly', 
        features: ['Ilimitado', 'Todas as funcionalidades', 'Consultoria Mensal', 'Home Care Kit'], is_popular: false, is_public: true
    },
    { 
        id: '4', name: 'Plano Parceiro (Secreto)', price: 99, period: 'monthly', 
        features: ['Acesso total com desconto'], is_popular: false, is_public: false
    }
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
      // 1. Initialize Global Settings
      if (!getStorage('global_settings', null)) {
          setStorage('global_settings', {
              id: 'global',
              default_logo_url: '',
              app_name: 'J.C Sistemas',
              broadcast_message: '',
              super_admin_phone: '',
              updated_at: new Date().toISOString()
          });
      }

      // 2. Initialize Plans
      if (!getStorage('system_plans', null)) {
          setStorage('system_plans', DEFAULT_PLANS);
      }

      // 3. FORCE Initialize Single Demo Data (Overwrite old list to cleanup)
      // This ensures previous "prompt-added" stores are removed from LocalStorage
      setStorage('salons_list', [DEMO_SALON]);

      // Seed Services (Merge if not exists, but we want to ensure Demo services are present)
      const storedServices = (getStorage<Service[]>('services', []) ?? []) as Service[];
      // Filter out services that belong to deleted salons (if any)
      const cleanServices = storedServices.filter(s => s.salon_id === MOCK_SALON_ID);
      
      // Upsert Demo Services
      DEMO_SERVICES.forEach(svc => {
          const idx = cleanServices.findIndex(s => s.id === svc.id);
          if (idx >= 0) {
              // Update existing demo service
              cleanServices[idx] = svc; 
          } else {
              cleanServices.push(svc);
          }
      });
      setStorage('services', cleanServices);

      // Seed Products
      const storedProducts = (getStorage<Product[]>('products', []) ?? []) as Product[];
      const cleanProducts = storedProducts.filter(p => p.salon_id === MOCK_SALON_ID);

      DEMO_PRODUCTS.forEach(prod => {
          const idx = cleanProducts.findIndex(p => p.id === prod.id);
          if (idx >= 0) {
              cleanProducts[idx] = prod;
          } else {
              cleanProducts.push(prod);
          }
      });
      setStorage('products', cleanProducts);
      
      // 4. Restore Session or Default to Demo (Lash)
      const storedId = localStorage.getItem('active_salon_id');
      // If stored ID is one of the deleted ones, reset to main demo
      if (storedId === MOCK_SALON_ID) {
          this.currentSalonId = storedId;
      } else {
          this.currentSalonId = MOCK_SALON_ID;
          localStorage.setItem('active_salon_id', MOCK_SALON_ID);
      }
  }

  // --- Auth & Security ---
  
  async login(email: string, pass: string): Promise<{ success: boolean; message?: string; role?: 'ADMIN' | 'SUPER_ADMIN' }> {
    // 1. Super Admin Credentials Check (SaaS Owner)
    if (email === SUPER_ADMIN_EMAIL && pass === 'admin123') {
        localStorage.setItem('auth_role', 'SUPER_ADMIN');
        return { success: true, role: 'SUPER_ADMIN' };
    }

    // 2. Normal Admin Login (Store Owner)
    const salons = await this.getAllSalons();
    const userSalon = salons.find(s => s.owner_email === email);

    if (userSalon) {
         if (userSalon.password && userSalon.password !== pass) {
             return { success: false, message: 'Senha incorreta.' };
         }
         
         if (!userSalon.password && !pass) {
             return { success: false, message: 'Digite a senha.' };
         }

         localStorage.setItem('auth_role', 'ADMIN');
         this.setCurrentSalon(userSalon.id);
         
         // Update Last Login
         userSalon.last_login = new Date().toISOString();
         this.adminUpdateSalon(userSalon);
         
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

    return { success: false, message: 'Credenciais inválidas.' };
  }

  // Feature: Impersonate (Log in as a specific salon without password)
  async impersonateSalon(salonId: string): Promise<void> {
      const salons = await this.getAllSalons();
      const target = salons.find(s => s.id === salonId);
      
      if (!target) throw new Error("Salão não encontrado");
      
      localStorage.setItem('auth_role', 'ADMIN');
      this.setCurrentSalon(target.id);
  }

  async signUp(email: string, pass: string): Promise<{ success: boolean; message?: string }> {
    const salons = await this.getAllSalons();
    if (salons.some(s => s.owner_email === email)) {
        return { success: false, message: 'Email já cadastrado.' };
    }

    const newSalonId = crypto.randomUUID();
    const newSalon: Salon = {
        id: newSalonId,
        name: 'Novo Estabelecimento',
        slug: `novo-${newSalonId.slice(0, 8)}`,
        logo_url: '', 
        phone: '',
        address: '',
        opening_hours: defaultSchedule,
        subscription_status: SubscriptionStatus.TRIAL,
        subscription_plan: 'FREE',
        created_at: new Date().toISOString(),
        subscription_end_date: addDays(new Date(), 10).toISOString(), // 10 days trial
        owner_email: email,
        password: pass, // Store the password for future login checks
        is_lifetime_free: false,
        last_login: new Date().toISOString()
    };

    setStorage('salons_list', [...salons, newSalon]);
    
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
      const salon = await this.getSalon();
      if (salon) {
          salon.password = newPass;
          await this.updateSalon(salon);
      }
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: 'Email de recuperação enviado (Simulado).' };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_role');
    localStorage.removeItem('active_salon_id');
    this.currentSalonId = null; 
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
          app_name: 'J.C Sistemas',
          broadcast_message: '',
          super_admin_phone: '',
          updated_at: new Date().toISOString()
      })!;
  }

  async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
      setStorage('global_settings', settings);
  }

  // --- System Plans (Super Admin) ---

  async getSystemPlans(): Promise<SystemPlan[]> {
      return (getStorage<SystemPlan[]>('system_plans', DEFAULT_PLANS) ?? []) as SystemPlan[];
  }

  async saveSystemPlan(plan: SystemPlan): Promise<void> {
      const plans = await this.getSystemPlans();
      const exists = plans.find(p => p.id === plan.id);
      let newPlans;
      if (exists) {
          newPlans = plans.map(p => p.id === plan.id ? plan : p);
      } else {
          newPlans = [...plans, plan];
      }
      setStorage('system_plans', newPlans);
  }

  async deleteSystemPlan(id: string): Promise<void> {
      const plans = await this.getSystemPlans();
      setStorage('system_plans', plans.filter(p => p.id !== id));
  }

  // --- Subscription Logic ---

  checkSubscriptionValidity(salon: Salon | null): boolean {
      if (!salon) return false;
      
      // Super Admin Rule: Never expires
      if (salon.owner_email === SUPER_ADMIN_EMAIL) return true;
      
      if (salon.is_lifetime_free) return true;
      if (salon.subscription_status === SubscriptionStatus.BLOCKED) return false;
      if (salon.subscription_status === SubscriptionStatus.CANCELLED) return false;

      if (salon.subscription_end_date) {
          const endDate = new Date(salon.subscription_end_date);
          const now = new Date();
          if (endDate < now) {
              if (salon.subscription_status !== SubscriptionStatus.EXPIRED) {
                  salon.subscription_status = SubscriptionStatus.EXPIRED;
                  this.updateSalon(salon);
              }
              return false;
          }
      }

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
      return (getStorage<Salon[]>('salons_list', []) ?? []) as Salon[];
  }

  async adminUpdateSalon(salon: Salon): Promise<void> {
      const list = await this.getAllSalons();
      const newList = list.map(s => s.id === salon.id ? salon : s);
      setStorage('salons_list', newList);
  }

  async deleteSalon(id: string): Promise<void> {
      const list = await this.getAllSalons();
      const newList = list.filter(s => s.id !== id);
      setStorage('salons_list', newList);

      const removeBySalon = (key: string) => {
          const data = (getStorage<any[]>(key, []) ?? []) as any[];
          if (data) {
              const cleaned = data.filter((item: any) => item.salon_id !== id);
              setStorage(key, cleaned);
          }
      };

      removeBySalon('services');
      removeBySalon('products');
      removeBySalon('clients');
      removeBySalon('appointments');
      removeBySalon('product_orders');
      removeBySalon('blocked_times');
  }

  // --- Storage ---
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
  }

  // --- Salon Data Access ---
  
  async getSalon(): Promise<Salon | null> {
      const all = await this.getAllSalons();
      if (this.currentSalonId) {
          const found = all.find(s => s.id === this.currentSalonId);
          if (found) return found;
      }
      if (all.length > 0) return all[0];
      return null;
  }

  async updateSalon(salon: Salon): Promise<Salon> {
      await this.adminUpdateSalon(salon);
      return salon;
  }

  // --- Services (Filtered by Salon ID) ---
  
  async getServices(): Promise<Service[]> {
    const all = (getStorage<Service[]>('services', []) ?? []) as Service[];
    if (!this.currentSalonId) return [];
    return all.filter(s => s.salon_id === this.currentSalonId);
  }

  async addService(service: Service): Promise<Service> {
    const all = (getStorage<Service[]>('services', []) ?? []) as Service[];
    service.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('services', [...all, service]);
    return service;
  }

  async updateService(updated: Service): Promise<Service> {
    const all = (getStorage<Service[]>('services', []) ?? []) as Service[];
    const newAll = all.map(s => s.id === updated.id ? updated : s);
    setStorage('services', newAll);
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    const all = (getStorage<Service[]>('services', []) ?? []) as Service[];
    setStorage('services', all.filter(s => s.id !== id));
  }

  // --- Clients (Filtered) ---
  
  async getClients(): Promise<Client[]> {
    const all = (getStorage<Client[]>('clients', []) ?? []) as Client[];
    if (!this.currentSalonId) return [];
    return all.filter(c => c.salon_id === this.currentSalonId);
  }

  async createClient(client: Client): Promise<Client> {
    const all = (getStorage<Client[]>('clients', []) ?? []) as Client[];
    client.salon_id = this.currentSalonId || MOCK_SALON_ID;
    const existing = all.find(c => c.salon_id === client.salon_id && c.whatsapp === client.whatsapp);
    if (existing) return existing;
    setStorage('clients', [...all, client]);
    return client;
  }

  async updateClient(updated: Client): Promise<Client> {
    const all = (getStorage<Client[]>('clients', []) ?? []) as Client[];
    setStorage('clients', all.map(c => c.id === updated.id ? updated : c));
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    const all = (getStorage<Client[]>('clients', []) ?? []) as Client[];
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
    const all = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
    if (!this.currentSalonId) return [];
    return all.filter(a => a.salon_id === this.currentSalonId);
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    const all = (getStorage<BlockedTime[]>('blocked_times', []) ?? []) as BlockedTime[];
    if (!this.currentSalonId) return [];
    return all.filter(b => b.salon_id === this.currentSalonId);
  }

  async getBusyTimes(salonId: string, startDate: string): Promise<{start: string, end: string}[]> {
     const allAppts = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
     const allBlocks = (getStorage<BlockedTime[]>('blocked_times', []) ?? []) as BlockedTime[];

     const salonAppts = allAppts.filter(a => a.salon_id === salonId && a.status !== AppointmentStatus.CANCELLED);
     const salonBlocks = allBlocks.filter(b => b.salon_id === salonId);

     const all = [
         ...salonAppts.map(a => ({ start: a.start_time, end: a.end_time })),
         ...salonBlocks.map(b => ({ start: b.start_time, end: b.end_time }))
     ];
     return all.filter(a => new Date(a.start) >= new Date(startDate));
  }

  async addBlockedTime(block: BlockedTime): Promise<void> {
    const all = (getStorage<BlockedTime[]>('blocked_times', []) ?? []) as BlockedTime[];
    block.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('blocked_times', [...all, block]);
  }

  async deleteBlockedTime(id: string): Promise<void> {
    const all = (getStorage<BlockedTime[]>('blocked_times', []) ?? []) as BlockedTime[];
    setStorage('blocked_times', all.filter(b => b.id !== id));
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
      throw new Error('Horário indisponível.');
    }

    const all = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
    setStorage('appointments', [...all, appt]);
    return appt;
  }

  async updateAppointment(updated: Appointment): Promise<void> {
    const all = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
    setStorage('appointments', all.map(a => a.id === updated.id ? updated : a));
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    const all = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
    setStorage('appointments', all.map(a => a.id === id ? { ...a, status } : a));
  }

  async deleteAppointment(id: string): Promise<void> {
    const all = (getStorage<Appointment[]>('appointments', []) ?? []) as Appointment[];
    setStorage('appointments', all.filter(a => a.id !== id));
  }

  // --- Products (Filtered) ---
  
  async getProducts(): Promise<Product[]> {
    const all = (getStorage<Product[]>('products', []) ?? []) as Product[];
    if (!this.currentSalonId) return [];
    return all.filter(p => p.salon_id === this.currentSalonId);
  }

  async addProduct(product: Product): Promise<void> {
    const all = (getStorage<Product[]>('products', []) ?? []) as Product[];
    product.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('products', [...all, product]);
  }

  async updateProduct(updated: Product): Promise<Product> {
    const all = (getStorage<Product[]>('products', []) ?? []) as Product[];
    setStorage('products', all.map(p => p.id === updated.id ? updated : p));
    return updated;
  }
  
  async deleteProduct(id: string): Promise<void> {
    const all = (getStorage<Product[]>('products', []) ?? []) as Product[];
    setStorage('products', all.filter(p => p.id !== id));
  }

  // --- Orders (Filtered) ---
  
  async getOrders(): Promise<Order[]> {
    const all = (getStorage<Order[]>('product_orders', []) ?? []) as Order[];
    if (!this.currentSalonId) return [];
    return all.filter(o => o.salon_id === this.currentSalonId);
  }

  async createOrder(order: Order): Promise<void> {
    const all = (getStorage<Order[]>('product_orders', []) ?? []) as Order[];
    order.salon_id = this.currentSalonId || MOCK_SALON_ID;
    setStorage('product_orders', [...all, order]);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const all = (getStorage<Order[]>('product_orders', []) ?? []) as Order[];
    setStorage('product_orders', all.map(o => o.id === id ? { ...o, status } : o));
  }

  async deleteOrder(id: string): Promise<void> {
    const all = (getStorage<Order[]>('product_orders', []) ?? []) as Order[];
    setStorage('product_orders', all.filter(o => o.id !== id));
  }
}

export const db = new ApiService();
