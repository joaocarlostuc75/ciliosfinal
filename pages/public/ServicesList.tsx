import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, Product } from '../../types';

export const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      setServices(await db.getServices());
      setProducts(await db.getProducts());
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
         <h1 className="font-serif font-bold text-gold-900 text-lg">Cílios de Luxo</h1>
         <div className="w-8" />
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-3 mt-4 animate-fade-in">
            <h2 className="font-serif text-3xl md:text-4xl text-gold-900">Menu Exclusivo</h2>
            <div className="w-20 h-1 bg-gold-300 mx-auto rounded-full" />
            <p className="text-sm md:text-base text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
                Explore nossos procedimentos estéticos e produtos de alta qualidade selecionados para você.
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
                    className="bg-white rounded-[2rem] p-4 shadow-lg border border-gold-50 group hover:border-gold-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-5 relative bg-gray-100 shadow-inner">
                        <img 
                            src={service.image_url} 
                            alt={service.name} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                        <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur text-gold-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border border-gold-100">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {Math.floor(service.duration_min / 60)}h {service.duration_min % 60 > 0 ? `${service.duration_min % 60}m` : ''}
                        </span>
                    </div>
                    
                    <div className="space-y-3 px-1 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight group-hover:text-gold-600 transition-colors">{service.name}</h3>
                            <span className="text-gold-600 font-bold font-sans whitespace-nowrap bg-gold-50 px-2 py-1 rounded-lg">R$ {service.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed flex-1 border-t border-gray-50 pt-3 mt-1">
                            {service.description}
                        </p>
                        
                        <button 
                            onClick={() => navigate(`/book/${service.id}`)}
                            className="w-full mt-4 bg-gold-500 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-gold-600 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group-hover:bg-gold-600"
                        >
                            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                            AGENDAR
                        </button>
                    </div>
                </div>
            ))}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && products.map((product, index) => (
                <div 
                    key={product.id} 
                    className="bg-white rounded-[2rem] p-4 shadow-lg border border-gold-50 group hover:border-gold-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-5 relative bg-gray-100 shadow-inner">
                        {product.image_url ? (
                             <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                             />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-gold-200 group-hover:text-gold-300 transition-colors">
                                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                             </div>
                        )}
                        <div className="absolute top-3 left-3">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md border ${product.stock > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {product.stock > 0 ? `${product.stock} un. disponíveis` : 'Esgotado'}
                             </span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 px-1 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight group-hover:text-gold-600 transition-colors">{product.name}</h3>
                            <span className="text-gold-600 font-bold font-sans whitespace-nowrap bg-gold-50 px-2 py-1 rounded-lg">R$ {product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed flex-1 border-t border-gray-50 pt-3 mt-1">
                            {product.description || 'Produto de alta qualidade para manutenção e cuidados.'}
                        </p>
                        
                        <button 
                            onClick={() => navigate(`/order/${product.id}`)}
                            disabled={product.stock <= 0}
                            className="w-full mt-4 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-black hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            <span className="material-symbols-outlined text-lg">shopping_bag</span>
                            {product.stock > 0 ? 'TENHO INTERESSE' : 'INDISPONÍVEL'}
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Empty States */}
        {activeTab === 'services' && services.length === 0 && (
            <div className="text-center py-20 text-gray-400">Nenhum serviço disponível no momento.</div>
        )}
        {activeTab === 'products' && products.length === 0 && (
            <div className="text-center py-20 text-gray-400">Nenhum produto cadastrado no momento.</div>
        )}

      </main>
    </div>
  );
};