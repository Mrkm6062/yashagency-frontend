import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n.js';
import CartItemCard from '../CartItemCard.jsx';
import ProductCard from '../ProductCard.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function CartPage({ cart, removeFromCart, updateCartQuantity, addToCart, user, setNotification }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    fetchSuggestedProducts();
    document.title = 'Your Cart - SamriddhiShop';
    return () => {
      document.title = 'SamriddhiShop';
    };
  }, []);

  const fetchSuggestedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      setProducts(data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { items: cart, total, buyNow: false } });
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
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Total: ₹{total.toLocaleString()}</span>
        </div>
        
        <button 
          onClick={handleCheckout}
          className="w-full bg-green-700 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-800 transition-colors shadow-lg"
        >
          {user ? '🛒 Proceed to Checkout' : 'Login to Checkout'}
        </button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
            return (
              <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <ProductCard product={product} />
                <div className="p-4">
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CartPage;