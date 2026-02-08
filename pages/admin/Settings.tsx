import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/mockDb';
import { Salon, DaySchedule, TimeSlot } from '../../types';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const Settings: React.FC = () => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [formData, setFormData] = useState<Partial<Salon>>({});
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [previewLogo, setPreviewLogo] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSalon = async () => {
        const currentSalon = await db.getSalon();
        setSalon(currentSalon);
        setFormData(currentSalon);
        setSchedule(currentSalon.opening_hours || []);
        setPreviewLogo(currentSalon.logo_url);
    };
    fetchSalon();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewLogo(result);
        setFormData(prev => ({ ...prev, logo_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Schedule Editor Logic
  const handleToggleDay = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].isOpen = !newSchedule[dayIndex].isOpen;
    if (newSchedule[dayIndex].isOpen && newSchedule[dayIndex].slots.length === 0) {
        newSchedule[dayIndex].slots.push({ start: '09:00', end: '18:00' });
    }
    setSchedule(newSchedule);
  };

  const handleAddSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({ start: '12:00', end: '13:00' });
    setSchedule(newSchedule);
  };

  const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const handleSlotChange = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedSalon = { ...salon, ...formData, opening_hours: schedule } as Salon;
      await db.updateSalon(updatedSalon);
      setSalon(updatedSalon);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!salon) return <div>Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
       <div className="bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden">
          <div className="p-8 border-b border-gold-100 bg-gold-50/30">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
                   <span className="material-symbols-outlined">settings_storefront</span>
                </div>
                <div>
                   <h2 className="font-serif text-2xl font-bold text-gold-900">Perfil do Estabelecimento</h2>
                   <p className="text-sm text-gray-500">Gerencie as informações visíveis para seus clientes</p>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
             {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                   message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                   <span className="material-symbols-outlined">
                      {message.type === 'success' ? 'check_circle' : 'error'}
                   </span>
                   <span className="font-medium">{message.text}</span>
                </div>
             )}

             {/* Basic Info */}
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                   <div className="relative w-48 h-48 rounded-full border-4 border-gold-200 shadow-xl overflow-hidden bg-gray-50 mb-4 group">
                      <img 
                        src={previewLogo} 
                        alt="Logo Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                      </div>
                   </div>
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                   />
                   <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gold-600 font-bold text-sm hover:underline"
                   >
                      Alterar Logotipo
                   </button>
                </div>

                <div className="flex-1 w-full space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Nome do estabelecimento</label>
                         <input 
                            type="text" 
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Telefone (WhatsApp)</label>
                         <input 
                            type="text" 
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Endereço Completo</label>
                      <input 
                         type="text" 
                         name="address"
                         value={formData.address || ''}
                         onChange={handleChange}
                         className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                      />
                   </div>
                </div>
             </div>

             {/* Opening Hours Editor */}
             <div className="pt-8 border-t border-gold-100">
                <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Horário de Funcionamento</h3>
                <div className="space-y-4">
                    {schedule.map((day, dayIndex) => (
                        <div key={day.dayOfWeek} className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-colors ${day.isOpen ? 'bg-white border-gold-200' : 'bg-gray-50 border-transparent opacity-75'}`}>
                            <div className="w-32 flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={day.isOpen} 
                                    onChange={() => handleToggleDay(dayIndex)}
                                    className="w-5 h-5 accent-gold-500 rounded cursor-pointer"
                                />
                                <span className={`font-bold ${day.isOpen ? 'text-gold-900' : 'text-gray-400'}`}>
                                    {DAYS_OF_WEEK[day.dayOfWeek]}
                                </span>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-2">
                                {day.isOpen ? (
                                    <>
                                        {day.slots.map((slot, slotIndex) => (
                                            <div key={slotIndex} className="flex items-center gap-2">
                                                <input 
                                                    type="time" 
                                                    value={slot.start} 
                                                    onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'start', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-gold-500"
                                                />
                                                <span className="text-gray-400">até</span>
                                                <input 
                                                    type="time" 
                                                    value={slot.end} 
                                                    onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'end', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-gold-500"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                                                    className="text-red-300 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            type="button" 
                                            onClick={() => handleAddSlot(dayIndex)}
                                            className="text-xs font-bold text-gold-600 hover:text-gold-800 flex items-center gap-1 w-fit"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                            Adicionar Intervalo
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-400 italic py-1">Fechado</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="pt-6 border-t border-gold-100 flex justify-end">
                <button 
                   type="submit" 
                   disabled={isSaving}
                   className="bg-gold-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gold-600 transition-all disabled:opacity-70 flex items-center gap-2"
                >
                   {isSaving ? 'Salvando...' : (
                      <>
                         <span className="material-symbols-outlined">save</span>
                         Salvar Alterações
                      </>
                   )}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};