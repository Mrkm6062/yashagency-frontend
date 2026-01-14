import React, { useState, useEffect } from 'react';
import { secureRequest } from '../secureRequest.js';
import { getToken } from '../storage.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function ProductForm({ showProductForm, setShowProductForm, editingProduct, setEditingProduct, fetchData, setAdminNotification }) {
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', minSellPrice: '', originalPrice: '', discountPercentage: '', imageUrl: '', category: '', soldBy: '', stock: '', variants: [],
    highlights: [], specifications: [], warranty: '', images: [],
    showHighlights: false, showSpecifications: false, showWarranty: false
  });
  const [newVariant, setNewVariant] = useState({ size: '', color: '', stock: '' });
  const [newHighlight, setNewHighlight] = useState('');
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [loading, setLoading] = useState(false);

  // Automatically calculate total stock from variants
  useEffect(() => {
    if (productForm.variants && productForm.variants.length > 0) {
      const totalStock = productForm.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
      // Use a functional update to avoid race conditions
      setProductForm(prevForm => ({ ...prevForm, stock: totalStock.toString() }));
    }
  }, [productForm.variants]);

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        ...editingProduct,
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price?.toString() || '',
        minSellPrice: editingProduct.minSellPrice?.toString() || '',
        originalPrice: editingProduct.originalPrice?.toString() || '',
        discountPercentage: editingProduct.discountPercentage?.toString() || '',
        imageUrl: editingProduct.imageUrl || '',
        category: editingProduct.category || '',
        soldBy: editingProduct.soldBy || '',
        stock: editingProduct.stock?.toString() || '0',
        variants: editingProduct.variants || [],
        highlights: editingProduct.highlights || [],
        specifications: editingProduct.specifications || [],
        warranty: editingProduct.warranty || '',
        images: editingProduct.images || [],
        showHighlights: !!editingProduct.showHighlights || (editingProduct.highlights && editingProduct.highlights.length > 0),
        showSpecifications: !!editingProduct.showSpecifications || (editingProduct.specifications && editingProduct.specifications.length > 0),
        showWarranty: !!editingProduct.showWarranty || !!editingProduct.warranty,
      });
    } else {
      resetForm();
    }
  }, [editingProduct]);

  const resetForm = () => {
    setProductForm({
      name: '', description: '', price: '', minSellPrice: '', originalPrice: '', discountPercentage: '', imageUrl: '', category: '', soldBy: '', stock: '', variants: [],
      highlights: [], specifications: [], warranty: '', images: [],
      showHighlights: false, showSpecifications: false, showWarranty: false
    });
    setNewVariant({ size: '', color: '', stock: '' });
    setNewHighlight('');
    setNewSpec({ key: '', value: '' });
  };

  const handleClose = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const saveProduct = async () => {
    setLoading(true);

    if (parseFloat(productForm.minSellPrice) > parseFloat(productForm.price)) {
      setAdminNotification({ message: 'Minimum Sell Price cannot be greater than Selling Price', type: 'error' });
      setTimeout(() => setAdminNotification(null), 3000);
      setLoading(false);
      return;
    }

    try {
      const url = editingProduct ? `${API_BASE}/api/admin/products/${editingProduct._id}` : `${API_BASE}/api/admin/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const response = await secureRequest(url, { method, body: JSON.stringify(productForm) });
      if (response.ok) {
        setAdminNotification({ message: editingProduct ? 'Product updated!' : 'Product added!', type: 'success' });
        handleClose();
        fetchData();
        localStorage.removeItem('products_cache');
      }
    } catch (error) {
      setAdminNotification({ message: 'Failed to save product', type: 'error' });
    }
    setTimeout(() => setAdminNotification(null), 3000);
    setLoading(false);
  };

  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error("Conversion failed"));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e, index = -1) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;
    
    setLoading(true);
    try {
      const file = await convertToWebP(originalFile);

      if (file.size > 1024 * 1024) {
        setAdminNotification({ message: 'Image too large (even after compression). Please upload images below 1000kb.', type: 'error' });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (index === -1) {
          setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
        } else {
          const newImages = [...productForm.images];
          newImages[index] = data.imageUrl;
          setProductForm(prev => ({ ...prev, images: newImages }));
        }
        setAdminNotification({ message: 'Image uploaded successfully', type: 'success' });
      } else {
        if (response.status === 413) {
          setAdminNotification({ message: 'Image too large. Please upload images below 1000kb.', type: 'error' });
        } else {
          setAdminNotification({ message: 'Failed to upload image', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setAdminNotification({ message: 'Error uploading image', type: 'error' });
    }
    setLoading(false);
  };

  if (!showProductForm) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Sold By (Wholesaler Name)" value={productForm.soldBy} onChange={(e) => setProductForm({ ...productForm, soldBy: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Original Price (₹)" value={productForm.originalPrice} onChange={(e) => { const op = parseFloat(e.target.value) || 0; const d = parseFloat(productForm.discountPercentage) || 0; const sp = Math.round(op - (op * d / 100)); setProductForm({ ...productForm, originalPrice: e.target.value, price: sp > 0 ? sp.toString() : '' }); }} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Discount %" value={productForm.discountPercentage} onChange={(e) => { const d = parseFloat(e.target.value) || 0; const op = parseFloat(productForm.originalPrice) || 0; const sp = Math.round(op - (op * d / 100)); setProductForm({ ...productForm, discountPercentage: e.target.value, price: sp > 0 ? sp.toString() : '' }); }} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" max="100" />
              <input type="number" placeholder="Selling Price (₹) - Auto calculated" value={productForm.price} className="px-4 py-2 border rounded-lg bg-gray-50" readOnly />
              <div className="flex flex-col">
                <input type="number" placeholder="Min Sell Price (₹)" value={productForm.minSellPrice} onChange={(e) => setProductForm({ ...productForm, minSellPrice: e.target.value })} className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${parseFloat(productForm.minSellPrice) > parseFloat(productForm.price) ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} />
                {parseFloat(productForm.minSellPrice) > parseFloat(productForm.price) && (
                  <span className="text-xs text-red-500 mt-1">Cannot exceed Selling Price</span>
                )}
              </div>
              <input
                type="number"
                placeholder={productForm.variants?.length > 0 ? "Total Stock (from variants)" : "Stock"}
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${productForm.variants?.length > 0 ? 'bg-gray-50' : ''}`}
                readOnly={productForm.variants?.length > 0}
              />
            </div>
            <textarea placeholder="Product Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" />
            <div>
              <h4 className="font-medium mb-2">Product Images</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="url" placeholder="Main Image URL" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded-lg px-3 py-2 flex items-center justify-center min-w-[80px]">
                    <span className="text-sm font-medium text-gray-600">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, -1)} />
                  </label>
                </div>
                {productForm.images.map((img, index) => (<div key={index} className="flex space-x-2">
                  <input type="url" placeholder={`Additional Image ${index + 1} URL`} value={img} onChange={(e) => { const newImages = [...productForm.images]; newImages[index] = e.target.value; setProductForm({ ...productForm, images: newImages }); }} className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded-lg px-3 py-2 flex items-center justify-center min-w-[80px]">
                    <span className="text-sm font-medium text-gray-600">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                  </label>
                  <button type="button" onClick={() => { const newImages = productForm.images.filter((_, i) => i !== index); setProductForm({ ...productForm, images: newImages }); }} className="text-red-600 hover:text-red-800 px-2">Remove</button>
                </div>))}
                <button type="button" onClick={() => setProductForm({ ...productForm, images: [...productForm.images, ''] })} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Another Image</button>
              </div>
            </div>
            {/* Highlights */}
            <div>
              <div className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={productForm.showHighlights} onChange={(e) => setProductForm({ ...productForm, showHighlights: e.target.checked })} className="rounded" /><h4 className="font-medium">Product Highlights</h4></div>
              {productForm.showHighlights && (<div className="space-y-2"><div className="flex space-x-2"><input type="text" placeholder="Add highlight" value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => { if (newHighlight.trim()) { setProductForm({ ...productForm, highlights: [...productForm.highlights, newHighlight.trim()] }); setNewHighlight(''); } }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add</button></div>{productForm.highlights.map((highlight, index) => (<div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded"><span>{highlight}</span><button type="button" onClick={() => { const newHighlights = productForm.highlights.filter((_, i) => i !== index); setProductForm({ ...productForm, highlights: newHighlights }); }} className="text-red-600 hover:text-red-800 text-sm">Remove</button></div>))}</div>)}
            </div>
            {/* Specifications */}
            <div>
              <div className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={productForm.showSpecifications} onChange={(e) => setProductForm({ ...productForm, showSpecifications: e.target.checked })} className="rounded" /><h4 className="font-medium">Product Specifications</h4></div>
              {productForm.showSpecifications && (<div className="space-y-2"><div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Specification name" value={newSpec.key} onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><div className="flex space-x-2"><input type="text" placeholder="Specification value" value={newSpec.value} onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => { if (newSpec.key.trim() && newSpec.value.trim()) { setProductForm({ ...productForm, specifications: [...productForm.specifications, { key: newSpec.key.trim(), value: newSpec.value.trim() }] }); setNewSpec({ key: '', value: '' }); } else { alert('Please provide both a specification name and value.'); } }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add</button></div></div>{productForm.specifications.map((spec, index) => (<div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded"><span><strong>{spec.key}:</strong> {spec.value}</span><button type="button" onClick={() => { const newSpecs = productForm.specifications.filter((_, i) => i !== index); setProductForm({ ...productForm, specifications: newSpecs }); }} className="text-red-600 hover:text-red-800 text-sm">Remove</button></div>))}</div>)}
            </div>
            {/* Warranty */}
            <div>
              <div className="flex items-center space-x-2 mb-2"><input type="checkbox" checked={productForm.showWarranty} onChange={(e) => setProductForm({ ...productForm, showWarranty: e.target.checked })} className="rounded" /><h4 className="font-medium">Warranty Information</h4></div>
              {productForm.showWarranty && (<textarea placeholder="Warranty details and terms" value={productForm.warranty} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20" />)}
            </div>
            {/* Variants Section */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Product Variants (Size & Color)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input type="text" placeholder="Size (S, M, L, XL)" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Stock" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => { if (newVariant.size && newVariant.color && newVariant.stock) { setProductForm({ ...productForm, variants: [...productForm.variants, newVariant] }); setNewVariant({ size: '', color: '', stock: '' }); } }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add Variant</button>
              </div>
              {productForm.variants.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium">Added Variants:</h5>
                  {productForm.variants.map((variant, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>Size: {variant.size} | Color: {variant.color} | Stock: {variant.stock}</span>
                      <button type="button" onClick={() => { const newVariants = productForm.variants.filter((_, i) => i !== index); setProductForm({ ...productForm, variants: newVariants }); }} className="text-red-600 hover:text-red-800">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-3 mt-6 pt-4 border-t">
            <button onClick={saveProduct} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}</button>
            <button onClick={handleClose} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductForm;