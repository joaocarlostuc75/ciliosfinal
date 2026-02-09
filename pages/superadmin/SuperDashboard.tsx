
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus } from '../../types';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const SuperDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState<Salon[]>([]);
    
    useEffect(() => {
        loadSalons();
    }, []);

    const loadSalons = async () => {
        const data = await db.getAllSalons();
        setSalons(data);
    };

    const handleToggleStatus = async (salon: Salon) => {
        let newStatus = salon.subscription_status;
        if (newStatus === SubscriptionStatus.ACTIVE || newStatus === SubscriptionStatus.TRIAL) {
            newStatus = SubscriptionStatus.BLOCKED;
        } else if (newStatus === SubscriptionStatus.BLOCKED) {
            newStatus = SubscriptionStatus.ACTIVE;
        }
        
        await db.toggleSalonStatus(salon.id, newStatus);
        await loadSalons();
    };

    const handleLogout = async () => {
        await db.logout();
        navigate('/');
    };

    const getDaysRemaining = (salon: Salon) => {
        if (salon.subscription_status !== SubscriptionStatus.TRIAL) return null;
        const used = differenceInDays(new Date(), new Date(salon.created_at));
        return Math.max(0, 10 - used);
    };

    // Support Actions
    const handleSupportServices = () => {
        // Redirect to services manager but conceptually for that salon
        // Since we are mocking, we just go to the existing manager which uses the single mock salon
        navigate('/admin/services');
    };

    const handleSupportProducts = () => {
        navigate('/admin/products');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="flex justify-between items-center mb-12 border-b border-gray-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gold-500 font-serif">J.C SISTEMAS</h1>
                    <p className="text-gray-400">Painel de Super Admin</p>
                </div>
                <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">
                    Sair
                </button>
            </header>

            <div className="max-w-7xl mx-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">storefront</span>
                    Estabelecimentos Cadastrados
                </h2>

                <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-300">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Email do Dono</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Teste (Dias Restantes)</th>
                                <th className="p-4 text-right">Ações de Gestão</th>
                                <th className="p-4 text-right">Suporte Técnico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {salons.map(salon => {
                                const daysLeft = getDaysRemaining(salon);
                                return (
                                    <tr key={salon.id} className="hover:bg-gray-700/50">
                                        <td className="p-4 font-bold">{salon.name}</td>
                                        <td className="p-4 text-gray-400">{salon.owner_email || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                salon.subscription_status === 'ACTIVE' ? 'bg-green-900 text-green-300' :
                                                salon.subscription_status === 'TRIAL' ? 'bg-blue-900 text-blue-300' :
                                                'bg-red-900 text-red-300'
                                            }`}>
                                                {salon.subscription_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {daysLeft !== null ? (
                                                <span className={`${daysLeft < 3 ? 'text-red-400' : 'text-gray-300'}`}>
                                                    {daysLeft} dias
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleToggleStatus(salon)}
                                                className={`px-3 py-1 rounded text-xs font-bold ${
                                                    salon.subscription_status === 'BLOCKED' 
                                                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                                                    : 'bg-red-600 hover:bg-red-500 text-white'
                                                }`}
                                            >
                                                {salon.subscription_status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear Acesso'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={handleSupportServices}
                                                className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                title="Cadastrar Serviços"
                                            >
                                                <span className="material-symbols-outlined text-xs">spa</span> Serviços
                                            </button>
                                            <button 
                                                onClick={handleSupportProducts}
                                                className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                title="Cadastrar Produtos"
                                            >
                                                <span className="material-symbols-outlined text-xs">inventory_2</span> Produtos
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
