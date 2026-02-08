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
  const [viewingHistory, setViewingHistory] = useState<{ client: Client, appointments: Appointment[] } | null>(null);
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

  const handleViewHistory = async (client: Client) => {
    const history = await db.getClientHistory(client.id);
    // Sort by date desc
    history.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    setViewingHistory({ client, appointments: history });
    setIsHistoryOpen(true);
  };

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço excluído';

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
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gold-200 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
          />
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-gold-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gold-600 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span>
          Novo Cliente
        </button>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
        <table className="w-full text-left">
          <thead className="bg-gold-50 border-b border-gold-200">
            <tr>
              <th className="px-6 py-4 font-serif font-bold text-gold-900">Cliente</th>
              <th className="px-6 py-4 font-serif font-bold text-gold-900">Contato</th>
              <th className="px-6 py-4 font-serif font-bold text-gold-900">Desde</th>
              <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum cliente encontrado.</td>
              </tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-sm">chat</span>
                    {client.whatsapp}
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

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <h3 className="font-serif text-2xl font-bold mb-6 text-gold-900">{editingClient ? 'Editar' : 'Novo'} Cliente</h3>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold-700 uppercase">Nome Completo</label>
                <input 
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold-700 uppercase">WhatsApp</label>
                <input 
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-fade-in">
            <div className="p-6 border-b border-gold-100 flex justify-between items-center bg-gold-50 rounded-t-2xl">
              <div>
                <h3 className="font-serif text-2xl font-bold text-gold-900">{viewingHistory.client.name}</h3>
                <p className="text-gray-500 text-sm">Histórico de Agendamentos</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {viewingHistory.appointments.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Nenhum histórico encontrado para este cliente.</p>
              ) : (
                viewingHistory.appointments.map(appt => (
                  <div key={appt.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gold-900">{getServiceName(appt.service_id)}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(appt.start_time))}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {appt.status === 'CONFIRMED' ? 'Confirmado' : 
                       appt.status === 'CANCELLED' ? 'Cancelado' : 
                       appt.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};