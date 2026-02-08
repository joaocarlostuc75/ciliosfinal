import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service } from '../../types';

export const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const load = async () => {
      setServices(await db.getServices());
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-light pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-luxury-light/90 backdrop-blur-md z-20 px-6 py-6 border-b border-gold-200 shadow-sm flex items-center justify-between">
         <button onClick={() => navigate('/')} className="text-gold-700">
            <span className="material-symbols-outlined">arrow_back_ios</span>
         </button>
         <h1 className="font-serif font-bold text-gold-900 text-lg">Procedimentos</h1>
         <div className="w-6" />
      </header>

      <main className="p-6 space-y-8">
        <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl text-gold-900">Nossos Serviços</h2>
            <div className="w-16 h-1 bg-gold-300 mx-auto rounded-full" />
            <p className="text-sm text-gray-500 font-sans max-w-xs mx-auto">
                Selecione o procedimento desejado para agendar seu horário exclusivo.
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
                <div key={service.id} className="bg-white rounded-3xl p-4 shadow-xl border border-gold-100 group hover:border-gold-300 transition-all duration-300">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                        <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gold-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            {Math.floor(service.duration_min / 60)}h {service.duration_min % 60}min
                        </span>
                    </div>
                    
                    <div className="space-y-3 px-2">
                        <div className="flex justify-between items-start">
                            <h3 className="font-serif text-xl font-bold text-gold-900">{service.name}</h3>
                            <span className="text-gold-600 font-bold font-sans">R$ {service.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-8">
                            {service.description}
                        </p>
                        
                        <button 
                            onClick={() => navigate(`/book/${service.id}`)}
                            className="w-full mt-2 bg-gold-500 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-gold-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                            AGENDAR
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};