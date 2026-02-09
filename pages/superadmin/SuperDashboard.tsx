
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus, SystemPlan } from '../../types';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInDays } from 'date-fns';

export const SuperDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState<Salon[]>([]);
    const [stats, setStats] = useState({
        totalSalons: 0,
        activeSalons: 0,
        trialSalons: 0,
        totalRevenue: 0,
        conversionRate: 0
    });
    const [expiringSoon, setExpiringSoon] = useState<Salon[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await db.getAllSalons();
        const systemPlans = await db.getSystemPlans();
        setSalons(data);
        
        // Calculate Stats
        const activeSalonsList = data.filter(s => s.subscription_status === SubscriptionStatus.ACTIVE);
        const active = activeSalonsList.length;
        const trial = data.filter(s => s.subscription_status === SubscriptionStatus.TRIAL).length;
        
        // Real Revenue Calculation (MRR)
        let calculatedRevenue = 0;
        
        activeSalonsList.forEach(salon => {
            // Find the plan details based on the stored plan name
            const planDetails = systemPlans.find(p => p.name === salon.subscription_plan);
            
            if (planDetails) {
                if (planDetails.period === 'yearly') {
                    // Divide by 12 for Monthly Recurring Revenue
                    calculatedRevenue += (planDetails.price / 12);
                } else {
                    calculatedRevenue += planDetails.price;
                }
            } else if (salon.subscription_plan === 'Plano Gold VIP') {
                // Fallback for demo data if plan name matches demo but plan config missing
                calculatedRevenue += 450;
            }
        });
        
        // Conversion Rate (Active / (Active + Expired + Cancelled))
        const churned = data.filter(s => s.subscription_status === 'EXPIRED' || s.subscription_status === 'CANCELLED').length;
        const totalPaidAttempt = active + churned;
        const conversion = totalPaidAttempt > 0 ? (active / totalPaidAttempt) * 100 : 0;

        setStats({
            totalSalons: data.length,
            activeSalons: active,
            trialSalons: trial,
            totalRevenue: calculatedRevenue,
            conversionRate: conversion
        });

        // Expiring Soon Logic (0-5 days)
        const expiring = data.filter(s => {
            if (!s.subscription_end_date || s.is_lifetime_free) return false;
            const days = differenceInDays(new Date(s.subscription_end_date), new Date());
            return days >= 0 && days <= 5;
        });
        setExpiringSoon(expiring);

        // Update Chart Data with calculated values
        setChartData([
            { name: 'Jan', salons: Math.max(0, active - 4), revenue: Math.max(0, calculatedRevenue * 0.6) },
            { name: 'Fev', salons: Math.max(0, active - 3), revenue: Math.max(0, calculatedRevenue * 0.7) },
            { name: 'Mar', salons: Math.max(0, active - 2), revenue: Math.max(0, calculatedRevenue * 0.8) },
            { name: 'Abr', salons: Math.max(0, active - 1), revenue: Math.max(0, calculatedRevenue * 0.9) },
            { name: 'Mai', salons: active, revenue: calculatedRevenue },
        ]);
    };

    const handleWhatsApp = (salon: Salon) => {
        const phone = salon.phone.replace(/\D/g, '');
        const days = differenceInDays(new Date(salon.subscription_end_date!), new Date());
        const msg = `Olá! Notamos que sua assinatura do sistema vence em ${days} dias. Vamos renovar para manter seu acesso?`;
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const StatCard = ({ title, value, icon, color, subtext }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gold-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-serif font-bold text-gold-900">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${color}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Receita Mensal (MRR)" 
                    value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    icon="payments" 
                    color="bg-zinc-800" 
                    subtext="Baseado em assinaturas ativas"
                />
                <StatCard 
                    title="Assinantes Ativos" 
                    value={stats.activeSalons} 
                    icon="verified" 
                    color="bg-green-600" 
                    subtext={`${stats.conversionRate.toFixed(1)}% de Retenção`}
                />
                <StatCard 
                    title="Em Teste (Trial)" 
                    value={stats.trialSalons} 
                    icon="timelapse" 
                    color="bg-blue-500" 
                    subtext="Potenciais conversões"
                />
                <StatCard 
                    title="Atenção Necessária" 
                    value={expiringSoon.length} 
                    icon="notification_important" 
                    color="bg-orange-500" 
                    subtext="Vencendo em 5 dias"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-gold-100 flex flex-col">
                    <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Crescimento da Plataforma</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSalons" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                                    formatter={(value: number, name: string) => [
                                        name === 'revenue' ? `R$ ${value.toFixed(2)}` : value, 
                                        name === 'revenue' ? 'Receita Est.' : 'Salões'
                                    ]}
                                />
                                <Area type="monotone" dataKey="salons" stroke="#C5A059" strokeWidth={3} fillOpacity={1} fill="url(#colorSalons)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attention Widget (Vencimentos) */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gold-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif text-lg font-bold text-gold-900 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                             Atenção Imediata
                        </h3>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Vencimentos</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {expiringSoon.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                                <p className="text-sm">Nenhum vencimento próximo.</p>
                            </div>
                        ) : (
                            expiringSoon.map(s => {
                                const days = differenceInDays(new Date(s.subscription_end_date!), new Date());
                                return (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{s.name}</h4>
                                            <p className="text-xs text-orange-600 font-bold">Vence em {days === 0 ? 'hoje' : `${days} dias`}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleWhatsApp(s)}
                                            className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 shadow-sm"
                                            title="Cobrar no WhatsApp"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/super-admin/salons?filter=EXPIRED')}
                        className="w-full mt-4 py-2 text-xs font-bold text-gray-500 hover:text-gold-600 border-t border-gray-100"
                    >
                        Ver Inadimplentes (Expirados)
                    </button>
                </div>
            </div>
        </div>
    );
};
