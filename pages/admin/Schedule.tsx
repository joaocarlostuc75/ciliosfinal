import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Appointment, Service, Client, BlockedTime, AppointmentStatus } from '../../types';
import { format, startOfToday, addDays, isSameDay, addMinutes, areIntervalsOverlapping, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Schedule: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfToday());

  // Modals
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  
  // Action State
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Updated Block State for Date Ranges
  const [blockFormData, setBlockFormData] = useState({ 
    startDate: '', 
    startTime: '09:00', 
    endDate: '', 
    endTime: '18:00', 
    reason: 'Ausência' 
  });
  
  const [rescheduleFormData, setRescheduleFormData] = useState({ date: '', time: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAppointments(db.getAppointments());
    setBlockedTimes(db.getBlockedTimes());
    setServices(db.getServices());
    setClients(db.getClients());
  };

  const openBlockModal = () => {
      const todayStr = format(selectedDate, 'yyyy-MM-dd');
      setBlockFormData({ 
          startDate: todayStr, 
          startTime: '09:00', 
          endDate: todayStr, 
          endTime: '10:00', 
          reason: '' 
      });
      setIsBlockModalOpen(true);
  };

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown';
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente';

  // --- Blocking Logic ---
  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${blockFormData.startDate}T${blockFormData.startTime}`);
    const end = new Date(`${blockFormData.endDate}T${blockFormData.endTime}`);

    if (end <= start) {
        alert('A data/hora final deve ser maior que a inicial.');
        return;
    }

    db.addBlockedTime({
      id: crypto.randomUUID(),
      salon_id: 'salon-123',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: blockFormData.reason
    });
    
    loadData();
    setIsBlockModalOpen(false);
  };

  const handleDeleteBlock = (id: string) => {
    if(confirm('Remover este bloqueio?')) {
      db.deleteBlockedTime(id);
      loadData();
    }
  };

  // --- Appointment Actions ---
  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    if(confirm(`Alterar status para ${status}?`)) {
      db.updateAppointmentStatus(id, status);
      loadData();
    }
  };

  const handleDeleteAppointment = (id: string) => {
    if(confirm('Tem certeza que deseja excluir permanentemente este agendamento?')) {
      db.deleteAppointment(id);
      loadData();
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

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingAppointment) return;

    try {
      const newStart = new Date(`${rescheduleFormData.date}T${rescheduleFormData.time}`);
      const service = services.find(s => s.id === editingAppointment.service_id);
      const duration = service ? service.duration_min : 60;
      const newEnd = addMinutes(newStart, duration);

      db.updateAppointment({
        ...editingAppointment,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        status: AppointmentStatus.CONFIRMED // Reset to confirmed if it was cancelled
      });
      
      loadData();
      setIsRescheduleModalOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  // --- Render Lists ---
  const dailyAppointments = appointments
    .filter(a => isSameDay(new Date(a.start_time), selectedDate))
    .map(a => ({ ...a, type: 'appointment' as const }));

  // Check if any block overlaps with the selected Day (whole day)
  const viewStart = startOfDay(selectedDate);
  const viewEnd = endOfDay(selectedDate);

  const dailyBlocks = blockedTimes
    .filter(b => {
        const blockStart = new Date(b.start_time);
        const blockEnd = new Date(b.end_time);
        return areIntervalsOverlapping({ start: blockStart, end: blockEnd }, { start: viewStart, end: viewEnd });
    })
    .map(b => ({ ...b, type: 'block' as const }));

  const timelineItems = [...dailyAppointments, ...dailyBlocks].sort((a, b) => {
     // Sort logic: if it's a multi-day block starting before today, put it at top (00:00 effective)
     const timeA = new Date(a.start_time).getTime();
     const timeB = new Date(b.start_time).getTime();
     return timeA - timeB;
  });

  return (
    <div className="h-full flex flex-col gap-6">
       
       {/* Date Navigator & Actions */}
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-gold-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 hover:bg-gray-100 rounded-full">
               <span className="material-symbols-outlined">chevron_left</span>
             </button>
             <div className="text-center w-48">
               <h2 className="font-serif text-xl font-bold text-gold-900 capitalize">{format(selectedDate, "EEE, dd MMM", { locale: ptBR })}</h2>
             </div>
             <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-full">
               <span className="material-symbols-outlined">chevron_right</span>
             </button>
          </div>
          
          <button 
            onClick={openBlockModal}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">block</span>
            Bloquear Período
          </button>
       </div>

       {/* Schedule List */}
       <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden flex flex-col">
            {timelineItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p>Agenda livre para este dia.</p>
                </div>
            ) : (
                <div className="overflow-y-auto p-4 space-y-4">
                    {timelineItems.map((item, idx) => {
                        if (item.type === 'block') {
                            const block = item as BlockedTime & { type: 'block' };
                            const isMultiDay = !isSameDay(new Date(block.start_time), new Date(block.end_time));
                            return (
                                <div key={`block-${block.id}`} className="flex gap-4 p-4 rounded-xl bg-gray-100 border border-gray-200 items-center opacity-75">
                                    <div className="flex flex-col items-center justify-center min-w-[4rem] border-r border-gray-300 pr-4 text-gray-500">
                                        <span className="font-bold">{format(new Date(block.start_time), 'HH:mm')}</span>
                                        {isMultiDay ? (
                                            <span className="text-[10px] uppercase font-bold text-red-400 mt-1">Até {format(new Date(block.end_time), 'dd/MM')}</span>
                                        ) : (
                                            <span className="text-xs">{format(new Date(block.end_time), 'HH:mm')}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">
                                           <span className="material-symbols-outlined text-sm">lock</span>
                                           {isMultiDay ? 'Ausência / Bloqueio Longo' : 'Bloqueado'}
                                        </h4>
                                        <p className="text-gray-500 italic text-sm">{block.reason}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            De {format(new Date(block.start_time), "dd/MM 'às' HH:mm")} até {format(new Date(block.end_time), "dd/MM 'às' HH:mm")}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDeleteBlock(block.id)} className="text-red-400 hover:text-red-600">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            );
                        } else {
                            const appt = item as Appointment & { type: 'appointment' };
                            const isCancelled = appt.status === AppointmentStatus.CANCELLED;
                            return (
                                <div key={appt.id} className={`relative flex gap-4 p-4 rounded-xl border transition-all group ${
                                    isCancelled ? 'bg-red-50 border-red-100 opacity-60' : 'bg-white hover:bg-gold-50/50 border-transparent hover:border-gold-200'
                                }`}>
                                    <div className="flex flex-col items-center justify-center min-w-[4rem] border-r border-gold-100 pr-4">
                                        <span className={`text-lg font-bold ${isCancelled ? 'text-red-400 line-through' : 'text-gold-900'}`}>
                                            {format(new Date(appt.start_time), 'HH:mm')}
                                        </span>
                                        <span className="text-xs text-gray-400">{format(new Date(appt.end_time), 'HH:mm')}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-800 text-lg">{getClientName(appt.client_id)}</h4>
                                            {isCancelled && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">Cancelado</span>}
                                        </div>
                                        <p className="text-gold-600 font-medium">{getServiceName(appt.service_id)}</p>
                                    </div>

                                    {/* Actions Toolbar */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-sm p-1 rounded-full border border-gray-100">
                                        {!isCancelled && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.COMPLETED)} title="Concluir" className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
                                                    <span className="material-symbols-outlined text-xl">check_small</span>
                                                </button>
                                                <button onClick={() => handleOpenReschedule(appt)} title="Remarcar" className="p-2 text-orange-500 hover:bg-orange-50 rounded-full">
                                                    <span className="material-symbols-outlined text-xl">edit_calendar</span>
                                                </button>
                                                <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CANCELLED)} title="Cancelar" className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                                    <span className="material-symbols-outlined text-xl">block</span>
                                                </button>
                                            </>
                                        )}
                                        {isCancelled && (
                                             <button onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CONFIRMED)} title="Restaurar" className="p-2 text-green-500 hover:bg-green-50 rounded-full">
                                                <span className="material-symbols-outlined text-xl">undo</span>
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteAppointment(appt.id)} title="Excluir Definitivamente" className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 rounded-full border-l border-gray-100 ml-1">
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            )}
       </div>

       {/* Block Time Modal with Date Range */}
       {isBlockModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                  <h3 className="font-serif text-xl font-bold mb-4">Bloquear Período</h3>
                  <form onSubmit={handleSaveBlock} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500">Início</label>
                             <div className="flex gap-2">
                                <input type="date" required value={blockFormData.startDate} onChange={e => setBlockFormData({...blockFormData, startDate: e.target.value})} className="w-full border rounded-lg p-2" />
                                <input type="time" required value={blockFormData.startTime} onChange={e => setBlockFormData({...blockFormData, startTime: e.target.value})} className="w-24 border rounded-lg p-2" />
                             </div>
                          </div>
                          
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500">Fim</label>
                             <div className="flex gap-2">
                                <input type="date" required value={blockFormData.endDate} onChange={e => setBlockFormData({...blockFormData, endDate: e.target.value})} className="w-full border rounded-lg p-2" />
                                <input type="time" required value={blockFormData.endTime} onChange={e => setBlockFormData({...blockFormData, endTime: e.target.value})} className="w-24 border rounded-lg p-2" />
                             </div>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Motivo</label>
                          <input type="text" required value={blockFormData.reason} onChange={e => setBlockFormData({...blockFormData, reason: e.target.value})} className="w-full border rounded-lg p-2 mt-1" placeholder="Ex: Férias, Manutenção..." />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setIsBlockModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black">Bloquear</button>
                      </div>
                  </form>
              </div>
           </div>
       )}

       {/* Reschedule Modal */}
       {isRescheduleModalOpen && editingAppointment && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                          <button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-gold-500 text-white font-bold rounded-lg hover:bg-gold-600">Salvar</button>
                      </div>
                  </form>
              </div>
           </div>
       )}

    </div>
  );
};