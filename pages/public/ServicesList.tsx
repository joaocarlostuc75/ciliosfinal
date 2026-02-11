
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Service, Product, Salon, OrderStatus } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';

interface CartItem {
    product: Product;
    quantity: number;
}

export const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [observation, setObservation] = useState(''); // Global observation for the order
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setServices(await db.getServices());
      setProducts(await db.getProducts());
      setSalon(await db.getSalon());
    };
    load();
  }, []);

  // --- Cart Logic ---

  const addToCart = (product: Product) => {
      setCart(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) {
              // Check stock limit
              if (existing.quantity >= product.stock) return prev;
              return prev.map(item => 
                  item.product.id === product.id 
                      ? { ...item, quantity: item.quantity + 1 } 
                      : item
              );
          }
          return [...prev, { product, quantity: 1 }];
      });
  };

  const updateQuantity = (productId: string, delta: number) => {
      setCart(prev => {
          return prev.map(item => {
              if (item.product.id === productId) {
                  const newQty = item.quantity + delta;
                  // Remove if 0, cap at stock
                  if (newQty <= 0) return null;
                  if (newQty > item.product.stock) return item; 
                  return { ...item, quantity: newQty };
              }
              return item;
          }).filter(Boolean) as CartItem[];
      });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const handleCheckout = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!salon) return;
      
      if (clientPhone.replace(/\D/g, '').length < 10) {
          alert('Por favor, insira um número de WhatsApp válido.');
          return;
      }

      setIsSubmitting(true);

      try {
          // 1. Create/Update Client
          await db.createClient({
              id: crypto.randomUUID(),
              salon_id: salon.id,
              name: clientName,
              whatsapp: clientPhone,
              created_at: new Date().toISOString()
          });

          // 2. Create Order Records (One per item type for simpler DB schema management)
          // In a real relational DB we would have Orders and OrderItems, but here we simulate.
          for (const item of cart) {
              // We register multiple orders or one consolidated? 
              // To keep OrdersManager working, we create one record per product line.
              // Note: This is a simplification for the mock DB structure.
              await db.createOrder({
                  id: crypto.randomUUID(),
                  salon_id: salon.id,
                  product_id: item.product.id,
                  client_name: clientName,
                  client_phone: clientPhone,
                  status: OrderStatus.PENDING,
                  created_at: new Date().toISOString()
              });
          }

          // 3. Build WhatsApp Message
          let msg = `Olá! Gostaria de fazer um pedido:\n\n`;
          cart.forEach(item => {
              msg += `▪ ${item.quantity}x ${item.product.name}\n`;
          });
          
          msg += `\n*Total:* R$ ${cartTotal.toFixed(2)}`;
          
          if (observation.trim()) {
              msg += `\n\n*Observações:* ${observation}`;
          }
          
          msg += `\n\nMeu nome é: ${clientName}`;

          // 4. Redirect
          const waLink = `https://wa.me/55${salon.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
          
          // Reset
          setCart([]);
          setIsCartOpen(false);
          setObservation('');
          
      } catch (error) {
          alert('Erro ao processar pedido. Tente novamente.');
          console.error(error);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="min-h-screen bg-luxury-light pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 bg-luxury-light/95 backdrop-blur-md z-30 px-6 py-4 border-b border-gold-200 shadow-sm flex items-center justify-between">
         <button onClick={() => navigate('/')} className="text-gold-700 p-2 -ml-2 hover:bg-gold-50 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
         </button>
         <h1 className="font-serif font-bold text-gold-900 text-lg">{salon?.name || 'Menu'}</h1>
         <button onClick={() => navigate('/my-schedule')} className="text-gold-700 p-2 hover:bg-gold-50 rounded-full transition-colors" title="Meu Histórico">
            <span className="material-symbols-outlined">history</span>
         </button>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-3 mt-4 animate-fade-in">
            <h2 className="font-serif text-3xl md:text-4xl text-gold-900">{activeTab === 'services' ? 'Nossos Serviços' : 'Boutique & Produtos'}</h2>
            <div className="w-20 h-1 bg-gold-300 mx-auto rounded-full" />
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
                    <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
                        <ImageWithFallback 
                            src={service.image_url} 
                            alt={service.name} 
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                            fallbackIcon="spa"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40 pointer-events-none" />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gold-100 z-10 group-hover:scale-105 transition-transform">
                            <span className="text-gold-700 font-bold font-sans text-sm">R$ {service.price.toFixed(2)}</span>
                        </div>
                        <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {Math.floor(service.duration_min / 60)}h {service.duration_min % 60 > 0 ? `${service.duration_min % 60}m` : ''}
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1 relative">
                        <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight mb-2 group-hover:text-gold-600 transition-colors line-clamp-1">{service.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-6">
                            {service.description}
                        </p>
                        <button className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase shadow-md group-hover:bg-gold-500 group-hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                            Agendar
                        </button>
                    </div>
                </div>
            ))}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && products.map((product, index) => {
                const inCart = cart.find(i => i.product.id === product.id);
                const quantityInCart = inCart ? inCart.quantity : 0;
                const remainingStock = product.stock - quantityInCart;

                return (
                    <div 
                        key={product.id} 
                        className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 hover:border-gold-300 transition-all duration-300 flex flex-col h-full animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
                            <ImageWithFallback 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                                fallbackIcon="inventory_2"
                            />
                            
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gold-100 z-10">
                                <span className="text-gold-700 font-bold font-sans text-sm">R$ {product.price.toFixed(2)}</span>
                            </div>

                            <div className="absolute bottom-4 left-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md border backdrop-blur-sm ${
                                    remainingStock > 0 
                                    ? 'bg-green-50/90 text-green-700 border-green-100' 
                                    : 'bg-red-50/90 text-red-700 border-red-100'
                                }`}>
                                    {remainingStock > 0 ? `${remainingStock} un. disponíveis` : 'Esgotado'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className="font-serif text-xl font-bold text-gold-900 leading-tight mb-2 line-clamp-1">{product.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-6">
                                {product.description || 'Produto de alta qualidade.'}
                            </p>
                            
                            {inCart ? (
                                <div className="flex items-center justify-between bg-gold-50 rounded-xl p-1 border border-gold-200">
                                    <button 
                                        onClick={() => updateQuantity(product.id, -1)}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gold-700 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">{inCart.quantity === 1 ? 'delete' : 'remove'}</span>
                                    </button>
                                    <span className="font-bold text-gold-900 w-8 text-center">{inCart.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(product.id, 1)}
                                        disabled={remainingStock <= 0}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gold-700 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase shadow-md hover:bg-gold-500 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:hover:bg-gray-900"
                                >
                                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                                    {product.stock > 0 ? 'Adicionar' : 'Indisponível'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
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

      {/* Floating Cart Button */}
      {cart.length > 0 && !isCartOpen && (
          <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-gold-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform border-4 border-white"
              >
                  <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                  <span className="font-bold pr-1">{cartCount} item(s)</span>
                  <span className="bg-white text-gold-600 px-2 py-0.5 rounded-full text-xs font-bold shadow-inner">
                      R$ {cartTotal.toFixed(2)}
                  </span>
              </button>
          </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-fade-in overflow-hidden">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gold-50">
                      <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-gold-600">shopping_cart</span>
                          <div>
                              <h3 className="font-serif font-bold text-lg text-gold-900">Seu Carrinho</h3>
                              <p className="text-xs text-gray-500">{cartCount} itens selecionados</p>
                          </div>
                      </div>
                      <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-red-500">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Items List */}
                      <div className="space-y-4">
                          {cart.map(item => (
                              <div key={item.product.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                  <div className="w-16 h-16 rounded-lg bg-white overflow-hidden border border-gray-200 shrink-0">
                                      <ImageWithFallback src={item.product.image_url} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <h4 className="font-bold text-gray-800 text-sm truncate">{item.product.name}</h4>
                                      <div className="flex justify-between items-end">
                                          <p className="text-gold-600 font-bold text-sm">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                                          
                                          {/* Mini Control */}
                                          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm h-8">
                                              <button onClick={() => updateQuantity(item.product.id, -1)} className="px-2 text-gray-500 hover:text-red-500">
                                                  <span className="material-symbols-outlined text-sm">remove</span>
                                              </button>
                                              <span className="text-xs font-bold px-1">{item.quantity}</span>
                                              <button 
                                                onClick={() => updateQuantity(item.product.id, 1)} 
                                                className="px-2 text-gray-500 hover:text-green-600 disabled:opacity-30"
                                                disabled={item.quantity >= item.product.stock}
                                              >
                                                  <span className="material-symbols-outlined text-sm">add</span>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Observations Input */}
                      <div>
                          <label className="text-xs font-bold text-gold-700 uppercase tracking-wider mb-2 block">
                              Observações do Pedido
                          </label>
                          <textarea 
                              value={observation}
                              onChange={(e) => setObservation(e.target.value)}
                              placeholder="Ex: Prefiro a cor vermelha, tamanho M, embrulhar para presente..."
                              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-gold-500 outline-none min-h-[80px]"
                          />
                      </div>

                      {/* Client Info */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div>
                              <label className="text-xs font-bold text-gold-700 uppercase tracking-wider">Seu Nome</label>
                              <input 
                                  required
                                  value={clientName}
                                  onChange={e => setClientName(e.target.value)}
                                  className="w-full border border-gray-300 rounded-xl p-3 mt-1 outline-none focus:border-gold-500"
                                  placeholder="Como devemos te chamar?"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gold-700 uppercase tracking-wider">Seu WhatsApp</label>
                              <input 
                                  required
                                  value={clientPhone}
                                  onChange={e => setClientPhone(formatPhone(e.target.value))}
                                  className="w-full border border-gray-300 rounded-xl p-3 mt-1 outline-none focus:border-gold-500"
                                  placeholder="(00) 00000-0000"
                                  maxLength={15}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center mb-4 px-2">
                          <span className="text-gray-500 font-medium">Total do Pedido</span>
                          <span className="text-2xl font-bold text-gold-900">R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <button 
                          onClick={handleCheckout}
                          disabled={isSubmitting || !clientName || clientPhone.length < 10}
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          {isSubmitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">chat</span>}
                          Finalizar no WhatsApp
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
