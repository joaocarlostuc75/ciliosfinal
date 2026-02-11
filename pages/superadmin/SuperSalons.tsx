
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Salon, SubscriptionStatus } from '../../types';
import { format, differenceInDays } from 'date-fns';

// Constants for filter options
const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'TRIAL', label: 'Em Teste (Trial)' },
    { value: 'EXPIRED', label: 'Expirado' },
    { value: 'BLOCKED', label: 'Bloqueado' },
    { value: 'CANCELLED', label: 'Cancelado' },
];

const EXPIRATION_OPTIONS = [
    { value: 'UPCOMING_7', label: 'Vence em 7 dias' },
    { value: 'UPCOMING_30', label: 'Vence em 30 dias' },
    { value: 'EXPIRED_REAL', label: 'Já Vencidos' },
];

// Internal MultiSelect Component
const MultiSelectFilter: React.FC<{
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (values: string[]) => void;
    icon: string;
}> = ({ label, options, selected, onChange, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    selected.length > 0 
                    ? 'bg-gold-50 border-gold-200 text-gold-900' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gold-300'
                }`}
            >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
                {selected.length > 0 && (
                    <span className="ml-1 bg-gold-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                        {selected.length}
                    </span>
                )}
                <span className="material-symbols-outlined text-sm ml-1 opacity-50">expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-60 bg-white rounded-xl shadow-xl border border-gold-100 z-50 overflow-hidden animate-fade-in">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        {options.map((opt) => {
                            const isSelected = selected.includes(opt.value);
                            return (
                                <div 
                                    key={opt.value} 
                                    onClick={() => toggleOption(opt.value)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                                        isSelected ? 'bg-gold-50 text-gold-900 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-gold-500 border-gold-500' : 'border-gray-300'
                                    }`}>
                                        {isSelected && <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>}
                                    </div>
                                    {opt.label}
                                </div>
                            );
                        })}
                    </div>
                    {selected.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-100 p-2">
                            <button 
                                onClick={() => { onChange([]); setIsOpen(false); }}
                                className="w-full text-center text-xs text-red-500 font-bold hover:underline"
                            >
                                Limpar Seleção
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const SuperSalons: React.FC = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState<Salon[]>([]);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Multi-Select State
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedExpirations, setSelectedExpirations] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatuses, selectedExpirations]);

    const loadData = async () => {
        setSalons(await db.getAllSalons());
    };

    const handleImpersonate = async (salonId: string) => {
        if (confirm('Você entrará no sistema como este salão. Continuar?')) {
            try {
                await db.impersonateSalon(salonId);
                navigate('/admin'); 
                window.location.reload(); 
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

    // --- FILTERING LOGIC ---
    const filteredSalons = salons.filter(s => {
        // 1. Text Search
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Status Filter (Multi-select OR logic)
        // If nothing selected, match all. If selected, status must be in list.
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.subscription_status);

        // 3. Expiration Filter (Multi-select OR logic)
        let matchesExpiration = selectedExpirations.length === 0; // If nothing selected, match all
        
        if (selectedExpirations.length > 0) {
            // Lifetime accounts don't match expiration filters usually
            if (!s.is_lifetime_free && s.subscription_end_date) {
                const days = differenceInDays(new Date(s.subscription_end_date), new Date());
                
                const matchesExpired = selectedExpirations.includes('EXPIRED_REAL') && days < 0;
                const matchesUp7 = selectedExpirations.includes('UPCOMING_7') && days >= 0 && days <= 7;
                const matchesUp30 = selectedExpirations.includes('UPCOMING_30') && days >= 0 && days <= 30;

                if (matchesExpired || matchesUp7 || matchesUp30) {
                    matchesExpiration = true;
                }
            }
        }

        return matchesSearch && matchesStatus && matchesExpiration;
    });

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredSalons.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSalons = filteredSalons.slice(startIndex, startIndex + itemsPerPage);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'ACTIVE': return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold border border-green-200">Ativo</span>;
            case 'TRIAL': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">Trial</span>;
            case 'BLOCKED': return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200">Bloqueado</span>;
            case 'EXPIRED': return <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">Expirado</span>;
            case 'CANCELLED': return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">Cancelado</span>;
            default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">{status}</span>;
        }
    };

    const getExpirationDisplay = (salon: Salon) => {
        if (salon.is_lifetime_free) return <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Vitalício</span>;
        if (!salon.subscription_end_date) return <span className="text-gray-400 text-xs">-</span>;
        
        const days = differenceInDays(new Date(salon.subscription_end_date), new Date());
        
        if (days < 0) return <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full">Vencido ({Math.abs(days)}d)</span>;
        if (days <= 5) return <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-0.5 rounded-full">Vence em {days}d</span>;
        return <span className="text-green-600 font-bold text-xs">{days} dias</span>;
    };

    const getHealthDisplay = (salon: Salon) => {
        if (!salon.last_login) return <span className="text-gray-400 text-xs">Nunca</span>;
        const days = differenceInDays(new Date(), new Date(salon.last_login));
        
        if (days > 30) return <span className="text-red-500 font-bold text-xs">Risco (30d+)</span>;
        if (days > 7) return <span className="text-yellow-600 font-bold text-xs">Ausente (7d+)</span>;
        return <span className="text-green-600 font-bold text-xs">Ativo</span>;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatuses([]);
        setSelectedExpirations([]);
    };

    const hasActiveFilters = selectedStatuses.length > 0 || selectedExpirations.length > 0 || searchTerm !== '';

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h3 className="font-serif text-xl font-bold text-gold-900">Salões Cadastrados</h3>
                    <p className="text-sm text-gray-500">Gerencie o acesso, assinaturas e monitore a saúde da base.</p>
                </div>
            </div>

            {/* Advanced Filters Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gold-100 mb-6 flex flex-col lg:flex-row gap-4 items-center z-20 relative">
                
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar salão ou email..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    
                    <MultiSelectFilter 
                        label="Status" 
                        icon="verified"
                        options={STATUS_OPTIONS}
                        selected={selectedStatuses}
                        onChange={setSelectedStatuses}
                    />

                    <MultiSelectFilter 
                        label="Vencimento" 
                        icon="event_busy"
                        options={EXPIRATION_OPTIONS}
                        selected={selectedExpirations}
                        onChange={setSelectedExpirations}
                    />

                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters}
                            className="px-3 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1 font-bold text-xs uppercase tracking-wide"
                            title="Limpar Filtros"
                        >
                            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Results Info */}
            <div className="flex justify-between items-center mb-2 px-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Mostrando {paginatedSalons.length} de {filteredSalons.length} resultados
                </p>
                {filteredSalons.length > 0 && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-30 text-gold-700"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <span className="text-sm font-bold text-gray-600 self-center">
                            Pág {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-30 text-gold-700"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100 z-10 relative">
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
                            {paginatedSalons.map(salon => (
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
                            {paginatedSalons.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-30">search_off</span>
                                        <p>Nenhum salão encontrado com os filtros atuais.</p>
                                        <button onClick={clearFilters} className="text-gold-600 text-sm font-bold mt-2 hover:underline">
                                            Limpar filtros
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer (Mobile friendly) */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                         <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gold-600 disabled:opacity-50"
                         >
                             <span className="material-symbols-outlined text-sm">arrow_back</span> Anterior
                         </button>
                         
                         <span className="text-xs font-bold text-gold-900 bg-white px-3 py-1 rounded-full border border-gold-100 shadow-sm">
                             {currentPage} / {totalPages}
                         </span>

                         <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gold-600 disabled:opacity-50"
                         >
                             Próximo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                         </button>
                    </div>
                )}
            </div>
        </div>
    );
};
