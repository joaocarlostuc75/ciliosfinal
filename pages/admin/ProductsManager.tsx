
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/mockDb';
import { Product, Salon } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', description: '', image_url: '' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setProducts(await db.getProducts());
    setCurrentSalon(await db.getSalon());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!currentSalon) return;

    const newProduct: Product = {
        id: editingProduct ? editingProduct.id : crypto.randomUUID(),
        salon_id: currentSalon.id, // Dynamic
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        image_url: formData.image_url
    };

    if (editingProduct) {
        await db.updateProduct(newProduct);
    } else {
        await db.addProduct(newProduct);
    }
    await loadData();
    closeModal();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await db.uploadImage(file);
        setFormData(prev => ({ ...prev, image_url: url }));
      } catch (error) {
        alert('Erro ao fazer upload da imagem.');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            description: product.description,
            image_url: product.image_url || ''
        });
    } else {
        setEditingProduct(null);
        setFormData({ name: '', price: '', stock: '', description: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir este produto?')) {
          await db.deleteProduct(id);
          await loadData();
      }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="font-serif text-xl font-bold text-gold-900">Gerenciar Produtos</h3>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-gold-500 hover:bg-gold-600 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
              <span className="material-symbols-outlined">add</span>
              Novo Produto
          </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gold-100">
          
           {/* Mobile Card View (< md) */}
           <div className="md:hidden divide-y divide-gray-100">
              {products.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum produto cadastrado.</div>
              ) : (
                  products.map(p => (
                      <div key={p.id} className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                              <ImageWithFallback 
                                src={p.image_url} 
                                alt={p.name} 
                                className="w-full h-full object-cover" 
                                fallbackIcon="inventory_2"
                              />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{p.name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                      Estoque: {p.stock}
                                  </span>
                              </div>
                              <div className="flex justify-between items-end mt-2">
                                  <span className="text-gold-700 font-bold">R$ {p.price.toFixed(2)}</span>
                                  <div className="flex gap-1">
                                      <button onClick={() => openModal(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                          <span className="material-symbols-outlined text-lg">edit</span>
                                      </button>
                                      <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                                          <span className="material-symbols-outlined text-lg">delete</span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gold-50 border-b border-gold-200">
                      <tr>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Imagem</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Nome</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Preço</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900">Estoque</th>
                          <th className="px-6 py-4 font-serif font-bold text-gold-900 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody>
                      {products.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhum produto cadastrado.</td>
                          </tr>
                      ) : (
                          products.map(p => (
                              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                          {p.image_url ? (
                                            <ImageWithFallback 
                                                src={p.image_url} 
                                                alt={p.name} 
                                                className="w-full h-full object-cover" 
                                                fallbackIcon="inventory_2"
                                            />
                                          ) : (
                                            <span className="material-symbols-outlined text-gray-300">image</span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-medium text-gray-800">{p.name}</div>
                                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{p.description}</div>
                                  </td>
                                  <td className="px-6 py-4 text-gold-700 font-bold">R$ {p.price.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-gray-500">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                          {p.stock} un
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                      <button onClick={() => openModal(p)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                          <span className="material-symbols-outlined">edit</span>
                                      </button>
                                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                          <span className="material-symbols-outlined">delete</span>
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Responsive Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-gray-100 shrink-0">
                      <h3 className="font-serif text-2xl font-bold text-gold-900">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Image Upload */}
                        <div className="flex justify-center mb-6">
                            <div 
                                className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold-500 transition-colors bg-gray-50 group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {formData.image_url ? (
                                    <ImageWithFallback src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">add_photo_alternate</span>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome do Produto</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                                placeholder="Ex: Shampoo Hidratante"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Estoque</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                                    placeholder="0"
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({...formData, stock: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-gold-500"
                                placeholder="Detalhes do produto..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                rows={3}
                            />
                        </div>
                    </form>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl shrink-0">
                      <button type="button" onClick={closeModal} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                      <button type="submit" form="productForm" disabled={isUploading} className="flex-1 py-3 bg-gold-500 text-white font-bold rounded-xl shadow-md hover:bg-gold-600 disabled:opacity-50 transition-colors">Salvar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
