import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, AppointmentStatus, Salon, DaySchedule } from '../../types';
import { format, addMinutes, isBefore, addDays, areIntervalsOverlapping } from 'date-fns';

export const Booking: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  
  // Step 2: Client Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        const s = await db.getSalon();
        setSalon(s);
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

        const slots: Date[] = [];
        const dayOfWeek = selectedDate.getDay();
        const daySchedule = salon.opening_hours.find(d => d.dayOfWeek === dayOfWeek);

        // If salon is closed today
        if (!daySchedule || !daySchedule.isOpen) {
            setAvailableSlots([]);
            setSelectedSlot(null);
            return;
        }

        // Fetch Secure Busy Times (Appointments + Blocks)
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const busyTimes = await db.getBusyTimes(salon.id, dateStr);

        // Iterate through defined slots for the day (e.g., 09-12, 13-18)
        daySchedule.slots.forEach(timeRange => {
            const [startHour, startMin] = timeRange.start.split(':').map(Number);
            const [endHour, endMin] = timeRange.end.split(':').map(Number);

            let current = new Date(selectedDate);
            current.setHours(startHour, startMin, 0, 0);

            const rangeEnd = new Date(selectedDate);
            rangeEnd.setHours(endHour, endMin, 0, 0);

            while (isBefore(current, rangeEnd)) {
                const slotEnd = addMinutes(current, service.duration_min);
                
                // Check if slot finishes after range end (e.g. starting a 1h service at 11:30 when break is 12:00)
                if (isBefore(rangeEnd, slotEnd)) {
                    current = addMinutes(current, 30); // Move to next potential slot
                    continue;
                }

                // Check Collision with Busy Times (Abstracted View)
                const isConflict = busyTimes.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return areIntervalsOverlapping({ start: current, end: slotEnd }, { start: busyStart, end: busyEnd });
                });

                // Check if it is in the past (if today)
                const isPast = isBefore(current, new Date());

                if (!isConflict && !isPast) {
                    slots.push(current);
                }
                current = addMinutes(current, 30);
            }
        });

        // Sort slots just in case
        slots.sort((a, b) => a.getTime() - b.getTime());

        setAvailableSlots(slots);
        setSelectedSlot(null);
    };

    fetchSlots();
  }, [selectedDate, service, salon]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !service || !salon) return;
    
    setLoading(true);

    try {
      // 1. Create or Get Client
      const client = await db.createClient({
        id: crypto.randomUUID(),
        salon_id: service.salon_id,
        name: clientName,
        whatsapp: clientPhone,
        created_at: new Date().toISOString()
      });

      // 2. Create Appointment
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

      // 3. WhatsApp Redirect
      const msg = `Olá, gostaria de confirmar meu agendamento: ${service.name} para o dia ${format(selectedSlot, "dd/MM 'às' HH:mm")}. Meu nome é ${clientName}.`;
      const waLink = `https://wa.me/55${salon.phone}?text=${encodeURIComponent(msg)}`;
      
      setLoading(false);

      // Open in new tab to keep site open
      window.open(waLink, '_blank');
      
      // Feedback to user and redirect to schedule
      alert('Agendamento pré-confirmado! Você será redirecionado para a sua agenda.');
      navigate(`/my-schedule?phone=${clientPhone}`);

    } catch (error) {
      alert((error as Error).message);
      setLoading(false);
    }
  };

  if (!service) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-luxury-light pb-10">
      <nav className="p-4 flex items-center border-b border-gold-200 bg-white/50 backdrop-blur sticky top-0 z-20">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 text-gold-700">
           <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <span className="font-serif font-bold text-gold-900 ml-2">Agendamento</span>
      </nav>

      <main className="max-w-md mx-auto p-6">
        
        {/* Service Summary Card */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gold-100 flex gap-4 mb-8">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <img src={service.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
                <h2 className="font-serif font-bold text-gold-900">{service.name}</h2>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                <div className="flex gap-3 mt-2 text-xs font-bold text-gold-600">
                    <span>R$ {service.price}</span>
                    <span>•</span>
                    <span>{service.duration_min} min</span>
                </div>
            </div>
        </div>

        {step === 1 && (
            <div className="animate-fade-in">
                <h3 className="font-serif text-xl font-bold text-gold-900 mb-4">Escolha o Horário</h3>
                
                {/* Date Picker (Simplified Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(offset => {
                        const date = addDays(new Date(), offset);
                        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        // Visual check if shop is open this day (simple check)
                        const dayConfig = salon?.opening_hours.find(d => d.dayOfWeek === date.getDay());
                        const isClosed = !dayConfig?.isOpen;

                        return (
                            <button
                                key={offset}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center justify-center min-w-[4rem] h-20 rounded-2xl border transition-all ${
                                    isSelected 
                                    ? 'bg-gold-500 border-gold-500 text-white shadow-lg scale-105' 
                                    : isClosed 
                                        ? 'bg-gray-100 border-gray-100 text-gray-300'
                                        : 'bg-white border-gold-100 text-gray-400'
                                }`}
                            >
                                <span className="text-xs font-bold uppercase">
                                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '')}
                                </span>
                                <span className="text-xl font-serif font-bold">{format(date, 'dd')}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {availableSlots.length === 0 ? (
                        <p className="col-span-3 text-center text-gray-400 py-8 border border-dashed border-gray-300 rounded-xl">
                            Sem horários disponíveis nesta data.
                        </p>
                    ) : availableSlots.map((slot, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                selectedSlot === slot
                                ? 'bg-gold-500 text-white border-gold-500 shadow-md'
                                : 'bg-white text-gold-700 border-gold-200 hover:border-gold-400'
                            }`}
                        >
                            {format(slot, 'HH:mm')}
                        </button>
                    ))}
                </div>

                <button
                    disabled={!selectedSlot}
                    onClick={() => setStep(2)}
                    className="w-full bg-gold-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-700 transition-colors"
                >
                    Continuar
                </button>
            </div>
        )}

        {step === 2 && (
            <div className="animate-fade-in">
                 <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Seus Dados</h3>
                 
                 <form onSubmit={handleBooking} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Nome Completo</label>
                        <input 
                            required
                            type="text"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            className="w-full bg-white border border-gold-200 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                            placeholder="Seu nome"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">WhatsApp</label>
                        <input 
                            required
                            type="tel"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                            className="w-full bg-white border border-gold-200 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    <div className="bg-gold-100/50 p-4 rounded-xl border border-gold-200/50 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-gold-600">info</span>
                        <p className="text-xs text-gold-800 leading-relaxed">
                            Ao confirmar, você será redirecionado para o WhatsApp (em uma nova aba) para finalizar o agendamento com nossa recepção.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processando...' : (
                            <>
                                <span className="material-symbols-outlined">chat</span>
                                Confirmar no WhatsApp
                            </>
                        )}
                    </button>
                 </form>
            </div>
        )}

      </main>
    </div>
  );
};