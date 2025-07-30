// frontend/src/pages/SkincareDashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const AddProductForm = ({ onSuccess }) => {
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [skinReactions, setSkinReactions] = useState('');
  const [nafdacNumber, setNafdacNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/api/skincare/products', { productName, ingredients, skinReactions, nafdacNumber });
      setProductName(''); setIngredients(''); setSkinReactions(''); setNafdacNumber('');
      onSuccess(); // Refresh the product list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Add New Product</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Product Name*" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full glass-input px-3 py-2" required />
        <input type="text" placeholder="NAFDAC Number (Optional)" value={nafdacNumber} onChange={(e) => setNafdacNumber(e.target.value)} className="w-full glass-input px-3 py-2" />
      </div>
      <textarea placeholder="Ingredients (comma separated)*" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="w-full glass-input px-3 py-2 min-h-[80px]" required />
      <textarea placeholder="Potential Skin Reactions (Optional)" value={skinReactions} onChange={(e) => setSkinReactions(e.target.value)} className="w-full glass-input px-3 py-2 min-h-[80px]" />
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button type="submit" disabled={isLoading} className="w-full md:w-auto glass-button py-2 px-6 rounded-lg font-bold">
        {isLoading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  );
};

const ProductHistoryTable = ({ products }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-white min-w-[600px]">
      <thead className="border-b border-white/20 text-sm text-white/70">
        <tr>
          <th className="p-4">Product Name</th>
          <th className="p-4">Unique Code</th>
          <th className="p-4">NAFDAC No.</th>
          <th className="p-4">Date Added</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/10">
        {products.map(product => (
          <tr key={product.id}>
            <td className="p-4 font-semibold">{product.productName}</td>
            <td className="p-4 font-mono text-cyan-300">{product.uniqueCode}</td>
            <td className="p-4">{product.nafdacNumber || 'N/A'}</td>
            <td className="p-4 text-white/70">{new Date(product.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function SkincareDashboard() {
  const [activeTab, setActiveTab] = useState('add');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/skincare/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load your products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Skincare Brand Dashboard</h1>
      <div className="flex border-b border-white/20 mb-8">
        <button onClick={() => setActiveTab('add')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'add' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Add Product</button>
        <button onClick={() => setActiveTab('history')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Product History</button>
      </div>
      
      {activeTab === 'add' && <div className="glass-panel p-6 sm:p-8 mb-8"><AddProductForm onSuccess={fetchProducts} /></div>}
      
      {activeTab === 'history' && (
        <div className="glass-panel p-1 sm:p-2">
          <h2 className="text-2xl font-bold text-white p-4">Your Products</h2>
          {isLoading && <p className="text-center py-10 text-white/70">Loading...</p>}
          {error && <p className="text-center py-10 text-red-400">{error}</p>}
          {!isLoading && !error && (products.length === 0 ? <p className="text-center py-10 text-white/70">No products added yet.</p> : <ProductHistoryTable products={products} />)}
        </div>
      )}
    </div>
  );
}

export default SkincareDashboard;
