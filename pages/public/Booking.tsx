
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, AppointmentStatus, Salon, DaySchedule } from '../../types';
import { 
    format, addMinutes, isBefore, addDays, areIntervalsOverlapping, 
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
    isSameMonth, isSameDay, addMonths, subMonths, isAfter, startOfDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SlotInfo {
    time: Date;
    isAvailable: boolean;
    reason: 'busy' | 'past' | 'free';
}

export const Booking: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [subscriptionValid, setSubscriptionValid] = useState(true);
  
  // Step 1: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [viewDate, setViewDate] = useState<Date>(() => startOfDay(new Date())); // Controls the calendar month view

  const [allSlots, setAllSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  
  // Step 2: Client Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        const s = await db.getSalon();
        setSalon(s);
        setSubscriptionValid(db.checkSubscriptionValidity(s));

        if (serviceId) {
            const services = await db.getServices();
            const found = services.find(x => x.id === serviceId);
            if (found) setService(found);
        }
    };
    init();
  }, [serviceId]);

  // Generate Slots Logic
  useEffect(() => {
    const fetchSlots = async () => {
        if (!service || !salon) return;

        const slots: SlotInfo[] = [];
        const dayOfWeek = selectedDate.getDay();
        const daySchedule = salon.opening_hours.find(d => d.dayOfWeek === dayOfWeek);

        if (!daySchedule || !daySchedule.isOpen) {
            setAllSlots([]);
            setSelectedSlot(null);
            return;
        }

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const busyTimes = await db.getBusyTimes(salon.id, dateStr);

        daySchedule.slots.forEach(timeRange => {
            const [startHour, startMin] = timeRange.start.split(':').map(Number);
            const [endHour, endMin] = timeRange.end.split(':').map(Number);

            let current = new Date(selectedDate);
            current.setHours(startHour, startMin, 0, 0);

            const rangeEnd = new Date(selectedDate);
            rangeEnd.setHours(endHour, endMin, 0, 0);

            while (isBefore(current, rangeEnd)) {
                const slotEnd = addMinutes(current, service.duration_min);
                
                if (isBefore(rangeEnd, slotEnd)) {
                    current = addMinutes(current, 30);
                    continue;
                }

                const isConflict = busyTimes.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return areIntervalsOverlapping({ start: current, end: slotEnd }, { start: busyStart, end: busyEnd });
                });

                const isPast = isBefore(current, new Date());
                
                slots.push({
                    time: new Date(current),
                    isAvailable: !isConflict && !isPast,
                    reason: isConflict ? 'busy' : isPast ? 'past' : 'free'
                });

                current = addMinutes(current, 30);
            }
        });

        slots.sort((a, b) => a.time.getTime() - b.time.getTime());
        setAllSlots(slots);
        setSelectedSlot(null);
        setSelectionError(null);
    };

    fetchSlots();
  }, [selectedDate, service, salon]);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const handleSlotSelection = (slot: SlotInfo) => {
      if (!slot.isAvailable) {
          if (slot.reason === 'busy') {
              setSelectionError('Horário indisponível.');
          } else if (slot.reason === 'past') {
              setSelectionError('Horário passado.');
          }
          return;
      }
      setSelectionError(null);
      setSelectedSlot(slot.time);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !service || !salon) return;
    if (!subscriptionValid) return;

    if (clientPhone.replace(/\D/g, '').length < 10) {
        alert('Por favor, insira um número de WhatsApp válido.');
        return;
    }

    setLoading(true);

    try {
      const client = await db.createClient({
        id: crypto.randomUUID(),
        salon_id: service.salon_id,
        name: clientName,
        whatsapp: clientPhone,
        created_at: new Date().toISOString()
      });

      const startTime = selectedSlot.toISOString();
      const endTime = addMinutes(selectedSlot, service.duration_min).toISOString();

      await db.createAppointment({
        id: crypto.randomUUID(),
        salon_id: service.salon_id,
        service_id: service.id,
        client_id: client.id,
        start_time: startTime,
        end_time: endTime,
        status: AppointmentStatus.CONFIRMED,
        created_at: new Date().toISOString()
      });

      const msg = `Olá, gostaria de confirmar meu agendamento: ${service.name} para o dia ${format(selectedSlot, "dd/MM 'às' HH:mm")}. Meu nome é ${clientName}.`;
      const waLink = `https://wa.me/55${salon.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
      
      setLoading(false);
      window.open(waLink, '_blank');
      
      navigate(`/my-schedule?phone=${clientPhone}`, { replace: true });

    } catch (error) {
      alert((error as Error).message);
      setLoading(false);
    }
  };

  // --- Calendar Logic ---
  const generateCalendarDays = () => {
      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const isDayDisabled = (day: Date) => {
      const today = startOfDay(new Date());
      // 1. Disable past days
      if (isBefore(day, today)) return true;
      
      // 2. Disable days after the end of the CURRENT month (strict adherence to prompt)
      // "só permita agendamentos até o último dia útil do mês vigente"
      const limitDate = endOfMonth(today); 
      if (isAfter(day, limitDate)) return true;

      // 3. Disable closed days from salon config
      const dayConfig = salon?.opening_hours.find(d => d.dayOfWeek === day.getDay());
      if (!dayConfig?.isOpen) return true;

      return false;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
          const newDate = subMonths(viewDate, 1);
          // Don't allow going back too far if needed, but generic navigation is fine
          setViewDate(newDate);
      } else {
          setViewDate(addMonths(viewDate, 1));
      }
  };

  if (!service) return <div className="p-8 text-center mt-10">Carregando detalhes...</div>;

  return (
    <div className="min-h-screen bg-luxury-light flex flex-col">
      {/* Navbar */}
      <nav className="p-4 flex items-center border-b border-gold-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-all">
        <button 
          onClick={() => step === 1 ? navigate(-1) : setStep(1)} 
          className="p-2 -ml-2 text-gold-700 hover:bg-gold-50 rounded-full transition-colors active:scale-95"
        >
           <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <span className="font-serif font-bold text-gold-900 ml-2 text-lg">
            {step === 1 ? 'Agendamento' : 'Confirmação'}
        </span>
      </nav>

      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-32 md:pb-8">
        
        {/* Service Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gold-100 flex gap-4 mb-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-50 rounded-bl-full -mr-10 -mt-10 z-0 transition-transform group-hover:scale-110"></div>
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 z-10 bg-gray-100 border border-gray-100 shadow-inner">
                <img src={service.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="z-10 flex-1 min-w-0 flex flex-col justify-center">
                <h2 className="font-serif font-bold text-gold-900 text-lg leading-tight truncate">{service.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-sm font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-md">
                        R$ {service.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {service.duration_min} min
                    </span>
                </div>
            </div>
        </div>

        {step === 1 && (
            <div className="animate-fade-in space-y-8">
                
                {/* Calendar View */}
                <div>
                    <h3 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Selecione a Data</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gold-100">
                        {/* Month Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => handleMonthChange('prev')} className="p-1 hover:bg-gray-100 rounded-full text-gold-700">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <h4 className="font-serif font-bold text-gold-900 capitalize">
                                {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                            </h4>
                            <button onClick={() => handleMonthChange('next')} className="p-1 hover:bg-gray-100 rounded-full text-gold-700">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>

                        {/* Week Days */}
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['D','S','T','Q','Q','S','S'].map((d, i) => (
                                <span key={i} className="text-[10px] font-bold text-gray-400">{d}</span>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays().map((day, idx) => {
                                const isDisabled = isDayDisabled(day);
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, viewDate);
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                setSelectedDate(day);
                                                setSelectedSlot(null); // Reset slot when date changes
                                            }
                                        }}
                                        disabled={isDisabled}
                                        className={`
                                            h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all relative
                                            ${!isCurrentMonth ? 'opacity-30' : ''}
                                            ${isDisabled 
                                                ? 'text-gray-300 cursor-not-allowed decoration-slice' 
                                                : isSelected 
                                                    ? 'bg-gold-500 text-white shadow-md font-bold' 
                                                    : 'text-gray-700 hover:bg-gold-50 hover:text-gold-900'
                                            }
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex items-center gap-2 justify-center">
                             <span className="material-symbols-outlined text-gray-400 text-xs">info</span>
                             <p className="text-[10px] text-gray-400 text-center">Agendamentos permitidos apenas até o fim do mês vigente.</p>
                        </div>
                    </div>
                </div>

                {/* Slots Grid */}
                <div>
                    <div className="flex justify-between items-end mb-3 ml-1">
                        <h3 className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider">Horários Disponíveis</h3>
                        <span className="text-xs font-bold text-gold-600 animate-fade-in">
                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {allSlots.length === 0 ? (
                            <div className="col-span-full py-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                {isDayDisabled(selectedDate) ? (
                                    <>
                                        <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">calendar_off</span>
                                        <p className="text-gray-400 text-sm">Data indisponível ou fechada.</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">event_busy</span>
                                        <p className="text-gray-400 text-sm">Sem horários livres nesta data.</p>
                                    </>
                                )}
                            </div>
                        ) : allSlots.map((slot, i) => {
                            const isSelected = selectedSlot?.getTime() === slot.time.getTime();
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSlotSelection(slot)}
                                    disabled={!slot.isAvailable}
                                    className={`relative py-3 rounded-xl text-sm font-bold border transition-all flex flex-col items-center justify-center active:scale-95 ${
                                        isSelected
                                        ? 'bg-gold-500 text-white border-gold-500 shadow-md ring-2 ring-gold-200 ring-offset-1'
                                        : !slot.isAvailable
                                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                            : 'bg-white text-gold-900 border-gold-100 hover:border-gold-300 hover:shadow-sm'
                                    }`}
                                >
                                    <span className={!slot.isAvailable ? 'line-through opacity-60 text-xs' : ''}>
                                        {format(slot.time, 'HH:mm')}
                                    </span>
                                    {!slot.isAvailable && slot.reason === 'busy' && (
                                        <span className="text-[8px] font-black uppercase text-red-400 leading-none mt-0.5 tracking-tighter">Ocupado</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectionError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-fade-in shadow-sm">
                        <span className="material-symbols-outlined text-xl">error</span>
                        <span className="text-sm font-bold">{selectionError}</span>
                    </div>
                )}
            </div>
        )}

        {step === 2 && (
            <div className="animate-fade-in">
                 <div className="bg-gold-50 p-4 rounded-xl border border-gold-100 mb-6 flex items-center gap-3">
                     <span className="material-symbols-outlined text-gold-600">event</span>
                     <div>
                         <p className="text-xs text-gold-600 font-bold uppercase">Resumo</p>
                         <p className="text-gold-900 font-serif font-bold">
                             {selectedSlot && format(selectedSlot, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                         </p>
                     </div>
                 </div>

                 {!subscriptionValid ? (
                     <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
                         <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                         <h4 className="font-bold text-red-700 mb-1">Estabelecimento Indisponível</h4>
                         <p className="text-sm text-red-600">
                             No momento não é possível realizar agendamentos online para este estabelecimento. Entre em contato diretamente.
                         </p>
                     </div>
                 ) : (
                    <form onSubmit={handleBooking} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Seu Nome</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                                <input 
                                    required
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm"
                                    placeholder="Como prefere ser chamado?"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Seu WhatsApp</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">smartphone</span>
                                <input 
                                    required
                                    type="tel"
                                    value={clientPhone}
                                    onChange={e => setClientPhone(formatPhone(e.target.value))}
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm"
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start text-blue-800">
                            <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
                            <p className="text-xs leading-relaxed">
                                Você será redirecionado para o WhatsApp para confirmar os detalhes com nossa equipe.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-[#128C7E] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : (
                                <>
                                    <span className="material-symbols-outlined">chat</span>
                                    Finalizar no WhatsApp
                                </>
                            )}
                        </button>
                    </form>
                 )}
            </div>
        )}
      </main>

      {/* Sticky Bottom Bar for Step 1 */}
      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-200 z-40 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="w-full bg-gold-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <span>Continuar</span>
                <span className="material-symbols-outlined">arrow_forward</span>
            </button>
        </div>
      )}

      {/* Desktop/Tablet Button (Inside flow) */}
      {step === 1 && (
        <div className="hidden md:block max-w-lg mx-auto w-full px-4 mb-8">
            <button
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="w-full bg-gold-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <span>Continuar</span>
                <span className="material-symbols-outlined">arrow_forward</span>
            </button>
        </div>
      )}
    </div>
  );
};
