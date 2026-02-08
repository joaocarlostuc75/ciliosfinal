import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Order, OrderStatus, Product } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EnrichedOrder extends Order {
    product_image?: string;
}

export const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const fetchedOrders = await db.getOrders();
    const fetchedProducts = await db.getProducts();
    setProducts(fetchedProducts);

    // Map product details (including image) to orders
    const enrichedOrders = fetchedOrders.map(order => {
        const product = fetchedProducts.find(p => p.id === order.product_id);
        return {
            ...order,
            product_name: product ? product.name : 'Produto Indisponível (Removido)',
            product_price: product ? product.price : 0,
            product_image: product?.image_url
        };
    });
    
    // Sort by Date Desc
    enrichedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(enrichedOrders);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
      // Optimistic update for UI responsiveness
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      
      await db.updateOrderStatus(id, status);
      await loadData(); // Reload to confirm data integrity
  };

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza? Isso excluirá o pedido do histórico permanentemente.')) {
          await db.deleteOrder(id);
          await loadData();
      }
  };

  const handleWhatsApp = (order: Order) => {
      const cleanNumber = order.client_phone.replace(/\D/g, '');
      const msg = `Olá ${order.client_name}! Aqui é da Cílios de Luxo. Recebemos seu interesse no produto *${order.product_name}*. Gostaria de finalizar a compra?`;
      window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => 
      filter === 'ALL' ? true : o.status === filter
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="font-serif text-xl font-bold text-gold-900">Gerenciar Pedidos</h3>
          
          <div className="flex bg-white rounded-lg p-1 border border-gold-200 shadow-sm overflow-x-auto max-w-full">
             <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filter === 'ALL' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Todos
             </button>
             <button 
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filter === 'PENDING' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Pendentes
             </button>
             <button 
                onClick={() => setFilter('COMPLETED')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filter === 'COMPLETED' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Concluídos
             </button>
             <button 
                onClick={() => setFilter('CANCELLED')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filter === 'CANCELLED' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Cancelados
             </button>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
          <div className="hidden md:block">
              <table className="w-full text-left">
                  <thead className="bg-gold-50 border-b border-gold-200">
                      <tr>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Data</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Cliente</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Produto</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Status</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredOrders.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhum pedido encontrado com este filtro.</td></tr>
                      ) : (
                        filteredOrders.map(order => (
                              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 text-gray-500 text-sm">
                                      {format(new Date(order.created_at), "dd/MM/yy")} <br/>
                                      <span className="text-xs">{format(new Date(order.created_at), "HH:mm")}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-gray-800">{order.client_name}</div>
                                      <div className="text-xs text-gray-400 flex items-center gap-1">
                                         <span className="material-symbols-outlined text-[10px]">phone</span>
                                         {order.client_phone}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded bg-gray-100 shrink-0 overflow-hidden">
                                              {order.product_image ? (
                                                  <img src={order.product_image} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                      <span className="material-symbols-outlined text-sm">image</span>
                                                  </div>
                                              )}
                                          </div>
                                          <div>
                                              <div className="text-gold-900 font-medium text-sm">{order.product_name}</div>
                                              <div className="text-xs font-bold text-gold-600">R$ {order.product_price?.toFixed(2)}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <select 
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer transition-colors ${
                                          order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                                          order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700 border-red-200' :
                                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}
                                      >
                                          <option value={OrderStatus.PENDING}>Pendente</option>
                                          <option value={OrderStatus.COMPLETED}>Concluído</option>
                                          <option value={OrderStatus.CANCELLED}>Cancelado</option>
                                      </select>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleWhatsApp(order)} title="Contatar no WhatsApp" className="text-green-500 hover:bg-green-50 p-2 rounded-full transition-colors">
                                            <span className="material-symbols-outlined">chat</span>
                                        </button>
                                        
                                        <button onClick={() => handleDelete(order.id)} title="Excluir" className="text-gray-300 hover:text-red-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-gray-100">
               {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Nenhum pedido encontrado.</div>
               ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800">{order.client_name}</h4>
                                    <p className="text-xs text-gray-400">{format(new Date(order.created_at), "dd/MM HH:mm")}</p>
                                </div>
                                <select 
                                    value={order.status}
                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold border outline-none ${
                                        order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                                        order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700 border-red-200' :
                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}
                                >
                                    <option value={OrderStatus.PENDING}>Pendente</option>
                                    <option value={OrderStatus.COMPLETED}>Concluído</option>
                                    <option value={OrderStatus.CANCELLED}>Cancelado</option>
                                </select>
                            </div>

                            <div className="flex gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="w-12 h-12 rounded bg-white border border-gray-200 shrink-0 overflow-hidden">
                                    {order.product_image ? (
                                        <img src={order.product_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <span className="material-symbols-outlined text-sm">image</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-gold-900 font-bold text-sm leading-tight">{order.product_name}</div>
                                    <div className="text-xs text-gray-500">R$ {order.product_price?.toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-50">
                                <button onClick={() => handleWhatsApp(order)} className="flex-1 bg-green-50 text-green-600 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm">chat</span> WhatsApp
                                </button>
                                <button onClick={() => handleDelete(order.id)} className="p-2 bg-gray-50 text-gray-400 rounded-lg">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
               )}
          </div>
      </div>
    </div>
  );
};