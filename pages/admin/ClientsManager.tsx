import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Client, Appointment, Service } from '../../types';
import { format } from 'date-fns';

export const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // State for Edit/View
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingHistory, setViewingHistory] = useState<{ client: Client, appointments: Appointment[], totalSpent: number } | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Form Data
  const [formData, setFormData] = useState({ name: '', whatsapp: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setClients(await db.getClients());
    setServices(await db.getServices());
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.whatsapp.includes(searchTerm)
  );

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, whatsapp: client.whatsapp });
    } else {
      setEditingClient(null);
      setFormData({ name: '', whatsapp: '' });
    }
    setIsFormOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: editingClient ? editingClient.id : crypto.randomUUID(),
      salon_id: 'e2c0a884-6d9e-4861-a9d5-17154238805f',
      name: formData.name,
      whatsapp: formData.whatsapp,
      created_at: editingClient ? editingClient.created_at : new Date().toISOString()
    };

    if (editingClient) {
      await db.updateClient(newClient);
    } else {
      await db.createClient(newClient);
    }
    await loadData();
    setIsFormOpen(false);
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza? Isso não apagará os agendamentos passados, mas removerá o cliente da lista.')) {
      await db.deleteClient(id);
      await loadData();
    }
  };

  const handleWhatsApp = (client: Client) => {
    // Remove non-digits
    const cleanNumber = client.whatsapp.replace(/\D/g, '');
    const msg = `Olá ${client.name}, tudo bem? Aqui é da Cílios de Luxo! 🌸\nComo podemos ajudar hoje?`;
    window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getServiceData = (id: string) => services.find(s => s.id === id);

  const handleViewHistory = async (client: Client) => {
    const history = await db.getClientHistory(client.id);
    history.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    
    // Calculate Total Spent (Only Completed/Confirmed)
    const total = history.reduce((acc, curr) => {
        if (curr.status === 'COMPLETED' || curr.status === 'CONFIRMED') {
            const svc = getServiceData(curr.service_id);
            return acc + (svc ? svc.price : 0);
        }
        return acc;
    }, 0);

    setViewingHistory({ client, appointments: history, totalSpent: total });
    setIsHistoryOpen(true);
  };

  return (
    <div>
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nome ou WhatsApp..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gold-200 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-sm"
          />
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-gold-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gold-600 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <span className="material-symbols-outlined">person_add</span>
          Novo Cliente
        </button>
      </div>

      {/* Responsive Layout: Cards on Mobile, Table on Desktop */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
        
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-gold-50 border-b border-gold-200">
              <tr>
                <th className="px-6 py-4 font-serif font-bold text-gold-900">Cliente</th>
                <th className="px-6 py-4 font-serif font-bold text-gold-900 text-center">Contato</th>
                <th className="px-6 py-4 font-serif font-bold text-gold-900">Desde</th>
                <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum cliente encontrado.</td></tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{client.name}</td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => handleWhatsApp(client)}
                         className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-800 transition-colors shadow-sm"
                         title={`Enviar mensagem para ${client.whatsapp}`}
                       >
                          <span className="material-symbols-outlined text-xl">chat</span>
                       </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {format(new Date(client.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleViewHistory(client)} title="Histórico" className="text-gold-600 hover:text-gold-800">
                        <span className="material-symbols-outlined">history</span>
                      </button>
                      <button onClick={() => handleOpenForm(client)} title="Editar" className="text-blue-500 hover:text-blue-700">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => handleDeleteClient(client.id)} title="Excluir" className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
            {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</div>
            ) : (
                filteredClients.map(client => (
                    <div key={client.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-800">{client.name}</h3>
                                <p className="text-xs text-gray-500">Desde: {format(new Date(client.created_at), 'dd/MM/yy')}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleViewHistory(client)} className="p-2 bg-gold-50 text-gold-700 rounded-full"><span className="material-symbols-outlined text-lg">history</span></button>
                                <button onClick={() => handleOpenForm(client)} className="p-2 bg-blue-50 text-blue-600 rounded-full"><span className="material-symbols-outlined text-lg">edit</span></button>
                                <button onClick={() => handleDeleteClient(client.id)} className="p-2 bg-red-50 text-red-500 rounded-full"><span className="material-symbols-outlined text-lg">delete</span></button>
                            </div>
                        </div>
                        
                        <button 
                             onClick={() => handleWhatsApp(client)}
                             className="flex items-center justify-center gap-2 bg-green-50 text-green-700 p-2 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors border border-green-100"
                        >
                             <span className="material-symbols-outlined text-lg">chat</span>
                             Enviar Mensagem
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <h3 className="font-serif text-2xl font-bold mb-6 text-gold-900">{editingClient ? 'Editar' : 'Novo'} Cliente</h3>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold-700 uppercase">Nome Completo</label>
                <input required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold-700 uppercase">WhatsApp</label>
                <input required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="(00) 00000-0000" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-lg shadow hover:bg-gold-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gold-100 flex justify-between items-center bg-gold-50 shrink-0">
              <div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-gold-900">{viewingHistory.client.name}</h3>
                <p className="text-gray-500 text-xs md:text-sm">Histórico de Agendamentos</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Total Spent Badge */}
            <div className="p-4 bg-gold-100/30 flex justify-between items-center border-b border-gold-100">
                <span className="font-bold text-gold-800 text-sm uppercase">Total Gasto</span>
                <span className="font-serif text-xl font-bold text-gold-900">R$ {viewingHistory.totalSpent.toFixed(2)}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {viewingHistory.appointments.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Nenhum histórico encontrado.</p>
              ) : (
                viewingHistory.appointments.map(appt => {
                  const svc = getServiceData(appt.service_id);
                  return (
                    <div key={appt.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="font-bold text-gold-900">{svc ? svc.name : 'Serviço excluído'}</p>
                        <p className="text-xs md:text-sm text-gray-500 capitalize flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(appt.start_time))}
                        </p>
                        {svc && <p className="text-xs font-bold text-gray-400 mt-1">R$ {svc.price.toFixed(2)}</p>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                        appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appt.status === 'CONFIRMED' ? 'Confirmado' : 
                         appt.status === 'CANCELLED' ? 'Cancelado' : 
                         appt.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};