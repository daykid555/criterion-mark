// frontend/src/pages/SkincareHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';

// Extracted ProductHistoryTable logic to be self-contained
const ProductHistoryTable = ({ products }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-white min-w-[600px]">
      <thead className="border-b border-white/20 text-sm text-white/70">
        <tr><th className="p-4">Product Name</th><th className="p-4">Unique Code</th><th className="p-4">NAFDAC No.</th><th className="p-4">Date Added</th></tr>
      </thead>
      <tbody className="divide-y divide-white/10">
        {products.map(product => (
          <tr key={product.id}><td className="p-4 font-semibold">{product.productName}</td><td className="p-4 font-mono text-cyan-300">{product.uniqueCode}</td><td className="p-4">{product.nafdacNumber || 'N/A'}</td><td className="p-4 text-white/70">{new Date(product.createdAt).toLocaleDateString()}</td></tr>
        ))}
      </tbody>
    </table>
  </div>
);

function SkincareHistoryPage() {
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Product History</h1>
      <div className="glass-panel p-1 sm:p-2">
        {isLoading && <p className="text-center py-10 text-white/70">Loading...</p>}
        {error && <p className="text-center py-10 text-red-400">{error}</p>}
        {!isLoading && !error && (products.length === 0 ? <p className="text-center py-10 text-white/70">No products added yet.</p> : <ProductHistoryTable products={products} />)}
      </div>
    </div>
  );
}

export default SkincareHistoryPage;