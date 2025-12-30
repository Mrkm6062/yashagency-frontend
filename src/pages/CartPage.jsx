import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n.js';
import CartItemCard from '../CartItemCard.jsx';
import ProductCard from '../ProductCard.jsx';
import { secureRequest } from '../secureRequest.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');

function CartPage({ cart, removeFromCart, updateCartQuantity, addToCart, user, setNotification }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    fetchSuggestedProducts();
    document.title = 'Your Cart - Yash Agency';
    return () => {
      document.title = 'Yash Agency';
    };
  }, []);

  const fetchSuggestedProducts = async () => {
    try {
      const response = await secureRequest(`${API_BASE}/api/products`);
      const data = await response.json();
      setProducts(data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { items: cart, total, buyNow: false } });
  };

  const openQuantityModal = (product) => {
    setModalProduct(product);
    setModalQuantity(1);
    setShowQuantityModal(true);
  };

  const confirmAddToCart = () => {
    const qty = Number(modalQuantity);
    if (modalProduct && !isNaN(qty) && qty > 0) {
      addToCart({ ...modalProduct, quantity: qty }, qty);
      setShowQuantityModal(false);
      setModalProduct(null);
      setModalQuantity(1);
    } else {
      alert("Please enter a valid quantity");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">{t('Your cart is empty')}</h2>
        <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {t('Continue Shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
        {cart.map(item => {
          const hasDiscount = item.originalPrice && item.discountPercentage && item.discountPercentage > 0;
          return (
            <CartItemCard 
              key={item._id} 
              item={item} 
              hasDiscount={hasDiscount}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
            />
          );
        })}
      </div>

      <div className="bg-white p-2 rounded-lg shadow mb-4">
        <div className="flex justify-center items-center mb-2 mt-2">
          <span className="text-lg font-bold">Total: ₹{total.toLocaleString()}</span>
        </div>
        
        <button 
          onClick={handleCheckout}
          className="w-full bg-green-700 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-800 transition-colors shadow-lg"
        >
          {user ? '🛒 Proceed to Checkout' : 'Login to Checkout'}
        </button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Below More Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-2">
          {products.map(product => {
            const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
            return (
              <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <ProductCard product={product} addToCart={openQuantityModal} />
              </div>
            );
          })}
        </div>
      </div>

      {showQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-bold mb-4">Enter Quantity</h3>
            <p className="text-gray-600 mb-4 text-sm">{modalProduct?.name}</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={modalQuantity}
                onChange={(e) => setModalQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;