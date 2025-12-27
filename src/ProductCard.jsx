import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from './imageUtils.js';

const ProductCard = React.memo(function ProductCard({ product, addToCart }) {
  const hasDiscount = product.originalPrice && product.discountPercentage && product.discountPercentage > 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const mainImageUrl = product.imageUrl;
  
  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent the Link from navigating
    e.stopPropagation(); // Stop event bubbling
    if (typeof addToCart === 'function') {
      addToCart(product);
    } else {
      console.error("ProductCard: addToCart prop is missing or not a function.");
    }
  };
  
  // Create a URL-friendly slug from the product name
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  return (
    <div className="overflow-hidden shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col">
      <div className="relative overflow-hidden  aspect-[1/1] bg-[#4b2d1e]">
        <picture>
          <source 
            srcSet={`${getOptimizedImageUrl(mainImageUrl, { format: 'webp', width: 400 })} 400w, ${getOptimizedImageUrl(mainImageUrl, { format: 'webp', width: 800 })} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            type="image/webp"
          />
          <img 
            src={getOptimizedImageUrl(mainImageUrl, { width: 400, quality: 'auto' })} // Optimized default src
            srcSet={`${getOptimizedImageUrl(mainImageUrl, { width: 320, quality: 'auto' })} 320w, ${getOptimizedImageUrl(mainImageUrl, { width: 400, quality: 'auto' })} 400w, ${getOptimizedImageUrl(mainImageUrl, { width: 600, quality: 'auto' })} 600w, ${getOptimizedImageUrl(mainImageUrl, { width: 800, quality: 'auto' })} 800w`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
          />
        </picture>
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
        <Link to={`/product/${slug}`} state={{ productId: product._id }} className="absolute inset-0" aria-label={`View ${product.name}`} />
      </div>
      <Link to={`/product/${slug}`} state={{ productId: product._id }} className="block" aria-label={`View ${product.name}`}>
        <div className="bg-white -translate-y-8 -mb-8 pt-2 pb-5 px-1 text-center shadow-inner">
          <h3 className="py-4 font-semibold text-sm group-hover:text-blue-600 transition-colors">
             {product.name.length > 20 
              ? product.name.slice(0, 25) + "" 
             : product.name}
          </h3>
          <div className="px-1 flex text-center justify-center items-baseline space-x-2">
            <span className="text-lg font-bold text-green-800">₹{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-md font-bold">{product.discountPercentage}%↓</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={handleAddToCart}
        className="w-full bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition-all mt-auto"
      >
        Add to Cart
      </button>
    </div>
  );
});

export default ProductCard;