
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, Product, Salon } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';

export const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);

  useEffect(() => {
    const load = async () => {
      setServices(await db.getServices());
      setProducts(await db.getProducts());
      setSalon(await db.getSalon());
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-luxury-light pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-luxury-light/95 backdrop-blur-md z-30 px-6 py-4 border-b border-gold-200 shadow-sm flex items-center justify-between">
         <button onClick={() => navigate('/')} className="text-gold-700 p-2 -ml-2 hover:bg-gold-50 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
         </button>
         <h1 className="font-serif font-bold text-gold-900 text-lg">{salon?.name || 'Cílios de Luxo'}</h1>
         <button onClick={() => navigate('/my-schedule')} className="text-gold-700 p-2 hover:bg-gold-50 rounded-full transition-colors" title="Minha Agenda">
            <span className="material-symbols-outlined">event_note</span>
         </button>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-3 mt-4 animate-fade-in">
            <h2 className="font-serif text-3xl md:text-4xl text-gold-900">{salon?.name || 'Menu Exclusivo'}</h2>
            <div className="w-20 h-1 bg-gold-300 mx-auto rounded-full" />
            <p className="text-sm md:text-base text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
                Explore nossos procedimentos e produtos de alta qualidade selecionados para você.
            </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 animate-fade-in">
            <div className="bg-white p-1 rounded-full shadow-md border border-gold-100 inline-flex">
                <button 
                    onClick={() => setActiveTab('services')}
                    className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'services' 
                        ? 'bg-gold-500 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gold-600'
                    }`}
                >
                    Serviços
                </button>
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'products' 
                        ? 'bg-gold-500 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gold-600'
                    }`}
                >
                    Produtos
                </button>
            </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            
            {/* SERVICES TAB */}
            {activeTab === 'services' && services.map((service, index) => (
                <div 
                    key={service.id} 
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 hover:border-gold-300 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/book/${service.id}`)}
                >
                    {/* Image Area with Zoom Effect */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
                        <ImageWithFallback 
                            src={service.image_url} 
                            alt={service.name} 
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                            fallbackIcon="spa"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40 pointer-events-none" />
                        
                        {/* Floating Price Tag */}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gold-100 z-10 group-hover:scale-105 transition-transform">
                            <span className="text-gold-700 font-bold font-sans text-sm">R$ {service.price.toFixed(2)}</span>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {Math.floor(service.duration_min / 60)}h {service.duration_min % 60 > 0 ? `${service.duration_min % 60}m` : ''}
                        </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-6 flex flex-col flex-1 relative">
                        <div className="absolute -top-6 right-6 w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight mb-2 group-hover:text-gold-600 transition-colors line-clamp-1">{service.name}</h3>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-6">
                            {service.description}
                        </p>
                        
                        <button 
                            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase shadow-md group-hover:bg-gold-500 group-hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                            Agendar
                        </button>
                    </div>
                </div>
            ))}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && products.map((product, index) => (
                <div 
                    key={product.id} 
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 hover:border-gold-300 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {/* Image Area with Zoom */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
                        <ImageWithFallback 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                            fallbackIcon="inventory_2"
                        />
                        
                        {/* Floating Price Tag */}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gold-100 z-10">
                            <span className="text-gold-700 font-bold font-sans text-sm">R$ {product.price.toFixed(2)}</span>
                        </div>

                        {/* Stock Badge */}
                        <div className="absolute bottom-4 left-4">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md border backdrop-blur-sm ${
                                product.stock > 0 
                                ? 'bg-green-50/90 text-green-700 border-green-100' 
                                : 'bg-red-50/90 text-red-700 border-red-100'
                             }`}>
                                {product.stock > 0 ? `${product.stock} un. disponíveis` : 'Esgotado'}
                             </span>
                        </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight mb-2 group-hover:text-gold-600 transition-colors line-clamp-1">{product.name}</h3>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-6">
                            {product.description || 'Produto de alta qualidade para manutenção e cuidados.'}
                        </p>
                        
                        <button 
                            onClick={() => navigate(`/order/${product.id}`)}
                            disabled={product.stock <= 0}
                            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase shadow-md hover:bg-gold-500 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:hover:bg-gray-900"
                        >
                            <span className="material-symbols-outlined text-lg">shopping_bag</span>
                            {product.stock > 0 ? 'Tenho Interesse' : 'Indisponível'}
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Empty States */}
        {activeTab === 'services' && services.length === 0 && (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">spa</span>
                <p>Nenhum serviço disponível no momento.</p>
            </div>
        )}
        {activeTab === 'products' && products.length === 0 && (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">inventory_2</span>
                <p>Nenhum produto cadastrado no momento.</p>
            </div>
        )}

      </main>
    </div>
  );
};
