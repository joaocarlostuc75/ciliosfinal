
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
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  
  // Checkout Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [cityState, setCityState] = useState('');
  const [observation, setObservation] = useState('');
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

  // STEP 1: Confirm Order and Register in Admin
  const handleConfirmOrder = async () => {
      if (!salon) return;
      setIsSubmitting(true);
      
      try {
          // Register order as "Pending/Awaiting data" in mock DB
          for (const item of cart) {
              await db.createOrder({
                  id: crypto.randomUUID(),
                  salon_id: salon.id,
                  product_id: item.product.id,
                  client_name: "Cliente em Preenchimento",
                  client_phone: "---",
                  status: OrderStatus.PENDING,
                  created_at: new Date().toISOString()
              });
          }
          
          setOrderConfirmed(true);
          setTimeout(() => {
              setIsCartOpen(false);
              setIsRegistrationOpen(true);
              setOrderConfirmed(false);
              setIsSubmitting(false);
          }, 1200);
      } catch (error) {
          alert('Erro ao registrar pedido.');
          setIsSubmitting(false);
      }
  };

  // STEP 2: Finalize on WhatsApp
  const handleFinalizeWhatsApp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!salon) return;
      
      setIsSubmitting(true);

      try {
          // Update/Create Client
          await db.createClient({
              id: crypto.randomUUID(),
              salon_id: salon.id,
              name: clientName,
              whatsapp: clientPhone,
              created_at: new Date().toISOString()
          });

          // Build Message
          let msg = `*Novo Pedido!*\n\n`;
          msg += `*Itens:*\n`;
          cart.forEach(item => {
              msg += `- ${item.product.name} (Quantidade: ${item.quantity}) - R$ ${item.product.price.toFixed(2)}\n`;
          });
          
          msg += `\n*Total:* R$ ${cartTotal.toFixed(2)}\n\n`;
          msg += `*Cliente:*\n`;
          msg += `Nome: ${clientName}\n`;
          msg += `WhatsApp: ${clientPhone}\n`;
          msg += `Endereço: ${address}\n`;
          msg += `Referência: ${reference}\n`;
          msg += `Cidade: ${cityState}\n\n`;
          
          if (observation.trim()) {
              msg += `*Observações do Pedido:*\n${observation}\n\n`;
          }
          
          msg += `_Link do pedido: ${window.location.origin}/#/admin/orders_`;

          const waLink = `https://wa.me/55${salon.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
          
          // Success & Reset
          setCart([]);
          setIsRegistrationOpen(false);
          setObservation('');
          setAddress('');
          setReference('');
          setCityState('');
          
      } catch (error) {
          alert('Erro ao processar.');
      } finally {
          setIsSubmitting(false);
      }
  };

  const isFormValid = clientName.trim() !== '' && clientPhone.replace(/\D/g, '').length >= 10 && address.trim() !== '' && reference.trim() !== '' && cityState.trim() !== '';

  return (
    <div className="min-h-screen bg-luxury-light dark:bg-luxury-charcoal pb-24 relative font-sans text-[#333] dark:text-gray-200 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 dark:bg-luxury-card/95 backdrop-blur-md z-30 px-6 py-4 border-b border-gray-200 dark:border-luxury-border shadow-sm flex items-center justify-between">
         <button onClick={() => navigate('/')} className="text-[#333] dark:text-gray-200 p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
         </button>
         <h1 className="font-serif font-bold text-gray-900 dark:text-gold-500 text-lg">{salon?.name || 'Menu'}</h1>
         <button onClick={() => navigate('/my-schedule')} className="text-[#333] dark:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">history</span>
         </button>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3 mt-4 animate-fade-in">
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 dark:text-gold-500">{activeTab === 'services' ? 'Nossos Serviços' : 'Boutique & Produtos'}</h2>
            <div className="w-16 h-1 bg-blue-600 dark:bg-gold-600 mx-auto rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 animate-fade-in">
            <div className="bg-gray-100 dark:bg-luxury-card p-1 rounded-full shadow-inner inline-flex border border-gray-200 dark:border-luxury-border">
                <button 
                    onClick={() => setActiveTab('services')}
                    className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'services' ? 'bg-white dark:bg-gold-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Serviços
                </button>
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'products' ? 'bg-white dark:bg-gold-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Produtos
                </button>
            </div>
        </div>

        {/* Grid Content */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeTab === 'services' && services.map((service, index) => (
                <div 
                    key={service.id} 
                    className="group bg-white dark:bg-luxury-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-200 dark:border-luxury-border transition-all duration-300 flex flex-col h-full animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/book/${service.id}`)}
                >
                    <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-zinc-800">
                        <ImageWithFallback src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackIcon="spa" />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-luxury-card/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-luxury-border">
                            <span className="text-blue-600 dark:text-gold-500 font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gold-500 mb-2">{service.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 flex-1">{service.description}</p>
                        <button className="w-full bg-gray-900 dark:bg-zinc-800 text-white py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-blue-600 dark:hover:bg-gold-600 transition-colors flex items-center justify-center gap-2 border border-transparent dark:border-luxury-border">
                            Agendar
                        </button>
                    </div>
                </div>
            ))}

            {activeTab === 'products' && products.map((product, index) => {
                const inCart = cart.find(i => i.product.id === product.id);
                const qty = inCart ? inCart.quantity : 0;
                const available = product.stock - qty;
                return (
                    <div 
                        key={product.id} 
                        className="group bg-white dark:bg-luxury-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-200 dark:border-luxury-border transition-all duration-300 flex flex-col h-full animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-zinc-800">
                            <ImageWithFallback src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackIcon="inventory_2" />
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-luxury-card/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-luxury-border">
                                <span className="text-blue-600 dark:text-gold-500 font-bold text-sm">R$ {product.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gold-500 mb-2">{product.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 flex-1">{product.description}</p>
                            
                            {inCart ? (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-1 border border-gray-200 dark:border-luxury-border">
                                    <button onClick={() => updateQuantity(product.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 hover:text-red-600">
                                        <span className="material-symbols-outlined text-sm">{qty === 1 ? 'delete' : 'remove'}</span>
                                    </button>
                                    <span className="font-bold text-gray-900 dark:text-white">{qty}</span>
                                    <button onClick={() => updateQuantity(product.id, 1)} disabled={available <= 0} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 hover:text-green-600 disabled:opacity-30">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => addToCart(product)} 
                                    disabled={product.stock <= 0} 
                                    className="w-full bg-gray-900 dark:bg-zinc-800 text-white py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-blue-600 dark:hover:bg-gold-600 transition-colors disabled:opacity-50 border border-transparent dark:border-luxury-border"
                                >
                                    {product.stock > 0 ? 'Adicionar' : 'Esgotado'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* Floating Cart FAB */}
      {cart.length > 0 && !isCartOpen && !isRegistrationOpen && (
          <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-blue-600 dark:bg-gold-600 text-white p-5 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all border-4 border-white dark:border-luxury-charcoal"
              >
                  <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                  <div className="flex flex-col items-start leading-none pr-1">
                      <span className="text-[10px] font-bold uppercase opacity-80">Carrinho</span>
                      <span className="text-sm font-bold">R$ {cartTotal.toFixed(2)}</span>
                  </div>
              </button>
          </div>
      )}

      {/* STEP 1 MODAL: Cart Review */}
      {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white dark:bg-luxury-card w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col animate-fade-in overflow-hidden border-t dark:border-luxury-border">
                  <div className="p-6 border-b border-gray-100 dark:border-luxury-border flex justify-between items-center bg-gray-50 dark:bg-zinc-900/30">
                      <div>
                          <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-gold-500">Seu Carrinho</h3>
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{cartCount} itens</p>
                      </div>
                      <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-4">
                          {cart.map(item => (
                              <div key={item.product.id} className="flex gap-4 p-4 border border-gray-100 dark:border-luxury-border rounded-3xl bg-white dark:bg-luxury-card shadow-sm transition-all hover:border-gray-200">
                                  <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-zinc-800 overflow-hidden border border-gray-200 dark:border-luxury-border shrink-0">
                                      <ImageWithFallback src={item.product.image_url} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <div>
                                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{item.product.name}</h4>
                                          <p className="text-blue-600 dark:text-gold-500 font-bold text-xs mt-1">R$ {item.product.price.toFixed(2)}</p>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                          <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-luxury-border px-1 py-0.5">
                                              <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"><span className="material-symbols-outlined text-sm">remove</span></button>
                                              <span className="text-xs font-bold px-2 dark:text-gray-300">{item.quantity}</span>
                                              <button onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.stock} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-green-600 disabled:opacity-30"><span className="material-symbols-outlined text-sm">add</span></button>
                                          </div>
                                          <p className="text-gray-900 dark:text-white font-bold text-sm">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Observações do Pedido</label>
                          <textarea 
                              value={observation}
                              onChange={(e) => setObservation(e.target.value)}
                              placeholder="Ex: Prefiro a cor vermelha, tamanho M, embrulhar para presente..."
                              className="w-full border border-gray-200 dark:border-luxury-border rounded-2xl p-4 text-sm focus:border-blue-500 dark:focus:border-gold-500 outline-none min-h-[100px] bg-gray-50 dark:bg-zinc-900 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 dark:text-gray-200"
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-card">
                      <div className="flex justify-between items-center mb-6 px-2">
                          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-xs tracking-widest">Total do Pedido</span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <button 
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting}
                          className="w-full bg-[#3b82f6] dark:bg-gold-600 hover:bg-[#2563eb] dark:hover:bg-gold-700 text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                          {orderConfirmed ? (
                              <>Pedido registrado! ✅</>
                          ) : isSubmitting ? (
                              <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          ) : (
                              <>Confirmar Pedido <span className="material-symbols-outlined">arrow_forward</span></>
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* STEP 2 MODAL: Client Info */}
      {isRegistrationOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white dark:bg-luxury-card w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col animate-fade-in overflow-hidden border-t dark:border-luxury-border">
                  <div className="p-8 border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-card flex justify-between items-center">
                      <div>
                          <h3 className="font-serif font-bold text-2xl text-gray-900 dark:text-gold-500">Finalizar Compra</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Preencha seus dados para concluir o pedido</p>
                      </div>
                      <button onClick={() => setIsRegistrationOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full transition-all">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>

                  <form onSubmit={handleFinalizeWhatsApp} className="flex-1 overflow-y-auto p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-1 md:col-span-2">
                              <label className="text-xs font-bold text-[#666] dark:text-gray-400 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">person</span>
                                  <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-luxury-border outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all bg-gray-50 dark:bg-zinc-900 dark:text-white" placeholder="Digite seu nome..." />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-bold text-[#666] dark:text-gray-400 uppercase tracking-widest ml-1">Seu WhatsApp</label>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">smartphone</span>
                                  <input required value={clientPhone} onChange={e => setClientPhone(formatPhone(e.target.value))} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-luxury-border outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all bg-gray-50 dark:bg-zinc-900 dark:text-white" placeholder="(00) 00000-0000" maxLength={15} />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-bold text-[#666] dark:text-gray-400 uppercase tracking-widest ml-1">Cidade / Estado</label>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">location_city</span>
                                  <input required value={cityState} onChange={e => setCityState(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-luxury-border outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all bg-gray-50 dark:bg-zinc-900 dark:text-white" placeholder="Ex: São Paulo - SP" />
                              </div>
                          </div>

                          <div className="space-y-2 col-span-1 md:col-span-2">
                              <label className="text-xs font-bold text-[#666] dark:text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-4 top-4 text-gray-300 dark:text-gray-600">home</span>
                                  <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-luxury-border outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all bg-gray-50 dark:bg-zinc-900 dark:text-white min-h-[80px]" placeholder="Rua, número, bairro..." />
                              </div>
                          </div>

                          <div className="space-y-2 col-span-1 md:col-span-2">
                              <label className="text-xs font-bold text-[#666] dark:text-gray-400 uppercase tracking-widest ml-1">Ponto de Referência</label>
                              <div className="relative">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">near_me</span>
                                  <input required value={reference} onChange={e => setReference(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-luxury-border outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all bg-gray-50 dark:bg-zinc-900 dark:text-white" placeholder="Ex: Ao lado da farmácia..." />
                              </div>
                          </div>
                      </div>

                      {/* Order Summary in Checkout */}
                      <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-[2rem] border border-gray-100 dark:border-luxury-border mt-4">
                          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Resumo do Pedido</h4>
                          <div className="space-y-2">
                              {cart.map(item => (
                                  <div key={item.product.id} className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400 font-medium">{item.quantity}x {item.product.name}</span>
                                      <span className="text-gray-900 dark:text-white font-bold">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                                  </div>
                              ))}
                              <div className="border-t border-gray-200 dark:border-luxury-border pt-3 mt-3 flex justify-between">
                                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                  <span className="text-xl font-bold text-blue-600 dark:text-gold-500">R$ {cartTotal.toFixed(2)}</span>
                              </div>
                          </div>
                      </div>
                      
                      <button 
                          type="submit"
                          disabled={isSubmitting || !isFormValid}
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale mt-4"
                      >
                          {isSubmitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">chat</span>}
                          Finalizar no WhatsApp
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
