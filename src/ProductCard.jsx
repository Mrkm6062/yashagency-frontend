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
      <div className="relative overflow-hidden  aspect-[2/3] bg-[#4b2d1e]">
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
        />
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
        <Link to={`/product/${slug}`} state={{ productId: product._id }} className="absolute inset-0" aria-label={`View ${product.name}`} />
      </div>
      <Link to={`/product/${slug}`} state={{ productId: product._id }} className="block" aria-label={`View ${product.name}`}>
        <div className="bg-white -mb-6 pt-0 pb-1 px-1 text-left shadow-inner">
          <p className="py-2 font-semibold text-sm group-hover:text-blue-600 transition-colors">
             {product.name.length > 40 
              ? product.name.slice(0, 40) + "" 
             : product.name}
          </p>
          <div className="px-2 flex items-center mb-1 space-x-1">
            <div className="justify-center text-yellow-400 text-xl ">
              {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
            </div>
            <span className="text-gray-900 text-xs ml-1">({product.totalRatings || 0})</span>
          </div>
          <div className="px-0 flex items-baseline space-x-1 text-align-center">
            <span className="text-md font-semibold text-green-800">₹{product.price.toLocaleString()}</span>
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
        className="w-full bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition-all mt-6"
      >
        Add to Cart
      </button>
    </div>
  );
});


export default ProductCard;