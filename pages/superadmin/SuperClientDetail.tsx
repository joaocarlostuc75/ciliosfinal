
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus } from '../../types';
import { format, addDays } from 'date-fns';

export const SuperClientDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState<Salon | null>(null);
    const [courtesyDays, setCourtesyDays] = useState('7');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSalon();
    }, [id]);

    const loadSalon = async () => {
        const salons = await db.getAllSalons();
        const found = salons.find(s => s.id === id);
        if (found) setSalon(found);
    };

    const handleToggleBlock = async () => {
        if (!salon) return;
        const newStatus = salon.subscription_status === SubscriptionStatus.BLOCKED 
            ? SubscriptionStatus.ACTIVE 
            : SubscriptionStatus.BLOCKED;
        
        await db.adminUpdateSalon({ ...salon, subscription_status: newStatus });
        loadSalon();
    };

    const handleGrantCourtesy = async () => {
        if (!salon) return;
        setIsLoading(true);
        const days = parseInt(courtesyDays);
        if (isNaN(days)) return;

        const newEnd = addDays(new Date(), days);
        await db.adminUpdateSalon({
            ...salon,
            subscription_status: SubscriptionStatus.ACTIVE,
            subscription_end_date: newEnd.toISOString(),
            is_lifetime_free: false
        });
        setIsLoading(false);
        alert(`Acesso liberado por ${days} dias.`);
        loadSalon();
    };

    const handleCancelSub = async () => {
        if (salon && confirm('Cancelar assinatura imediatamente? O usuário perderá acesso.')) {
            await db.adminUpdateSalon({ ...salon, subscription_status: SubscriptionStatus.CANCELLED });
            loadSalon();
        }
    };

    if (!salon) return <div className="p-8 text-center">Carregando...</div>;

    const isBlocked = salon.subscription_status === SubscriptionStatus.BLOCKED;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate('/super-admin/salons')} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gold-600 hover:border-gold-300 transition-colors shadow-sm">
                     <span className="material-symbols-outlined">arrow_back</span>
                 </button>
                 <div>
                     <h3 className="font-serif text-2xl font-bold text-gold-900">Detalhes do Salão</h3>
                     <p className="text-sm text-gray-500">Gerenciamento individual</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gold-100 p-8 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full border-4 border-gold-100 bg-gray-50 mb-6 flex items-center justify-center overflow-hidden shadow-inner">
                        {salon.logo_url ? (
                            <img src={salon.logo_url} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-6xl text-gray-300">store</span>
                        )}
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-gold-900 mb-1">{salon.name}</h2>
                    <p className="text-gray-500 text-sm mb-6">{salon.owner_email}</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-100 pt-6">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-gray-800">
                                {salon.subscription_plan === 'FREE' ? 'Free' : 'Pro'}
                            </span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Plano</span>
                        </div>
                        <div className="text-center">
                            <span className={`block text-2xl font-bold ${
                                salon.subscription_status === 'ACTIVE' ? 'text-green-500' : 
                                salon.subscription_status === 'BLOCKED' ? 'text-red-500' : 'text-blue-500'
                            }`}>
                                {salon.subscription_status}
                            </span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Status</span>
                        </div>
                    </div>
                </div>

                {/* Actions & Details */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Access Control */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gold-100 p-6">
                        <h4 className="font-serif text-lg font-bold text-gold-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gold-500">admin_panel_settings</span>
                            Controle de Acesso
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                             {/* Block/Unblock */}
                             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                 <h5 className="font-bold text-gray-700 text-sm mb-2">Bloqueio de Segurança</h5>
                                 <p className="text-xs text-gray-500 mb-4">Impede o acesso imediato ao painel administrativo deste salão.</p>
                                 <button 
                                    onClick={handleToggleBlock}
                                    className={`w-full py-2 rounded-lg font-bold text-sm border transition-colors ${
                                        isBlocked 
                                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                        : 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                                    }`}
                                 >
                                     {isBlocked ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                                 </button>
                             </div>

                             {/* Subscription Override */}
                             <div className="p-4 bg-gold-50/50 rounded-xl border border-gold-100">
                                 <h5 className="font-bold text-gold-800 text-sm mb-2">Concessão de Cortesia</h5>
                                 <p className="text-xs text-gold-600 mb-4">Libera acesso total por um período determinado.</p>
                                 <div className="flex gap-2">
                                     <select 
                                        className="bg-white border border-gold-200 rounded-lg text-xs p-2 outline-none flex-1"
                                        value={courtesyDays}
                                        onChange={e => setCourtesyDays(e.target.value)}
                                     >
                                         <option value="7">7 Dias</option>
                                         <option value="15">15 Dias</option>
                                         <option value="30">30 Dias</option>
                                     </select>
                                     <button 
                                        onClick={handleGrantCourtesy}
                                        disabled={isLoading}
                                        className="bg-gold-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-gold-600 disabled:opacity-50"
                                     >
                                         Aplicar
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
                        <h4 className="font-serif text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            Zona de Perigo
                        </h4>
                        <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                             <div>
                                 <h5 className="font-bold text-red-700 text-sm">Cancelar Assinatura</h5>
                                 <p className="text-xs text-red-500">O status mudará para CANCELLED e o acesso será revogado.</p>
                             </div>
                             <button onClick={handleCancelSub} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50">
                                 Executar
                             </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
