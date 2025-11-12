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
  
  // Create a URL-friendly slug from the product name
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  return (    
    <Link to={`/product/${slug}`} state={{ productId: product._id }} className=" rounded-lg shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group block">
      <div className="relative overflow-hidden rounded-t-lg aspect-[4/3]">
        <picture>
          <source 
            srcSet={`${getOptimizedImageUrl(images[currentImageIndex], { format: 'webp', width: 400 })} 400w, ${getOptimizedImageUrl(images[currentImageIndex], { format: 'webp', width: 800 })} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            type="image/webp"
          />
          <img 
            src={getOptimizedImageUrl(images[currentImageIndex], { width: 400, quality: 'auto' })} // Optimized default src
            srcSet={`${getOptimizedImageUrl(images[currentImageIndex], { width: 320, quality: 'auto' })} 320w, ${getOptimizedImageUrl(images[currentImageIndex], { width: 400, quality: 'auto' })} 400w, ${getOptimizedImageUrl(images[currentImageIndex], { width: 600, quality: 'auto' })} 600w, ${getOptimizedImageUrl(images[currentImageIndex], { width: 800, quality: 'auto' })} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
          />
        </picture>
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
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
      <div className="px-1 pb-1">
        <h6 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{product.name}</h6>
        <p className="text-gray-600 text-sm mb-2">
          <span className="md:hidden">{product.description.substring(0, 10)}...</span>
          <span className="hidden md:inline">{product.description.substring(0, 30)}...</span>
        </p>
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
          </div>
          <span className="text-gray-500 text-xs ml-1">({product.totalRatings || 0})</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-lg font-bold text-green-600">₹{product.price.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
              <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-md font-semibold">{product.discountPercentage}% OFF</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;