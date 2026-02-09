
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Appointment, Service, Order, Product } from '../../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type HistoryItem = 
  | ({ type: 'appointment' } & Appointment) 
  | ({ type: 'order' } & Order);

export const MySchedule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Metadata for enrichment
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const init = async () => {
        setServices(await db.getServices());
        setProducts(await db.getProducts());
        
        // Auto search if phone is in URL
        if (searchParams.get('phone')) {
            handleSearch(searchParams.get('phone')!);
        }
    };
    init();
  }, []);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const handleSearch = async (phoneNumber: string) => {
    setLoading(true);
    setHasSearched(true);
    
    // 1. Fetch Appointments (using helper)
    const appointments = await db.getClientAppointmentsByPhone(phoneNumber);
    const historyApps: HistoryItem[] = appointments.map(a => ({ ...a, type: 'appointment' }));

    // 2. Fetch Orders
    const orders = await db.getClientOrders(phoneNumber);
    const historyOrders: HistoryItem[] = orders.map(o => ({ ...o, type: 'order' }));

    // 3. Merge and Sort Descending
    const merged = [...historyApps, ...historyOrders].sort((a, b) => {
        const dateA = a.type === 'appointment' ? a.start_time : a.created_at;
        const dateB = b.type === 'appointment' ? b.start_time : b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    setItems(merged);
    setLoading(false);
  };

  const onFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSearchParams({ phone });
      handleSearch(phone);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
          case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
  };

  const translateStatus = (status: string) => {
      switch(status) {
          case 'CONFIRMED': return 'Confirmado';
          case 'COMPLETED': return 'Concluído';
          case 'CANCELLED': return 'Cancelado';
          case 'PENDING': return 'Pendente';
          default: return status;
      }
  };

  const getServiceData = (id: string) => services.find(s => s.id === id);
  const getProductData = (id: string) => products.find(p => p.id === id);

  return (
    <div className="min-h-screen bg-luxury-light pb-20">
      <nav className="p-4 flex items-center border-b border-gold-200 bg-white/50 backdrop-blur sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate('/services')} className="p-2 text-gold-700 hover:bg-gold-50 rounded-full transition-colors">
           <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <span className="font-serif font-bold text-gold-900 ml-2">Minha Agenda</span>
      </nav>

      <main className="max-w-md mx-auto p-6">
          
          {/* Search Box */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gold-100 mb-8 animate-fade-in">
              <h2 className="font-serif text-xl font-bold text-gold-900 mb-4">Consultar Histórico</h2>
              <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gold-400">phone_iphone</span>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        placeholder="Seu WhatsApp (apenas números)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-gold-500 bg-gray-50 focus:bg-white transition-all"
                        required
                        maxLength={15}
                      />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gold-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-gold-600 active:scale-95 transition-all"
                  >
                    {loading ? 'Buscando...' : 'Ver Meus Agendamentos'}
                  </button>
              </form>
          </div>

          {/* Results List */}
          {hasSearched && (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                     <h3 className="font-serif text-lg font-bold text-gold-900">Seus Registros</h3>
                     <span className="text-xs text-gray-400">{items.length} itens encontrados</span>
                  </div>

                  {items.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history_toggle_off</span>
                          <p>Nenhum agendamento ou pedido encontrado para este número.</p>
                      </div>
                  ) : (
                      items.map((item, idx) => {
                          const isAppt = item.type === 'appointment';
                          const details = isAppt 
                              ? getServiceData((item as Appointment).service_id)
                              : getProductData((item as Order).product_id);
                          
                          const name = details ? details.name : (isAppt ? 'Serviço Removido' : 'Produto Removido');
                          const date = isAppt ? (item as Appointment).start_time : (item as Order).created_at;
                          
                          // Image for styling
                          const image = details?.image_url;

                          return (
                              <div key={`${item.id}-${idx}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gold-50 hover:shadow-md transition-shadow relative overflow-hidden group">
                                  {/* Status Badge */}
                                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider border-b border-l ${getStatusColor(item.status)}`}>
                                      {translateStatus(item.status)}
                                  </div>

                                  <div className="flex gap-4 items-start pt-2">
                                      <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden border border-gray-100">
                                          {image ? (
                                              <img src={image} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gold-300">
                                                  <span className="material-symbols-outlined text-2xl">{isAppt ? 'spa' : 'shopping_bag'}</span>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-1">
                                              {isAppt ? 'Agendamento' : 'Pedido de Produto'}
                                          </p>
                                          <h4 className="font-bold text-gray-800 text-base leading-tight mb-1">{name}</h4>
                                          <div className="flex flex-col gap-0.5">
                                              <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                  <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                  {format(new Date(date), "dd 'de' MMMM", { locale: pt })}
                                              </div>
                                              {isAppt && (
                                                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                      {format(new Date(date), "HH:mm")}
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          )}
      </main>
    </div>
  );
};
