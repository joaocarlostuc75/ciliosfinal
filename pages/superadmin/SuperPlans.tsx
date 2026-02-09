
import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { SystemPlan } from '../../types';

export const SuperPlans: React.FC = () => {
    const [plans, setPlans] = useState<SystemPlan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SystemPlan | null>(null);
    const [formData, setFormData] = useState<Partial<SystemPlan>>({ name: '', price: 0, features: [], is_popular: false, is_public: true });
    const [featuresInput, setFeaturesInput] = useState('');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        const data = await db.getSystemPlans();
        setPlans(data);
    };

    const handleEdit = (plan: SystemPlan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setFeaturesInput(plan.features.join('\n'));
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({ name: '', price: 0, period: 'monthly', features: [], is_popular: false, is_public: true });
        setFeaturesInput('');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm('Tem certeza que deseja excluir este plano?')) {
            await db.deleteSystemPlan(id);
            loadPlans();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const features = featuresInput.split('\n').filter(f => f.trim() !== '');
        
        const planToSave: SystemPlan = {
            id: editingPlan ? editingPlan.id : crypto.randomUUID(),
            name: formData.name || 'Novo Plano',
            price: Number(formData.price),
            period: (formData.period as 'monthly' | 'yearly') || 'monthly',
            features: features,
            is_popular: formData.is_popular,
            is_public: formData.is_public !== undefined ? formData.is_public : true
        };

        await db.saveSystemPlan(planToSave);
        setIsModalOpen(false);
        loadPlans();
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-serif text-xl font-bold text-gold-900">Planos de Assinatura</h3>
                    <p className="text-sm text-gray-500">Configure os pacotes disponíveis para os salões.</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Plano
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col relative group hover:-translate-y-1 transition-transform duration-300 ${!plan.is_public ? 'border-gray-300 opacity-80' : 'border-gold-100'}`}>
                         
                         {plan.is_popular && (
                             <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg z-10">Popular</div>
                         )}

                         {!plan.is_public && (
                             <div className="absolute top-0 left-0 bg-gray-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-br-lg z-10 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[10px]">visibility_off</span> Privado
                             </div>
                         )}
                         
                         <div className="p-6 border-b border-gray-100 flex-1">
                             <h4 className="font-serif text-xl font-bold text-gold-900 mb-1">{plan.name}</h4>
                             <div className="text-3xl font-bold text-gray-800 mb-4">
                                 R$ {plan.price.toFixed(2)}
                                 <span className="text-sm text-gray-400 font-normal">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span>
                             </div>
                             <ul className="space-y-2">
                                 {plan.features.map((feat, i) => (
                                     <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                         <span className="material-symbols-outlined text-gold-500 text-lg">check_circle</span>
                                         {feat}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                         
                         <div className="p-4 bg-gray-50 flex gap-2 justify-end">
                             <button onClick={() => handleEdit(plan)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold uppercase">
                                 <span className="material-symbols-outlined text-lg">edit</span> Editar
                             </button>
                             <button onClick={() => handleDelete(plan.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold uppercase">
                                 <span className="material-symbols-outlined text-lg">delete</span> Excluir
                             </button>
                         </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                        <h3 className="font-serif text-2xl font-bold mb-6 text-gold-900">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Plano</label>
                                <input required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                                    <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Período</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500 bg-white" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value as 'monthly' | 'yearly'})}>
                                        <option value="monthly">Mensal</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 mt-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 flex-1">
                                    <input type="checkbox" className="w-5 h-5 accent-gold-500" checked={formData.is_popular} onChange={e => setFormData({...formData, is_popular: e.target.checked})} />
                                    <span className="text-xs font-bold uppercase text-gray-500">Popular</span>
                                </label>
                                
                                <label className="flex items-center gap-2 mt-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 flex-1">
                                    <input type="checkbox" className="w-5 h-5 accent-gold-500" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} />
                                    <span className="text-xs font-bold uppercase text-gray-500">Público</span>
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Recursos (um por linha)</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500 h-32 text-sm" 
                                    value={featuresInput}
                                    onChange={e => setFeaturesInput(e.target.value)}
                                    placeholder="Ex: Agenda Ilimitada&#10;Suporte VIP"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-lg shadow hover:bg-gold-600">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
