
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Salon } from '../../types';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultLogo, setDefaultLogo] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await db.getSalon();
        const settings = await db.getGlobalSettings();
        setDefaultLogo(settings.default_logo_url);
        setSalon(data);
      } catch (e) {
        console.error("Failed to load salon:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
      return (
          <div className="min-h-screen bg-luxury-light flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
          </div>
      );
  }

  // Display Logo Logic: Salon Logo > Default System Logo > Fallback Icon
  const displayLogo = salon?.logo_url || defaultLogo;

  if (!salon) {
      return (
          <div className="min-h-screen bg-luxury-light flex flex-col items-center justify-center p-8 text-center animate-fade-in relative">
             <button
                onClick={() => navigate('/admin')}
                className="absolute top-6 right-6 p-2 text-gold-900/20 hover:text-gold-900/60 transition-colors z-20"
                title="Área Administrativa"
             >
                <span className="material-symbols-outlined text-xl">lock</span>
             </button>

             <div className="w-24 h-24 bg-gold-100 rounded-full flex items-center justify-center mb-6 text-gold-600 overflow-hidden border-2 border-gold-200">
                 {defaultLogo ? (
                     <img src={defaultLogo} className="w-full h-full object-cover" alt="System" />
                 ) : (
                     <span className="material-symbols-outlined text-5xl">diamond</span>
                 )}
             </div>
             <h1 className="font-serif text-3xl font-bold text-gold-900 mb-2">J.C SISTEMAS</h1>
             <p className="text-gray-500 mb-8 max-w-md">
                 Sistema de gestão pronto para uso. Para começar a agendar e vender, configure seu estabelecimento.
             </p>
             <button 
               onClick={() => navigate('/login')}
               className="bg-gold-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gold-600 transition-all flex items-center gap-2"
             >
               <span className="material-symbols-outlined">rocket_launch</span>
               Começar Agora
             </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-luxury-light flex flex-col relative overflow-hidden animate-fade-in">
      {/* Background Ornament */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-100 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Admin Access Button */}
      <button
        onClick={() => navigate('/admin')}
        className="absolute top-6 right-6 p-2 text-gold-900/20 hover:text-gold-900/60 transition-colors z-20"
        title="Área Administrativa"
      >
        <span className="material-symbols-outlined text-xl">lock</span>
      </button>

      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        
        {/* Artistic Frame for Image */}
        <div className="relative mb-12">
            <div className="absolute inset-0 bg-gold-gradient rounded-[3rem] rotate-6 opacity-60 blur-sm transform scale-105" />
            <div className="w-64 h-80 relative rounded-[3rem] overflow-hidden border-4 border-gold-300 shadow-2xl bg-white flex items-center justify-center">
                {displayLogo ? (
                    <img 
                        src={displayLogo} 
                        alt="Salon Ambience" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-gold-200 flex flex-col items-center">
                        <span className="material-symbols-outlined text-6xl">storefront</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/10" />
            </div>
        </div>

        <div className="text-center space-y-2 mb-12">
            <h1 className="font-serif text-5xl font-bold text-gold-900 leading-tight">
                {salon.name.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                ))}
            </h1>
        </div>

        <button 
            onClick={() => navigate('/services')}
            className="group relative px-12 py-4 bg-gold-500 text-white font-sans font-bold tracking-widest uppercase rounded-full shadow-[0_10px_20px_rgba(197,160,89,0.4)] hover:shadow-[0_15px_25px_rgba(197,160,89,0.5)] transition-all transform hover:-translate-y-1 active:translate-y-0 overflow-hidden"
        >
            <span className="relative z-10">Entrar</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gold-600 to-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

      </main>

      <footer className="p-6 text-center z-10">
         <p className="text-[10px] text-gold-900/40 uppercase tracking-widest">J.C SISTEMAS</p>
      </footer>
    </div>
  );
};
