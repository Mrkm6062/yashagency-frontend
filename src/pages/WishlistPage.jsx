import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';
import LoadingSpinner from '../LoadingSpinner.jsx';
import WishlistProductCard from '../WishlistProductCard.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function WishlistPage({ user, wishlistProducts, fetchWishlist, addToCart, setNotification }) {
  const [loading, setLoading] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    document.title = 'My Wishlist - Yash Agency';
    if (user && !wishlistProducts.length) {
      setLoading(true);
      fetchWishlist().finally(() => setLoading(false));
    }
  }, [user]);

  const removeFromWishlist = async (productId) => {
    try {
      const response = await secureRequest(`${API_BASE}/api/wishlist/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchWishlist(); // Re-fetch the wishlist to update the state globally
      } else {
        alert('Failed to remove item from wishlist.');
      }
    } catch (error) {
      alert('Failed to remove item from wishlist.');
      console.error('Error removing from wishlist:', error);
    }
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Please login to view wishlist</h2>
        <Link to="/login" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          Login
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      
      {wishlistProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-xl text-gray-600 mb-4">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Add products you love to your wishlist</p>
          <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">{wishlistProducts.length} item(s) in your wishlist</p>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map(product => (
              <WishlistProductCard key={product._id} product={product} addToCart={openQuantityModal} removeFromWishlist={removeFromWishlist} setNotification={setNotification} />
            ))}
          </div>
        </>
      )}
      
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

export default WishlistPage;