import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.login(username, password)) {
      navigate('/admin');
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-light flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-100 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gold-200 w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-200">
             <span className="material-symbols-outlined text-gold-600 text-3xl">lock</span>
           </div>
           <h2 className="font-serif text-2xl font-bold text-gold-900">Área Restrita</h2>
           <p className="text-gray-400 text-sm">Acesso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
           {error && (
             <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center border border-red-100 font-medium">
               {error}
             </div>
           )}
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Usuário</label>
             <input 
               type="text"
               value={username}
               onChange={e => setUsername(e.target.value)}
               className="w-full bg-gray-50 border border-gold-100 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:bg-white transition-all"
               placeholder="Digite seu usuário"
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Senha</label>
             <input 
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full bg-gray-50 border border-gold-100 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:bg-white transition-all"
               placeholder="Digite sua senha"
             />
           </div>

           <button 
             type="submit"
             className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-gold-600 active:scale-95 transition-all"
           >
             Entrar
           </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          className="w-full mt-6 text-sm text-gray-400 hover:text-gold-600 transition-colors"
        >
          Voltar para o site
        </button>
      </div>
    </div>
  );
};