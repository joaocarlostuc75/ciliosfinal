import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, Product, Salon, OrderStatus } from '../../types';

export const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);

  // Order Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setServices(await db.getServices());
      setProducts(await db.getProducts());
      setSalon(await db.getSalon());
    };
    load();
  }, []);

  const openOrderModal = (product: Product) => {
    setSelectedProduct(product);
    setClientName('');
    setClientPhone('');
  };

  const closeOrderModal = () => {
    setSelectedProduct(null);
    setIsOrderLoading(false);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !salon) return;
    setIsOrderLoading(true);

    try {
        // 1. Save Order to Database
        await db.createOrder({
            id: crypto.randomUUID(),
            salon_id: salon.id,
            product_id: selectedProduct.id,
            client_name: clientName,
            client_phone: clientPhone,
            status: OrderStatus.PENDING,
            created_at: new Date().toISOString()
        });

        // 2. Also try to create/update client in DB for future reference
        await db.createClient({
            id: crypto.randomUUID(),
            salon_id: salon.id,
            name: clientName,
            whatsapp: clientPhone,
            created_at: new Date().toISOString()
        });

        // 3. Redirect to WhatsApp
        const msg = `Olá! Tenho interesse no produto *${selectedProduct.name}* (R$ ${selectedProduct.price.toFixed(2)}). Meu nome é ${clientName}.`;
        window.location.href = `https://wa.me/55${salon.phone}?text=${encodeURIComponent(msg)}`;
        
        // Modal will close due to redirect, but just in case
        closeOrderModal();
    } catch (error) {
        alert("Ocorreu um erro ao registrar seu interesse. Tente novamente.");
        setIsOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-light pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-luxury-light/95 backdrop-blur-md z-30 px-6 py-4 border-b border-gold-200 shadow-sm flex items-center justify-between">
         <button onClick={() => navigate('/')} className="text-gold-700 p-2 -ml-2">
            <span className="material-symbols-outlined">arrow_back_ios</span>
         </button>
         <h1 className="font-serif font-bold text-gold-900 text-lg">Cílios de Luxo</h1>
         <div className="w-8" />
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-3 mt-4">
            <h2 className="font-serif text-3xl md:text-4xl text-gold-900">Menu Exclusivo</h2>
            <div className="w-20 h-1 bg-gold-300 mx-auto rounded-full" />
            <p className="text-sm md:text-base text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
                Explore nossos procedimentos estéticos e produtos de alta qualidade selecionados para você.
            </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            
            {/* SERVICES TAB */}
            {activeTab === 'services' && services.map((service) => (
                <div key={service.id} className="bg-white rounded-3xl p-4 shadow-lg border border-gold-50 group hover:border-gold-300 transition-all duration-300 flex flex-col">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-gray-100">
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gold-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {Math.floor(service.duration_min / 60)}h {service.duration_min % 60 > 0 ? `${service.duration_min % 60}m` : ''}
                        </span>
                    </div>
                    
                    <div className="space-y-3 px-1 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-serif text-lg font-bold text-gold-900 leading-tight">{service.name}</h3>
                            <span className="text-gold-600 font-bold font-sans whitespace-nowrap">R$ {service.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed flex-1">
                            {service.description}
                        </p>
                        
                        <button 
                            onClick={() => navigate(`/book/${service.id}`)}
                            className="w-full mt-4 bg-gold-500 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-gold-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                            AGENDAR
                        </button>
                    </div>
                </div>
            ))}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && products.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl p-4 shadow-lg border border-gold-50 group hover:border-gold-300 transition-all duration-300 flex flex-col">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-gray-100">
                        {product.image_url ? (
                             <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-gold-200">
                                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                             </div>
                        )}
                        <div className="absolute top-3 left-3">
                             <span className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.stock > 0 ? `${product.stock} un. disponíveis` : 'Esgotado'}
                             </span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 px-1 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-serif text-lg font-bold text-gold-900 leading-tight">{product.name}</h3>
                            <span className="text-gold-600 font-bold font-sans whitespace-nowrap">R$ {product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed flex-1">
                            {product.description || 'Produto de alta qualidade para manutenção e cuidados.'}
                        </p>
                        
                        <button 
                            onClick={() => openOrderModal(product)}
                            disabled={product.stock <= 0}
                            className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Order Modal */}
      {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl font-bold text-gold-900">Seus Dados</h3>
                    <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="mb-6 flex gap-3 bg-gold-50 p-3 rounded-lg border border-gold-100">
                      {selectedProduct.image_url && <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded object-cover" />}
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Interesse em:</p>
                          <p className="font-serif font-bold text-gold-900 leading-tight">{selectedProduct.name}</p>
                          <p className="text-xs text-gold-600 font-bold">R$ {selectedProduct.price.toFixed(2)}</p>
                      </div>
                  </div>

                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Nome Completo</label>
                          <input 
                              required
                              type="text"
                              value={clientName}
                              onChange={e => setClientName(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 transition-all"
                              placeholder="Seu nome"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">WhatsApp</label>
                          <input 
                              required
                              type="tel"
                              value={clientPhone}
                              onChange={e => setClientPhone(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 transition-all"
                              placeholder="(00) 00000-0000"
                          />
                      </div>

                      <button
                          type="submit"
                          disabled={isOrderLoading}
                          className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 mt-4"
                      >
                          {isOrderLoading ? 'Processando...' : (
                              <>
                                  <span className="material-symbols-outlined">chat</span>
                                  Confirmar no WhatsApp
                              </>
                          )}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};