
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/mockDb';
import { Service, Salon } from '../../types';

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', description: '', image_url: '' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setServices(await db.getServices());
    setCurrentSalon(await db.getSalon());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    // Safety check - should always be true if page is accessible
    if (!currentSalon) return;

    const newService: Service = {
        id: editingService ? editingService.id : crypto.randomUUID(),
        salon_id: currentSalon.id, // Dynamic ID
        name: formData.name,
        price: Number(formData.price),
        duration_min: Number(formData.duration),
        description: formData.description,
        image_url: formData.image_url || 'https://picsum.photos/400/400'
    };

    if (editingService) {
        await db.updateService(newService);
    } else {
        await db.addService(newService);
    }
    await loadData();
    closeModal();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await db.uploadImage(file);
        setFormData(prev => ({ ...prev, image_url: url }));
      } catch (error) {
        alert('Erro ao fazer upload da imagem.');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const openModal = (service?: Service) => {
    if (service) {
        setEditingService(service);
        setFormData({
            name: service.name,
            price: service.price.toString(),
            duration: service.duration_min.toString(),
            description: service.description,
            image_url: service.image_url
        });
    } else {
        setEditingService(null);
        setFormData({ name: '', price: '', duration: '', description: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza?')) {
          await db.deleteService(id);
          await loadData();
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold text-gold-900">Gerenciar Serviços</h3>
          <button 
            onClick={() => openModal()}
            className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
          >
              <span className="material-symbols-outlined">add</span>
              Novo Serviço
          </button>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
          <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gold-50 border-b border-gold-200">
                      <tr>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Imagem</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Nome</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Preço</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Duração</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody>
                      {services.map(s => (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                      <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                                  </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                              <td className="px-6 py-4 text-gold-700 font-bold whitespace-nowrap">R$ {s.price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{s.duration_min} min</td>
                              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  <button onClick={() => openModal(s)} className="text-blue-500 hover:text-blue-700">
                                      <span className="material-symbols-outlined">edit</span>
                                  </button>
                                  <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600">
                                      <span className="material-symbols-outlined">delete</span>
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                  <h3 className="font-serif text-2xl font-bold mb-6 text-gold-900">{editingService ? 'Editar' : 'Novo'} Serviço</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      
                      {/* Image Upload */}
                      <div className="flex justify-center mb-6">
                          <div 
                              className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold-500 transition-colors bg-gray-50 group"
                              onClick={() => fileInputRef.current?.click()}
                          >
                              {formData.image_url ? (
                                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                  <span className="material-symbols-outlined text-gray-400 text-3xl">add_photo_alternate</span>
                              )}
                              {isUploading && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                  </div>
                              )}
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="material-symbols-outlined text-white">edit</span>
                              </div>
                          </div>
                          <input 
                              type="file" 
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="hidden"
                          />
                      </div>

                      <input 
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" 
                        placeholder="Nome do Serviço" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" 
                            placeholder="Preço (R$)" 
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            required
                        />
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" 
                            placeholder="Minutos" 
                            type="number"
                            value={formData.duration}
                            onChange={e => setFormData({...formData, duration: e.target.value})}
                            required
                        />
                      </div>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" 
                        placeholder="Descrição curta"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={closeModal} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-lg shadow hover:bg-gold-600 disabled:opacity-50">Salvar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
