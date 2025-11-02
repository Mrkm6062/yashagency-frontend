import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from './imageUtils.js';

const ProductCard = React.memo(function ProductCard({ product }) {
  const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images.length]);
  
  return (    
    <Link to={`/product/${product._id}`} className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group block">
      <div className="relative overflow-hidden rounded-t-lg aspect-[4/3]">
        <picture>
          <source 
            srcSet={`${getOptimizedImageUrl(images[currentImageIndex], { format: 'webp', width: 400 })} 400w, ${getOptimizedImageUrl(images[currentImageIndex], { format: 'webp', width: 800 })} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            type="image/webp"
          />
          <img 
            src={images[currentImageIndex]} 
            srcSet={`${images[currentImageIndex]} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
          />
        </picture>
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
            {product.discountPercentage}% OFF
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-3 pb-3">
        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">
          <span className="md:hidden">{product.description.substring(0, 25)}...</span>
          <span className="hidden md:inline">{product.description.substring(0, 100)}...</span>
        </p>
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
          </div>
          <span className="text-gray-500 text-xs ml-1">({product.totalRatings || 0})</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-green-600">₹{product.price.toLocaleString()}</span>
          {hasDiscount && (<span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>)}
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;