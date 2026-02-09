
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus, GlobalSettings } from '../../types';
import { differenceInDays, format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const SuperDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState<Salon[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, trial: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Modal for specific date extension
    const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
    const [extensionDate, setExtensionDate] = useState('');
    
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const salonList = await db.getAllSalons();
            setSalons(salonList || []);
            setGlobalSettings(await db.getGlobalSettings());

            // Calc Stats
            setStats({
                total: salonList.length,
                active: salonList.filter(s => s.subscription_status === SubscriptionStatus.ACTIVE || s.is_lifetime_free).length,
                blocked: salonList.filter(s => s.subscription_status === SubscriptionStatus.BLOCKED).length,
                trial: salonList.filter(s => s.subscription_status === SubscriptionStatus.TRIAL).length
            });
        } catch (e) {
            console.error("Failed to load data", e);
        }
    };

    const handleToggleStatus = async (salon: Salon) => {
        let newStatus = salon.subscription_status;
        if (newStatus !== SubscriptionStatus.BLOCKED) {
            newStatus = SubscriptionStatus.BLOCKED;
        } else {
            // Restore to previous state or Active
            newStatus = SubscriptionStatus.ACTIVE;
        }
        
        await db.adminUpdateSalon({ ...salon, subscription_status: newStatus });
        await loadData();
    };

    const handleGrantLifetime = async (salon: Salon) => {
        const confirmMsg = salon.is_lifetime_free 
            ? "Remover acesso vitalício gratuito?" 
            : "Conceder acesso vitalício gratuito para este cliente?";
        
        if (confirm(confirmMsg)) {
            await db.adminUpdateSalon({ 
                ...salon, 
                is_lifetime_free: !salon.is_lifetime_free,
                subscription_status: !salon.is_lifetime_free ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL 
            });
            await loadData();
        }
    };

    const handleSetExpiration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSalon && extensionDate) {
            await db.adminUpdateSalon({
                ...selectedSalon,
                subscription_end_date: new Date(extensionDate).toISOString(),
                subscription_status: SubscriptionStatus.ACTIVE,
                is_lifetime_free: false // Custom date overrides lifetime
            });
            setSelectedSalon(null);
            await loadData();
        }
    };

    const handleGlobalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && globalSettings) {
            setIsUploading(true);
            try {
                const url = await db.uploadImage(file);
                await db.saveGlobalSettings({ ...globalSettings, default_logo_url: url });
                await loadData();
            } catch (error) {
                alert('Erro no upload');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleLogout = async () => {
        await db.logout();
        navigate('/');
    };

    const getDaysUsed = (salon: Salon) => {
        return differenceInDays(new Date(), new Date(salon.created_at));
    };

    const getExpirationDisplay = (salon: Salon) => {
        if (salon.is_lifetime_free) return <span className="text-emerald-400 font-bold">Vitalício</span>;
        if (salon.subscription_status === SubscriptionStatus.BLOCKED) return <span className="text-red-500 font-bold">Bloqueado</span>;
        
        if (salon.subscription_end_date) {
            const end = new Date(salon.subscription_end_date);
            const daysLeft = differenceInDays(end, new Date());
            return daysLeft < 0 ? <span className="text-red-400">Expirado</span> : <span>{daysLeft} dias restantes</span>;
        }

        if (salon.subscription_status === SubscriptionStatus.TRIAL) {
            const daysUsed = getDaysUsed(salon);
            const remaining = 10 - daysUsed;
            return remaining <= 0 ? <span className="text-red-400">Expirado (Trial)</span> : <span>{remaining} dias de teste</span>;
        }

        return <span className="text-gray-500">Indefinido</span>;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20 shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-600 rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">J.C SISTEMAS</h1>
                            <p className="text-xs text-gold-500 font-bold uppercase tracking-wider">Super Admin Dashboard</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                        Sair
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <p className="text-gray-400 text-xs font-bold uppercase">Total Clientes</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{stats.total}</h3>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <p className="text-gray-400 text-xs font-bold uppercase">Ativos</p>
                        <h3 className="text-3xl font-bold text-emerald-400 mt-1">{stats.active}</h3>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <p className="text-gray-400 text-xs font-bold uppercase">Em Teste</p>
                        <h3 className="text-3xl font-bold text-blue-400 mt-1">{stats.trial}</h3>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <p className="text-gray-400 text-xs font-bold uppercase">Bloqueados</p>
                        <h3 className="text-3xl font-bold text-red-400 mt-1">{stats.blocked}</h3>
                    </div>
                </div>

                {/* Global Settings */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                         <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-gold-500">settings</span>
                            Configurações Globais
                         </h2>
                    </div>
                    <div className="p-6 flex items-center gap-8">
                        <div>
                            <p className="text-sm font-bold text-gray-400 mb-2">Logotipo Padrão do Sistema</p>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-900 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                                    {globalSettings?.default_logo_url ? (
                                        <img src={globalSettings.default_logo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-600">image</span>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleGlobalLogoUpload} 
                                        accept="image/*"
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        {isUploading ? 'Enviando...' : 'Alterar Logo Padrão'}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">Exibido para novos usuários sem logo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-gold-500">group</span>
                            Gestão de Clientes (Assinaturas)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4">Cliente / Estabelecimento</th>
                                    <th className="p-4">Status Atual</th>
                                    <th className="p-4">Expiração / Tempo</th>
                                    <th className="p-4 text-center">Ações Rápidas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-sm">
                                {salons.map(salon => (
                                    <tr key={salon.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white text-base">{salon.name}</div>
                                            <div className="text-gray-500">{salon.owner_email}</div>
                                            <div className="text-xs text-gray-600 mt-1">Criado em: {format(new Date(salon.created_at), 'dd/MM/yyyy')}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                salon.subscription_status === 'ACTIVE' || salon.is_lifetime_free ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                                salon.subscription_status === 'BLOCKED' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                                                salon.subscription_status === 'EXPIRED' ? 'bg-orange-900/50 text-orange-400 border border-orange-800' :
                                                'bg-blue-900/50 text-blue-400 border border-blue-800'
                                            }`}>
                                                {salon.is_lifetime_free ? 'LIFETIME' : salon.subscription_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {getExpirationDisplay(salon)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(salon)}
                                                    title={salon.subscription_status === 'BLOCKED' ? "Desbloquear" : "Bloquear"}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        salon.subscription_status === 'BLOCKED' 
                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' 
                                                        : 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">block</span>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleGrantLifetime(salon)}
                                                    title="Alternar Acesso Vitalício"
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        salon.is_lifetime_free 
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-gray-700 text-gray-300 hover:bg-emerald-500 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">verified</span>
                                                </button>

                                                <button 
                                                    onClick={() => setSelectedSalon(salon)}
                                                    title="Definir Data de Expiração"
                                                    className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">calendar_clock</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            {/* Date Modal */}
            {selectedSalon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Definir Expiração</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Para: <span className="text-white font-bold">{selectedSalon.name}</span>
                        </p>
                        <form onSubmit={handleSetExpiration} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nova Data Limite</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-gold-500 mt-1"
                                    value={extensionDate}
                                    onChange={e => setExtensionDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedSalon(null)} className="flex-1 py-2 text-gray-400 hover:text-white">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-gold-600 hover:bg-gold-700 text-white font-bold rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
