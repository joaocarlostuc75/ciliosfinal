
import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { GlobalSettings } from '../../types';

export const SuperSettings: React.FC = () => {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [appName, setAppName] = useState('');
    const [broadcast, setBroadcast] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const s = await db.getGlobalSettings();
        setSettings(s);
        setAppName(s.app_name || 'J.C Sistemas');
        setBroadcast(s.broadcast_message || '');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (settings) {
            await db.saveGlobalSettings({
                ...settings,
                app_name: appName,
                broadcast_message: broadcast,
                updated_at: new Date().toISOString()
            });
            setMsg('Configurações salvas! Recarregue a página para ver mudanças globais.');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
             <div className="mb-8">
                <h3 className="font-serif text-xl font-bold text-gold-900">Configurações Globais</h3>
                <p className="text-sm text-gray-500">Personalize a marca do sistema e comunicação.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gold-100 overflow-hidden p-8">
                <form onSubmit={handleSave} className="space-y-8">
                    
                    {msg && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-bold text-center">
                            {msg}
                        </div>
                    )}

                    {/* White Label */}
                    <div>
                         <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                             <span className="material-symbols-outlined text-gold-500">branding_watermark</span>
                             White Label
                         </h4>
                         <div className="grid gap-4">
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase">Nome do Sistema (SaaS)</label>
                                 <input 
                                     className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500 mt-1"
                                     value={appName}
                                     onChange={e => setAppName(e.target.value)}
                                     placeholder="Ex: MinhaMarca Manager"
                                 />
                                 <p className="text-xs text-gray-400 mt-1">Isso altera o título do navegador e rodapés.</p>
                             </div>
                         </div>
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Broadcast */}
                    <div>
                         <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                             <span className="material-symbols-outlined text-red-500">campaign</span>
                             Mensagem Global (Broadcast)
                         </h4>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Conteúdo do Banner</label>
                             <input 
                                 className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500 mt-1"
                                 value={broadcast}
                                 onChange={e => setBroadcast(e.target.value)}
                                 placeholder="Ex: Manutenção programada domingo às 03:00h."
                             />
                             <p className="text-xs text-gray-400 mt-1">Deixe em branco para remover o banner do topo de todos os usuários.</p>
                         </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-gold-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-gold-600 shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
