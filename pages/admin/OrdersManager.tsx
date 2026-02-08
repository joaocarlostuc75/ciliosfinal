import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Order, OrderStatus, Product } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const fetchedOrders = await db.getOrders();
    const fetchedProducts = await db.getProducts();
    setProducts(fetchedProducts);

    // Map product names to orders for display
    const enrichedOrders = fetchedOrders.map(order => {
        const product = fetchedProducts.find(p => p.id === order.product_id);
        return {
            ...order,
            product_name: product ? product.name : 'Produto Indisponível',
            product_price: product ? product.price : 0
        };
    });
    
    // Sort by Date Desc
    enrichedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(enrichedOrders);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
      await db.updateOrderStatus(id, status);
      await loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Excluir este pedido do histórico?')) {
          await db.deleteOrder(id);
          await loadData();
      }
  };

  const handleWhatsApp = (order: Order) => {
      const cleanNumber = order.client_phone.replace(/\D/g, '');
      const msg = `Olá ${order.client_name}! Recebemos seu interesse no produto *${order.product_name}*. Gostaria de finalizar a compra?`;
      window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => 
      filter === 'ALL' ? true : o.status === filter
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="font-serif text-xl font-bold text-gold-900">Gerenciar Pedidos</h3>
          
          <div className="flex bg-white rounded-lg p-1 border border-gold-200 shadow-sm">
             <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Todos
             </button>
             <button 
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'PENDING' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Pendentes
             </button>
             <button 
                onClick={() => setFilter('COMPLETED')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'COMPLETED' ? 'bg-gold-500 text-white shadow' : 'text-gray-500 hover:bg-gold-50'}`}
             >
                Concluídos
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
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhum pedido encontrado.</td></tr>
                      ) : (
                        filteredOrders.map(order => (
                              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 text-gray-500 text-sm">
                                      {format(new Date(order.created_at), "dd/MM 'às' HH:mm")}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-gray-800">{order.client_name}</div>
                                      <div className="text-xs text-gray-400">{order.client_phone}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="text-gold-900 font-medium">{order.product_name}</div>
                                      <div className="text-xs font-bold text-gold-600">R$ {order.product_price?.toFixed(2)}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                          order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {order.status === OrderStatus.PENDING ? 'Pendente' :
                                           order.status === OrderStatus.COMPLETED ? 'Concluído' : 'Cancelado'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                      <button onClick={() => handleWhatsApp(order)} title="Contatar no WhatsApp" className="text-green-500 hover:bg-green-50 p-2 rounded-full">
                                          <span className="material-symbols-outlined">chat</span>
                                      </button>
                                      
                                      {order.status !== OrderStatus.COMPLETED && (
                                          <button onClick={() => handleUpdateStatus(order.id, OrderStatus.COMPLETED)} title="Marcar como Concluído" className="text-blue-500 hover:bg-blue-50 p-2 rounded-full">
                                              <span className="material-symbols-outlined">check_circle</span>
                                          </button>
                                      )}
                                      
                                      {order.status === OrderStatus.PENDING && (
                                          <button onClick={() => handleUpdateStatus(order.id, OrderStatus.CANCELLED)} title="Cancelar" className="text-red-400 hover:bg-red-50 p-2 rounded-full">
                                              <span className="material-symbols-outlined">block</span>
                                          </button>
                                      )}

                                      <button onClick={() => handleDelete(order.id)} title="Excluir" className="text-gray-400 hover:text-red-600 hover:bg-gray-100 p-2 rounded-full">
                                          <span className="material-symbols-outlined">delete</span>
                                      </button>
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
                                    <p className="text-sm text-gold-900">{order.product_name}</p>
                                    <p className="text-xs text-gray-400">{format(new Date(order.created_at), "dd/MM HH:mm")}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                      order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                      order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                  }`}>
                                      {order.status === OrderStatus.PENDING ? 'Pendente' : 
                                       order.status === OrderStatus.COMPLETED ? 'Concluído' : 'Canc.'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <span className="font-bold text-gold-600">R$ {order.product_price?.toFixed(2)}</span>
                                <div className="flex gap-2">
                                     <button onClick={() => handleWhatsApp(order)} className="p-2 bg-green-50 text-green-600 rounded-full"><span className="material-symbols-outlined text-lg">chat</span></button>
                                     {order.status === 'PENDING' && (
                                         <button onClick={() => handleUpdateStatus(order.id, OrderStatus.COMPLETED)} className="p-2 bg-blue-50 text-blue-600 rounded-full"><span className="material-symbols-outlined text-lg">check</span></button>
                                     )}
                                     <button onClick={() => handleDelete(order.id)} className="p-2 bg-gray-50 text-gray-400 rounded-full"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                            </div>
                        </div>
                    ))
               )}
          </div>
      </div>
    </div>
  );
};