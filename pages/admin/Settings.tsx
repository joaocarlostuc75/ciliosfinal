
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/mockDb';
import { Salon, DaySchedule, TimeSlot, SubscriptionStatus } from '../../types';
import { differenceInDays } from 'date-fns';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const Settings: React.FC = () => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [formData, setFormData] = useState<Partial<Salon>>({});
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [previewLogo, setPreviewLogo] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true); // Explicit loading state

  // Security Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSalon = async () => {
        setIsLoading(true);
        try {
            const currentSalon = await db.getSalon();
            if (currentSalon) {
                setSalon(currentSalon);
                setFormData(currentSalon);
                setSchedule(currentSalon.opening_hours || []);
                setPreviewLogo(currentSalon.logo_url || '');
                setEmail(currentSalon.owner_email || '');
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            setMessage({ type: 'error', text: 'Falha ao carregar dados.' });
        } finally {
            setIsLoading(false);
        }
    };
    fetchSalon();
  }, []);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'phone') value = formatPhone(value);
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

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
        setMessage({ type: 'error', text: 'Telefone inválido.' });
        return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedSalon = { ...salon, ...formData, opening_hours: schedule } as Salon;
      await db.updateSalon(updatedSalon);
      
      if (email !== salon.owner_email) await db.changeEmail(email);
      if (password) await db.changePassword(password);

      setSalon(updatedSalon);
      setPassword(''); 
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-96 text-gold-600">
          <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
          <p>Carregando configurações...</p>
      </div>
  );

  if (!salon) return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <span className="material-symbols-outlined text-4xl mb-4">error</span>
          <p>Não foi possível carregar os dados do estabelecimento.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-gold-600 font-bold hover:underline">Tentar novamente</button>
      </div>
  );

  const getStatusBadge = () => {
      if (salon.is_lifetime_free) return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Acesso Vitalício</span>;
      if (salon.subscription_status === SubscriptionStatus.TRIAL) {
           const daysUsed = differenceInDays(new Date(), new Date(salon.created_at));
           const remaining = 10 - daysUsed;
           return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Período de Teste ({remaining > 0 ? remaining : 0} dias restantes)</span>;
      }
      if (salon.subscription_status === SubscriptionStatus.ACTIVE) return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Assinatura Ativa</span>;
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Acesso Expirado/Bloqueado</span>;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
       <div className="bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden">
          
          {/* Header */}
          <div className="p-8 border-b border-gold-100 bg-gold-50/30 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
                   <span className="material-symbols-outlined">settings_storefront</span>
                </div>
                <div>
                   <h2 className="font-serif text-2xl font-bold text-gold-900">Configurações</h2>
                   <p className="text-sm text-gray-500">Dados do estabelecimento e conta</p>
                </div>
             </div>
             <div>{getStatusBadge()}</div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
             {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                   message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                   <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                   <span className="font-medium">{message.text}</span>
                </div>
             )}

             {/* Basic Info */}
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                   <div className="relative w-48 h-48 rounded-full border-4 border-gold-200 shadow-xl overflow-hidden bg-gray-50 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {previewLogo ? (
                          <img src={previewLogo} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                              <span className="text-xs">Logotipo</span>
                          </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                      </div>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                   <p className="text-xs text-center text-gray-400">Clique para alterar</p>
                </div>

                <div className="flex-1 w-full space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Nome do estabelecimento</label>
                         <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Telefone (WhatsApp)</label>
                         <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 transition-all" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Endereço Completo</label>
                      <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500 transition-all" />
                   </div>
                </div>
             </div>

             {/* Account Security Section */}
             <div className="pt-8 border-t border-gold-100">
                <h3 className="font-serif text-xl font-bold text-gold-900 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">security</span>
                    Segurança da Conta
                </h3>
                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">E-mail de Acesso</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold-800 uppercase tracking-wider">Nova Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Preencha apenas se quiser alterar" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-gold-500" />
                    </div>
                </div>
             </div>

             {/* Opening Hours */}
             <div className="pt-8 border-t border-gold-100">
                <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Horário de Funcionamento</h3>
                <div className="space-y-4">
                    {schedule.map((day, dayIndex) => (
                        <div key={day.dayOfWeek} className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-colors ${day.isOpen ? 'bg-white border-gold-200' : 'bg-gray-50 border-transparent opacity-75'}`}>
                            <div className="w-32 flex items-center gap-3">
                                <input type="checkbox" checked={day.isOpen} onChange={() => handleToggleDay(dayIndex)} className="w-5 h-5 accent-gold-500 cursor-pointer" />
                                <span className={`font-bold ${day.isOpen ? 'text-gold-900' : 'text-gray-400'}`}>{DAYS_OF_WEEK[day.dayOfWeek]}</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                {day.isOpen ? (
                                    <>
                                        {day.slots.map((slot, slotIndex) => (
                                            <div key={slotIndex} className="flex items-center gap-2">
                                                <input type="time" value={slot.start} onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'start', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                                                <span className="text-gray-400">até</span>
                                                <input type="time" value={slot.end} onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'end', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                                                <button type="button" onClick={() => handleRemoveSlot(dayIndex, slotIndex)} className="text-red-300 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddSlot(dayIndex)} className="text-xs font-bold text-gold-600 flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-sm">add</span> Adicionar Intervalo</button>
                                    </>
                                ) : <span className="text-sm text-gray-400 italic py-1">Fechado</span>}
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="pt-6 border-t border-gold-100 flex justify-end">
                <button type="submit" disabled={isSaving} className="bg-gold-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gold-600 transition-all flex items-center gap-2">
                   {isSaving ? 'Salvando...' : <><span className="material-symbols-outlined">save</span> Salvar Alterações</>}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};
