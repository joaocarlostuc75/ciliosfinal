
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus, SystemPlan } from '../../types';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MyPlan: React.FC = () => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [plans, setPlans] = useState<SystemPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Support Number (Super Admin / J.C Sistemas)
  const SUPPORT_NUMBER = "5511999999999"; 

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await db.getSalon();
      const allPlans = await db.getSystemPlans();
      setSalon(data);
      // Filter only public plans or keep all depending on strategy (Currently showing all Public)
      setPlans(allPlans.filter(p => p.is_public));
      setLoading(false);
    };
    load();
  }, []);

  const getStatusInfo = (status: SubscriptionStatus, isLifetime: boolean | undefined) => {
      if (isLifetime) return { text: 'Vitalício', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: 'verified' };
      
      switch(status) {
          case SubscriptionStatus.ACTIVE: return { text: 'Ativo', color: 'text-green-600', bg: 'bg-green-100', icon: 'check_circle' };
          case SubscriptionStatus.TRIAL: return { text: 'Período de Teste', color: 'text-blue-600', bg: 'bg-blue-100', icon: 'timelapse' };
          case SubscriptionStatus.EXPIRED: return { text: 'Expirado', color: 'text-orange-600', bg: 'bg-orange-100', icon: 'warning' };
          case SubscriptionStatus.BLOCKED: return { text: 'Bloqueado', color: 'text-red-600', bg: 'bg-red-100', icon: 'block' };
          case SubscriptionStatus.CANCELLED: return { text: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-100', icon: 'cancel' };
          default: return { text: 'Desconhecido', color: 'text-gray-600', bg: 'bg-gray-100', icon: 'help' };
      }
  };

  const calculateDaysRemaining = () => {
      if (!salon) return 0;
      if (salon.is_lifetime_free) return 9999;
      
      if (salon.subscription_status === SubscriptionStatus.TRIAL) {
          const daysUsed = differenceInDays(new Date(), new Date(salon.created_at));
          return Math.max(0, 10 - daysUsed);
      }

      if (salon.subscription_end_date) {
          const end = new Date(salon.subscription_end_date);
          return Math.max(0, differenceInDays(end, new Date()));
      }
      
      return 0;
  };

  const handleRenewal = () => {
      if (!salon) return;
      const msg = `Olá! Gostaria de renovar a assinatura do sistema para o estabelecimento: *${salon.name}* (Email: ${salon.owner_email}).`;
      window.open(`https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleChangePlan = (plan: SystemPlan) => {
      if (!salon) return;
      const msg = `Olá! Gostaria de alterar meu plano para *${plan.name}* (R$ ${plan.price}). Meu estabelecimento é: *${salon.name}*. Como procedemos?`;
      window.open(`https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCancel = () => {
      if (!salon) return;
      const msg = `Olá! Gostaria de solicitar o cancelamento da assinatura para o estabelecimento: *${salon.name}* (Email: ${salon.owner_email}).`;
      window.open(`https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-gold-600">Carregando informações do plano...</div>;
  if (!salon) return <div className="p-8 text-center">Dados não encontrados.</div>;

  const statusInfo = getStatusInfo(salon.subscription_status, salon.is_lifetime_free);
  const daysLeft = calculateDaysRemaining();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
       {/* Current Plan Card */}
       <div className="bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden">
           {/* Header */}
           <div className="p-8 border-b border-gold-100 bg-gold-50/30 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
                        <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-gold-900">Meu Plano</h2>
                        <p className="text-sm text-gray-500">Detalhes da sua assinatura</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${statusInfo.bg} ${statusInfo.color}`}>
                    <span className="material-symbols-outlined">{statusInfo.icon}</span>
                    {statusInfo.text}
                </div>
           </div>

           <div className="p-8">
               
               {/* Status Alert */}
               {(salon.subscription_status === SubscriptionStatus.BLOCKED || salon.subscription_status === SubscriptionStatus.EXPIRED) && !salon.is_lifetime_free && (
                   <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                       <span className="material-symbols-outlined text-red-500 text-2xl">report</span>
                       <div>
                           <h4 className="font-bold text-red-700">Atenção: Acesso Restrito</h4>
                           <p className="text-sm text-red-600 mt-1">
                               Sua assinatura está {salon.subscription_status === SubscriptionStatus.BLOCKED ? 'bloqueada' : 'expirada'}. 
                               A funcionalidade de agendamentos pode estar suspensa. Renove agora para regularizar.
                           </p>
                       </div>
                   </div>
               )}

               <div className="grid md:grid-cols-2 gap-8">
                   {/* Info */}
                   <div className="space-y-6">
                       <div>
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plano Atual</label>
                           <p className="text-xl font-bold text-gold-900">
                               {salon.is_lifetime_free ? 'Acesso Vitalício' : salon.subscription_plan === 'FREE' ? 'Gratuito (Trial)' : salon.subscription_plan}
                           </p>
                       </div>
                       
                       <div>
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Validade</label>
                           <p className="text-3xl font-serif font-bold text-gold-600">
                               {salon.is_lifetime_free ? '∞' : `${daysLeft} dias`}
                           </p>
                           {!salon.is_lifetime_free && salon.subscription_end_date && (
                               <p className="text-sm text-gray-500 mt-1">
                                   Expira em: {format(new Date(salon.subscription_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                               </p>
                           )}
                       </div>
                   </div>

                   {/* Actions */}
                   <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center space-y-4">
                        <h3 className="font-bold text-gold-900 mb-2">Ações Rápidas</h3>
                        
                        <button 
                            onClick={handleRenewal}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">autorenew</span>
                            Renovar Atual
                        </button>

                        {!salon.is_lifetime_free && (
                            <button 
                                onClick={handleCancel}
                                className="w-full bg-white border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">cancel</span>
                                Solicitar Cancelamento
                            </button>
                        )}
                   </div>
               </div>
           </div>
       </div>

       {/* Available Plans Section */}
       <div>
           <h3 className="font-serif text-2xl font-bold text-gold-900 mb-6 text-center">Planos Disponíveis</h3>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => {
                    const isCurrent = salon.subscription_plan === plan.name || (salon.subscription_plan === 'FREE' && plan.price === 0);
                    
                    return (
                        <div key={plan.id} className={`bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col relative transition-transform hover:-translate-y-1 ${isCurrent ? 'border-gold-500 ring-1 ring-gold-500' : 'border-gold-100'}`}>
                            {plan.is_popular && !isCurrent && (
                                <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg z-10">Popular</div>
                            )}
                            
                            <div className="p-6 flex-1">
                                <h4 className="font-serif text-xl font-bold text-gold-900 mb-1">{plan.name}</h4>
                                <div className="text-3xl font-bold text-gray-800 mb-4">
                                    R$ {plan.price.toFixed(2)}
                                    <span className="text-sm text-gray-400 font-normal">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <span className="material-symbols-outlined text-gold-500 text-lg">check_circle</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                {isCurrent ? (
                                    <div className="w-full py-3 rounded-xl font-bold text-center bg-green-100 text-green-700 border border-green-200 cursor-default">
                                        Plano Atual
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleChangePlan(plan)}
                                        className="w-full bg-white border-2 border-gold-500 text-gold-600 hover:bg-gold-500 hover:text-white py-3 rounded-xl font-bold transition-all shadow-sm uppercase text-sm tracking-wider"
                                    >
                                        Escolher Este Plano
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
           </div>
       </div>
    </div>
  );
};
