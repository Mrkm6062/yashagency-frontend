import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from './i18n.js';

function WishlistProductCard({ product, addToCart, removeFromWishlist, setNotification }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
  
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [images.length]);
  
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
      <Link to={`/product/${product._id}`}>
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={images[currentImageIndex]} 
            alt={product.name}
            className="w-full h-48 object-cover transition-all duration-300 group-hover:scale-105"
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <div key={index} className={`w-1.5 h-1.5 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`} />
              ))}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-1">
        <Link to={`/product/${product._id}`}>
          <h5 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h5>
          <p className="text-gray-600 text-sm mb-2">{product.description.substring(0, 10)}...</p>
        </Link>
      
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
          </div>
          <span className="text-gray-500 text-xs ml-1">({product.totalRatings || 0})</span>
        </div>
        
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-lg font-bold text-green-600">₹{product.price.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="px-1 text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
              <span className="text-red-600 bg-red-100 text-red text-xs px-1.5 py-0.5 rounded-md font-semibold">{product.discountPercentage}% OFF</span>
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <button onClick={() => { addToCart(product); }} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">{t('Add to Cart')}</button>
          <button onClick={() => removeFromWishlist(product._id)} className="w-full bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

export default WishlistProductCard;