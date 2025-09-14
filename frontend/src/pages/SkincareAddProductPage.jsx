// frontend/src/pages/SkincareAddProductPage.jsx
import React, { useState } from 'react';
import apiClient from '../api';

// Extracted AddProductForm logic to be self-contained on this page
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
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

function SkincareAddProductPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Add New Product</h1>
      <div className="glass-panel p-6 sm:p-8">
        <AddProductForm onSuccess={() => alert('Product added successfully!')} />
      </div>
    </div>
  );
}

export default SkincareAddProductPage;