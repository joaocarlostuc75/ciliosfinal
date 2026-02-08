import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Salon } from '../../types';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await db.getSalon();
        if (data) {
           setSalon(data);
        } else {
           setError(true);
        }
      } catch (e) {
        console.error("Failed to load salon:", e);
        setError(true);
      }
    };
    load();
  }, []);

  if (error) {
     return (
         <div className="min-h-screen bg-luxury-light flex items-center justify-center p-8 text-center">
            <div>
                <h1 className="text-xl font-bold text-red-500 mb-4">Erro ao carregar</h1>
                <p className="text-gray-600 mb-6">Não foi possível carregar as informações do salão.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gold-500 text-white rounded-lg"
                >
                  Tentar Novamente
                </button>
            </div>
         </div>
     );
  }

  if (!salon) {
      return (
          <div className="min-h-screen bg-luxury-light flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
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
            <div className="w-64 h-80 relative rounded-[3rem] overflow-hidden border-4 border-gold-300 shadow-2xl">
                <img 
                    src={salon.logo_url} 
                    alt="Salon Ambience" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
            </div>
        </div>

        <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-sans tracking-[0.3em] text-gold-700 uppercase">Estúdio Premium</span>
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
         <p className="text-[10px] text-gold-900/40 uppercase tracking-widest">Luxury Beauty Experience</p>
      </footer>
    </div>
  );
};