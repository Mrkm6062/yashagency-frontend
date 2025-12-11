import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';
import LoadingSpinner from '../LoadingSpinner.jsx';
import WishlistProductCard from '../WishlistProductCard.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function WishlistPage({ user, wishlistProducts, fetchWishlist, addToCart, setNotification }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'My Wishlist - SamriddhiShop';
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
              <WishlistProductCard key={product._id} product={product} addToCart={addToCart} removeFromWishlist={removeFromWishlist} setNotification={setNotification} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WishlistPage;