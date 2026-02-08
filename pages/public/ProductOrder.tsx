import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { Product, Salon, OrderStatus } from '../../types';

export const ProductOrder: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  
  // Form Data
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        const s = await db.getSalon();
        setSalon(s);
        if (productId) {
            const products = await db.getProducts();
            const found = products.find(x => x.id === productId);
            if (found) setProduct(found);
        }
    };
    init();
  }, [productId]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !salon) return;
    
    setLoading(true);

    try {
      // 1. Create or Get Client (Save lead)
      await db.createClient({
        id: crypto.randomUUID(),
        salon_id: product.salon_id,
        name: clientName,
        whatsapp: clientPhone,
        created_at: new Date().toISOString()
      });

      // 2. Create Order Record
      await db.createOrder({
        id: crypto.randomUUID(),
        salon_id: product.salon_id,
        product_id: product.id,
        client_name: clientName,
        client_phone: clientPhone,
        status: OrderStatus.PENDING,
        created_at: new Date().toISOString()
      });

      // 3. WhatsApp Redirect
      const msg = `Olá! Tenho interesse no produto *${product.name}* (R$ ${product.price.toFixed(2)}). Meu nome é ${clientName}.`;
      const waLink = `https://wa.me/55${salon.phone}?text=${encodeURIComponent(msg)}`;
      
      setLoading(false);

      // Open in new tab to keep site open
      window.open(waLink, '_blank');

      // Feedback and redirect to schedule
      alert('Pedido registrado! Você será redirecionado para a sua agenda.');
      navigate(`/my-schedule?phone=${clientPhone}`);

    } catch (error) {
      alert((error as Error).message);
      setLoading(false);
    }
  };

  if (!product) return <div className="p-8 text-center text-gold-600">Carregando produto...</div>;

  const hasStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-luxury-light pb-10">
      <nav className="p-4 flex items-center border-b border-gold-200 bg-white/50 backdrop-blur sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 text-gold-700">
           <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <span className="font-serif font-bold text-gold-900 ml-2">Detalhes do Produto</span>
      </nav>

      <main className="max-w-md mx-auto p-6 animate-fade-in">
        
        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gold-100 overflow-hidden mb-8">
            <div className="aspect-square bg-gray-100 relative">
                 {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-200">
                        <span className="material-symbols-outlined text-6xl">inventory_2</span>
                    </div>
                 )}
                 {!hasStock && (
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                         <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">ESGOTADO</span>
                     </div>
                 )}
            </div>
            <div className="p-6">
                <h2 className="font-serif text-2xl font-bold text-gold-900 leading-tight mb-2">{product.name}</h2>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gold-600">R$ {product.price.toFixed(2)}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {hasStock ? `${product.stock} un. disponíveis` : 'Indisponível'}
                    </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {product.description || 'Produto de alta qualidade selecionado especialmente para você.'}
                </p>
            </div>
        </div>

        {hasStock ? (
            <div className="animate-fade-in">
                 <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Tenho Interesse</h3>
                 
                 <form onSubmit={handleOrder} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold-700 uppercase tracking-wider ml-1">Nome Completo</label>
                        <input 
                            required
                            type="text"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            className="w-full bg-white border border-gold-200 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
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
                            className="w-full bg-white border border-gold-200 rounded-xl px-4 py-3 text-gold-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    <div className="bg-gold-100/50 p-4 rounded-xl border border-gold-200/50 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-gold-600">info</span>
                        <p className="text-xs text-gold-800 leading-relaxed">
                            Ao confirmar, você será redirecionado para o WhatsApp (em uma nova aba) para combinar a entrega ou retirada com nossa equipe.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processando...' : (
                            <>
                                <span className="material-symbols-outlined">chat</span>
                                Confirmar no WhatsApp
                            </>
                        )}
                    </button>
                 </form>
            </div>
        ) : (
            <div className="text-center p-6 bg-gray-100 rounded-2xl border border-gray-200 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                <p>Este produto está indisponível no momento.</p>
            </div>
        )}

      </main>
    </div>
  );
};