import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';

type AuthMode = 'login' | 'signup' | 'forgot';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const res = await db.login(email, password);
        if (res.success) {
          navigate('/admin');
        } else {
          setMessage({ type: 'error', text: res.message || 'Usuário ou senha inválidos.' });
        }
      } 
      else if (mode === 'signup') {
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não conferem.' });
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
            setLoading(false);
            return;
        }
        
        const res = await db.signUp(email, password);
        if (res.success) {
            setMessage({ type: 'success', text: res.message || 'Conta criada com sucesso!' });
            
            // Check if user was automatically logged in (Email confirmation disabled on DB)
            if (db.isAuthenticated()) {
                setTimeout(() => navigate('/admin'), 1500);
            } else {
                // Otherwise wait and switch to login
                setTimeout(() => setMode('login'), 3000);
            }
        } else {
            setMessage({ type: 'error', text: res.message || 'Erro ao criar conta.' });
        }
      } 
      else if (mode === 'forgot') {
        const res = await db.resetPassword(email);
        if (res.success) {
            setMessage({ type: 'success', text: res.message || 'Email de recuperação enviado.' });
            setTimeout(() => setMode('login'), 3000);
        } else {
            setMessage({ type: 'error', text: res.message || 'Erro ao solicitar recuperação.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
      switch(mode) {
          case 'login': return 'Área Restrita';
          case 'signup': return 'Criar Conta';
          case 'forgot': return 'Recuperar Senha';
      }
  };

  const getSubtitle = () => {
      switch(mode) {
          case 'login': return 'Acesso exclusivo para administradores';
          case 'signup': return 'Cadastre-se para gerenciar seu salão';
          case 'forgot': return 'Informe seu email para receber o link';
      }
  };

  return (
    <div className="min-h-screen bg-luxury-light flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-100 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gold-200 w-full max-w-sm relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-200">
             <span className="material-symbols-outlined text-gold-600 text-3xl">
                {mode === 'forgot' ? 'lock_reset' : mode === 'signup' ? 'person_add' : 'lock'}
             </span>
           </div>
           <h2 className="font-serif text-2xl font-bold text-gold-900">{getTitle()}</h2>
           <p className="text-gray-400 text-sm">{getSubtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           {message && (
             <div className={`text-sm p-3 rounded-lg text-center border font-medium ${
                 message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
             }`}>
               {message.text}
             </div>
           )}
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Email</label>
             <input 
               type="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full bg-gray-50 border border-gold-100 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:bg-white transition-all"
               placeholder="seu@email.com"
               required
             />
           </div>

           {mode !== 'forgot' && (
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Senha</label>
                 <input 
                   type="password"
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full bg-gray-50 border border-gold-100 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:bg-white transition-all"
                   placeholder="Sua senha"
                   required
                 />
               </div>
           )}

           {mode === 'signup' && (
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Confirmar Senha</label>
                 <input 
                   type="password"
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   className="w-full bg-gray-50 border border-gold-100 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:bg-white transition-all"
                   placeholder="Confirme sua senha"
                   required
                 />
               </div>
           )}

           {mode === 'login' && (
                <div className="text-right">
                    <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setMessage(null); }}
                        className="text-xs text-gold-600 hover:text-gold-800 hover:underline"
                    >
                        Esqueceu a senha?
                    </button>
                </div>
           )}

           <button 
             type="submit"
             disabled={loading}
             className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-gold-600 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
           >
             {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : ''}
             {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Enviar Link'}
           </button>
        </form>

        <div className="mt-6 space-y-3">
             {mode === 'login' && (
                 <button 
                    onClick={() => { setMode('signup'); setMessage(null); }}
                    className="w-full text-sm text-gray-400 hover:text-gold-600 transition-colors"
                 >
                    Não tem conta? <span className="font-bold">Criar agora</span>
                 </button>
             )}
             
             {(mode === 'signup' || mode === 'forgot') && (
                 <button 
                    onClick={() => { setMode('login'); setMessage(null); }}
                    className="w-full text-sm text-gray-400 hover:text-gold-600 transition-colors"
                 >
                    Voltar para Login
                 </button>
             )}
             
             <div className="border-t border-gray-100 pt-4 mt-4">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full text-xs text-gray-300 hover:text-gold-600 transition-colors"
                >
                  Voltar para o site público
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};