
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus } from '../../types';
import { format, differenceInDays } from 'date-fns';

export const SuperSalons: React.FC = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState<Salon[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'BLOCKED'>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setSalons(await db.getAllSalons());
    };

    const handleImpersonate = async (salonId: string) => {
        if (confirm('Você entrará no sistema como este salão. Continuar?')) {
            try {
                await db.impersonateSalon(salonId);
                navigate('/admin'); // Redirect to admin dashboard as that user
                window.location.reload(); // Force reload to pick up new session
            } catch (e) {
                alert('Erro ao acessar conta.');
            }
        }
    };

    const handleWhatsApp = (salon: Salon) => {
        const phone = salon.phone.replace(/\D/g, '');
        let msg = '';

        if (salon.subscription_status === 'EXPIRED') {
            msg = `Olá ${salon.name}, notamos que sua assinatura expirou. Gostaria de regularizar para liberar o acesso aos agendamentos?`;
        } else if (salon.subscription_status === 'TRIAL') {
            msg = `Olá ${salon.name}, como está sendo sua experiência com o sistema? Precisa de alguma ajuda na configuração?`;
        } else if (salon.subscription_end_date && differenceInDays(new Date(salon.subscription_end_date), new Date()) < 5) {
             const days = differenceInDays(new Date(salon.subscription_end_date), new Date());
             msg = `Olá! Sua assinatura vence em ${days} dias. Vamos renovar?`;
        } else {
            msg = `Olá, tudo bem? Passando para saber se precisa de suporte com o sistema.`;
        }
        
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const filteredSalons = salons.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'ALL' || s.subscription_status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'ACTIVE': return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Ativo</span>;
            case 'TRIAL': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Trial</span>;
            case 'BLOCKED': return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Bloqueado</span>;
            case 'EXPIRED': return <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">Expirado</span>;
            default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">{status}</span>;
        }
    };

    const getExpirationDisplay = (salon: Salon) => {
        if (salon.is_lifetime_free) return <span className="text-emerald-600 font-bold text-xs">Vitalício</span>;
        if (!salon.subscription_end_date) return <span className="text-gray-400 text-xs">-</span>;
        
        const days = differenceInDays(new Date(salon.subscription_end_date), new Date());
        
        if (days < 0) return <span className="text-red-600 font-bold text-xs">Vencido ({Math.abs(days)}d)</span>;
        if (days <= 5) return <span className="text-orange-600 font-bold text-xs">Vence em {days}d</span>;
        return <span className="text-green-600 font-bold text-xs">{days} dias</span>;
    };

    const getHealthDisplay = (salon: Salon) => {
        if (!salon.last_login) return <span className="text-gray-400 text-xs">Nunca</span>;
        const days = differenceInDays(new Date(), new Date(salon.last_login));
        
        if (days > 30) return <span className="text-red-500 font-bold text-xs">Risco (30d+)</span>;
        if (days > 7) return <span className="text-yellow-600 font-bold text-xs">Ausente (7d+)</span>;
        return <span className="text-green-600 font-bold text-xs">Ativo</span>;
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h3 className="font-serif text-xl font-bold text-gold-900">Salões Cadastrados</h3>
                    <p className="text-sm text-gray-500">Gerencie o acesso e assinaturas dos clientes.</p>
                </div>
                
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gold-200 shadow-sm overflow-x-auto max-w-full">
                    {['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED', 'BLOCKED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                filter === f ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'
                            }`}
                        >
                            {f === 'ALL' ? 'Todos' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input 
                    type="text" 
                    placeholder="Buscar por nome do salão ou email do proprietário..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-sm"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gold-50 border-b border-gold-200">
                            <tr>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900">Salão</th>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900">Plano</th>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900">Status</th>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900">Vencimento</th>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900">Saúde</th>
                                <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSalons.map(salon => (
                                <tr key={salon.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                                {salon.logo_url ? (
                                                    <img src={salon.logo_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">store</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{salon.name}</div>
                                                <div className="text-[10px] text-gray-500">{salon.owner_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gold-700">
                                        {salon.is_lifetime_free ? 'Vitalício' : salon.subscription_plan}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(salon.subscription_status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getExpirationDisplay(salon)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getHealthDisplay(salon)}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                        <button 
                                            onClick={() => handleWhatsApp(salon)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                            title="Contatar via WhatsApp"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                        </button>

                                        <button 
                                            onClick={() => handleImpersonate(salon.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                            title="Acessar painel do cliente (Impersonate)"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                        </button>

                                        <button 
                                            onClick={() => navigate(`/super-admin/client/${salon.id}`)}
                                            className="text-gray-500 hover:text-gold-600 font-bold text-xs uppercase hover:underline ml-2"
                                        >
                                            Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSalons.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum salão encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
