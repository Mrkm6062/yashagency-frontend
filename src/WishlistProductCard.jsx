import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from './i18n.js';

function WishlistProductCard({ product, addToCart, removeFromWishlist, setNotification }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  return (
    <div className="relative bg-white shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
      <button onClick={() => removeFromWishlist(product._id)} className="absolute -top-3 -right-3 z-10 bg-red-100 text-red-600 w-8 h-8 rounded-full hover:bg-red-200 flex items-center justify-center transition-colors shadow-sm">X</button>
      <Link to={`/product/${slug}`} state={{ productId: product._id }}>
        <div className="relative overflow-hidden aspect-[1/1] bg-gray-100">
          <img 
            src={images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            loading="eager"
            fetchPriority="high"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
          />
          {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
        </div>
      </Link>
      
      <div className="bg-white -translate-y-1 -mb-8 pt-1 pb-2 px-2 relative z-10  shadow-inner">        
        <Link to={`/product/${slug}`} state={{ productId: product._id }}>
          <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors truncate">{product.name}</h3>
        </Link>
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
        </div>
      </div>
    </div>
  );
}

export default WishlistProductCard;