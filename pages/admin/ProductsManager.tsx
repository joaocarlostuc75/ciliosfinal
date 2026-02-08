import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Product } from '../../types';

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', description: '' });

  const loadProducts = async () => {
    setProducts(await db.getProducts());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
        id: editingProduct ? editingProduct.id : crypto.randomUUID(),
        salon_id: 'e2c0a884-6d9e-4861-a9d5-17154238805f',
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
    };

    if (editingProduct) {
        await db.updateProduct(newProduct);
    } else {
        await db.addProduct(newProduct);
    }
    await loadProducts();
    closeModal();
  };

  const openModal = (product?: Product) => {
    if (product) {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            description: product.description
        });
    } else {
        setEditingProduct(null);
        setFormData({ name: '', price: '', stock: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir este produto?')) {
          await db.deleteProduct(id);
          await loadProducts();
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold text-gold-900">Gerenciar Produtos</h3>
          <button
            onClick={() => openModal()}
            className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
          >
              <span className="material-symbols-outlined">add</span>
              Novo Produto
          </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
          <table className="w-full text-left">
              <thead className="bg-gold-50 border-b border-gold-200">
                  <tr>
                      <th className="px-6 py-4 font-serif font-bold text-gold-900">Nome</th>
                      <th className="px-6 py-4 font-serif font-bold text-gold-900">Preço</th>
                      <th className="px-6 py-4 font-serif font-bold text-gold-900">Estoque</th>
                      <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
                  </tr>
              </thead>
              <tbody>
                  {products.length === 0 ? (
                      <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum produto cadastrado.</td>
                      </tr>
                  ) : (
                      products.map(p => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-medium text-gray-800">{p.name}</div>
                                  <div className="text-xs text-gray-500">{p.description}</div>
                              </td>
                              <td className="px-6 py-4 text-gold-700 font-bold">R$ {p.price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-gray-500">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                      {p.stock} un
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                  <button onClick={() => openModal(p)} className="text-blue-500 hover:text-blue-700">
                                      <span className="material-symbols-outlined">edit</span>
                                  </button>
                                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600">
                                      <span className="material-symbols-outlined">delete</span>
                                  </button>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                  <h3 className="font-serif text-2xl font-bold mb-6 text-gold-900">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                        placeholder="Nome do Produto"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                            placeholder="Preço (R$)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            required
                        />
                        <input
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                            placeholder="Estoque"
                            type="number"
                            value={formData.stock}
                            onChange={e => setFormData({...formData, stock: e.target.value})}
                            required
                        />
                      </div>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                        placeholder="Descrição"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={closeModal} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-lg shadow hover:bg-gold-600">Salvar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};