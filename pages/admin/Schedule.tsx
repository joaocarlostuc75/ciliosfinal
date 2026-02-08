import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Appointment, Service, Client, BlockedTime, AppointmentStatus, Salon } from '../../types';
import { 
    format, addDays, isSameDay, addMinutes, areIntervalsOverlapping, 
    endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, 
    startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, isBefore
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Schedule: React.FC = () => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  // Modals
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  
  // Action State
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Forms
  const [blockFormData, setBlockFormData] = useState({ 
    startDate: '', startTime: '09:00', endDate: '', endTime: '18:00', reason: 'Ausência' 
  });
  const [rescheduleFormData, setRescheduleFormData] = useState({ date: '', time: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setSalon(await db.getSalon());
    setAppointments(await db.getAppointments());
    setBlockedTimes(await db.getBlockedTimes());
    setServices(await db.getServices());
    setClients(await db.getClients());
  };

  // --- Helper Functions ---
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown';
  const getClientData = (id: string) => clients.find(c => c.id === id);

  // --- Actions ---
  const handleNotifyClient = (appt: Appointment) => {
    if (!salon) return;
    const client = getClientData(appt.client_id);
    if (!client) return;

    const serviceName = getServiceName(appt.service_id);
    const dateStr = format(new Date(appt.start_time), "dd/MM");
    const timeStr = format(new Date(appt.start_time), "HH:mm");
    
    // Formal but friendly message
    const msg = `Olá ${client.name}, tudo bem? 🌸\n\nPassando para confirmar seu agendamento de *${serviceName}* no dia *${dateStr}* às *${timeStr}* na ${salon.name}.\n\nQualquer dúvida, estamos à disposição!\nAtenciosamente.`;
    
    window.open(`https://wa.me/55${client.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    if(confirm(`Alterar status para ${status}?`)) {
      await db.updateAppointmentStatus(id, status);
      await loadData();
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir permanentemente este agendamento?')) {
      await db.deleteAppointment(id);
      await loadData();
    }
  };

  // --- Reschedule & Block Logic ---
  const openBlockModal = () => {
      const todayStr = format(selectedDate, 'yyyy-MM-dd');
      setBlockFormData({ 
          startDate: todayStr, startTime: '09:00', endDate: todayStr, endTime: '10:00', reason: '' 
      });
      setIsBlockModalOpen(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${blockFormData.startDate}T${blockFormData.startTime}`);
    const end = new Date(`${blockFormData.endDate}T${blockFormData.endTime}`);

    if (end <= start) { alert('A data final deve ser maior que a inicial.'); return; }

    await db.addBlockedTime({
      id: crypto.randomUUID(),
      salon_id: 'e2c0a884-6d9e-4861-a9d5-17154238805f',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: blockFormData.reason
    });
    await loadData();
    setIsBlockModalOpen(false);
  };

  const handleDeleteBlock = async (id: string) => {
    if(confirm('Remover este bloqueio?')) {
      await db.deleteBlockedTime(id);
      await loadData();
    }
  };

  const handleOpenReschedule = (appt: Appointment) => {
    setEditingAppointment(appt);
    setRescheduleFormData({
      date: format(new Date(appt.start_time), 'yyyy-MM-dd'),
      time: format(new Date(appt.start_time), 'HH:mm')
    });
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingAppointment) return;
    try {
      const newStart = new Date(`${rescheduleFormData.date}T${rescheduleFormData.time}`);
      const service = services.find(s => s.id === editingAppointment.service_id);
      const duration = service ? service.duration_min : 60;
      const newEnd = addMinutes(newStart, duration);
      await db.updateAppointment({
        ...editingAppointment,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        status: AppointmentStatus.CONFIRMED 
      });
      await loadData();
      setIsRescheduleModalOpen(false);
      setEditingAppointment(null);
    } catch (error) { alert((error as Error).message); }
  };

  // --- Calendar Data Generation ---
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
        const newDate = subMonths(currentMonth, 1);
        setCurrentMonth(newDate);
    } else {
        const newDate = addMonths(currentMonth, 1);
        // Limit to Dec 2026
        if (newDate.getFullYear() > 2026) return;
        setCurrentMonth(newDate);
    }
  };

  // --- Timeline Construction ---
  const dailyAppointments = appointments
    .filter(a => isSameDay(new Date(a.start_time), selectedDate))
    .map(a => ({ ...a, type: 'appointment' as const }));

  const viewStart = new Date(selectedDate); viewStart.setHours(0,0,0,0);
  const viewEnd = endOfDay(selectedDate);

  const dailyBlocks = blockedTimes
    .filter(b => {
        const blockStart = new Date(b.start_time);
        const blockEnd = new Date(b.end_time);
        return areIntervalsOverlapping({ start: blockStart, end: blockEnd }, { start: viewStart, end: viewEnd });
    })
    .map(b => ({ ...b, type: 'block' as const }));

  const timelineItems = [...dailyAppointments, ...dailyBlocks].sort((a, b) => {
     return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6">
       
       {/* Left Column: Calendar (Desktop) / Top (Mobile) */}
       <div className="xl:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Calendar Widget */}
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gold-100">
             {/* Calendar Header */}
             <div className="flex items-center justify-between mb-4">
                <button onClick={() => handleMonthChange('prev')} className="p-1 hover:bg-gray-100 rounded-full text-gold-700">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 className="font-serif font-bold text-gold-900 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <button 
                    onClick={() => handleMonthChange('next')} 
                    className="p-1 hover:bg-gray-100 rounded-full text-gold-700 disabled:opacity-30"
                    disabled={currentMonth.getFullYear() === 2026 && currentMonth.getMonth() === 11}
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
             </div>

             {/* Days Grid */}
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
                 {['D','S','T','Q','Q','S','S'].map((d, i) => (
                     <span key={i} className="text-[10px] font-bold text-gray-400">{d}</span>
                 ))}
             </div>
             <div className="grid grid-cols-7 gap-1">
                 {generateCalendarDays().map((day, idx) => {
                     const isSelected = isSameDay(day, selectedDate);
                     const isCurrentMonth = isSameMonth(day, currentMonth);
                     const hasAppt = appointments.some(a => isSameDay(new Date(a.start_time), day) && a.status !== AppointmentStatus.CANCELLED);
                     
                     return (
                         <button
                            key={idx}
                            onClick={() => { setSelectedDate(day); setCurrentMonth(day); }}
                            className={`
                                h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all relative
                                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                ${isSelected ? 'bg-gold-500 text-white shadow-md' : 'hover:bg-gold-50'}
                            `}
                         >
                             {format(day, 'd')}
                             {hasAppt && !isSelected && (
                                 <span className="absolute bottom-1 w-1 h-1 bg-gold-400 rounded-full"></span>
                             )}
                         </button>
                     );
                 })}
             </div>
          </div>

          {/* Quick Actions (Desktop/Tablet) */}
          <div className="hidden md:flex flex-col gap-3">
             <button 
                onClick={openBlockModal}
                className="bg-gray-800 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md"
             >
                <span className="material-symbols-outlined text-sm">block</span>
                Bloquear Horário
             </button>
          </div>
       </div>

       {/* Right/Bottom Column: Timeline List */}
       <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden h-[600px] xl:h-auto">
            {/* List Header */}
            <div className="p-4 border-b border-gold-100 bg-gold-50/30 flex justify-between items-center sticky top-0 z-10 backdrop-blur">
                <div>
                    <h3 className="font-serif font-bold text-xl text-gold-900 capitalize">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {timelineItems.filter(i => i.type === 'appointment').length} agendamentos
                    </p>
                </div>
                {/* Mobile Action Button */}
                <button onClick={openBlockModal} className="md:hidden text-gray-600 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                    <span className="material-symbols-outlined">block</span>
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {timelineItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_available</span>
                        <p>Nenhum agendamento para este dia.</p>
                    </div>
                ) : (
                    timelineItems.map((item) => {
                        if (item.type === 'block') {
                            const block = item as BlockedTime & { type: 'block' };
                            return (
                                <div key={block.id} className="flex gap-3 p-3 rounded-xl bg-gray-100 border border-gray-200 items-center opacity-75">
                                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] border-r border-gray-300 pr-3 text-gray-500">
                                        <span className="font-bold text-sm">{format(new Date(block.start_time), 'HH:mm')}</span>
                                        <span className="text-[10px]">{format(new Date(block.end_time), 'HH:mm')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs flex items-center gap-2">
                                           <span className="material-symbols-outlined text-sm">lock</span>
                                           Bloqueado
                                        </h4>
                                        <p className="text-gray-500 italic text-xs truncate">{block.reason || 'Sem motivo'}</p>
                                    </div>
                                    <button onClick={() => handleDeleteBlock(block.id)} className="text-red-400 hover:text-red-600 p-1">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            );
                        } else {
                            const appt = item as Appointment & { type: 'appointment' };
                            const client = getClientData(appt.client_id);
                            const isCancelled = appt.status === AppointmentStatus.CANCELLED;
                            
                            return (
                                <div key={appt.id} className={`group relative flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition-all ${
                                    isCancelled ? 'bg-red-50 border-red-100 opacity-60' : 'bg-white hover:bg-gold-50/30 border-gray-100 hover:border-gold-200 shadow-sm hover:shadow-md'
                                }`}>
                                    {/* Time Column */}
                                    <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 sm:min-w-[4rem] sm:border-r border-gold-100 sm:pr-3">
                                        <span className={`text-lg font-bold ${isCancelled ? 'text-red-400 line-through' : 'text-gold-900'}`}>
                                            {format(new Date(appt.start_time), 'HH:mm')}
                                        </span>
                                        <span className="text-xs text-gray-400 hidden sm:block">{format(new Date(appt.end_time), 'HH:mm')}</span>
                                    </div>
                                    
                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-800 text-base truncate">{client?.name || 'Cliente'}</h4>
                                            {isCancelled && <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">CANCELADO</span>}
                                        </div>
                                        <p className="text-gold-600 font-medium text-sm truncate">{getServiceName(appt.service_id)}</p>
                                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">phone</span>
                                            {client?.whatsapp}
                                        </p>
                                    </div>

                                    {/* Action Bar (Responsive) */}
                                    <div className="flex items-center justify-end gap-1 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        {!isCancelled && (
                                            <>
                                                <button onClick={() => handleNotifyClient(appt)} title="Notificar WhatsApp" className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xl">whatsapp</span>
                                                </button>
                                                <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.COMPLETED)} title="Concluir" className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xl">check_small</span>
                                                </button>
                                                <button onClick={() => handleOpenReschedule(appt)} title="Remarcar" className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xl">edit_calendar</span>
                                                </button>
                                                <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CANCELLED)} title="Cancelar" className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xl">block</span>
                                                </button>
                                            </>
                                        )}
                                        {isCancelled && (
                                            <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CONFIRMED)} title="Restaurar" className="p-2 text-green-500 hover:bg-green-50 rounded-full">
                                                <span className="material-symbols-outlined text-xl">undo</span>
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteAppointment(appt.id)} title="Excluir" className="p-2 text-gray-300 hover:bg-gray-100 hover:text-red-600 rounded-full ml-1">
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    })
                )}
            </div>
       </div>

       {/* Modals remain mostly same, just ensuring z-index and padding */}
       {/* Block Modal */}
       {isBlockModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                  <h3 className="font-serif text-xl font-bold mb-4">Bloquear Período</h3>
                  <form onSubmit={handleSaveBlock} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500">Início</label>
                             <div className="flex gap-2">
                                <input type="date" required value={blockFormData.startDate} onChange={e => setBlockFormData({...blockFormData, startDate: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                                <input type="time" required value={blockFormData.startTime} onChange={e => setBlockFormData({...blockFormData, startTime: e.target.value})} className="w-20 border rounded-lg p-2 text-sm" />
                             </div>
                          </div>
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500">Fim</label>
                             <div className="flex gap-2">
                                <input type="date" required value={blockFormData.endDate} onChange={e => setBlockFormData({...blockFormData, endDate: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                                <input type="time" required value={blockFormData.endTime} onChange={e => setBlockFormData({...blockFormData, endTime: e.target.value})} className="w-20 border rounded-lg p-2 text-sm" />
                             </div>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Motivo</label>
                          <input type="text" required value={blockFormData.reason} onChange={e => setBlockFormData({...blockFormData, reason: e.target.value})} className="w-full border rounded-lg p-2 mt-1 text-sm" placeholder="Ex: Férias" />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setIsBlockModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black text-sm">Bloquear</button>
                      </div>
                  </form>
              </div>
           </div>
       )}

       {/* Reschedule Modal */}
       {isRescheduleModalOpen && editingAppointment && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                  <h3 className="font-serif text-xl font-bold mb-4">Remarcar</h3>
                  <form onSubmit={handleSaveReschedule} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">Nova Data</label>
                          <input type="date" required value={rescheduleFormData.date} onChange={e => setRescheduleFormData({...rescheduleFormData, date: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Novo Horário</label>
                          <input type="time" required value={rescheduleFormData.time} onChange={e => setRescheduleFormData({...rescheduleFormData, time: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-gold-500 text-white font-bold rounded-lg hover:bg-gold-600 text-sm">Salvar</button>
                      </div>
                  </form>
              </div>
           </div>
       )}
    </div>
  );
};