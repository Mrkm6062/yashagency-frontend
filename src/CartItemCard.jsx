import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CartItemCard({ item, hasDiscount, updateCartQuantity, removeFromCart }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [item.imageUrl, ...(item.images || [])].filter(Boolean);
  
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
      <Link to={`/product/${item._id}`}>
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={images[currentImageIndex]} 
            alt={item.name}
            className="w-full h-48 object-cover transition-all duration-300 group-hover:scale-105"
          />
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              {item.discountPercentage}% OFF
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
      </Link>
      <div className="p-4">
        <Link to={`/product/${item._id}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors cursor-pointer">{item.name}</h3>
        </Link>
        {item.selectedVariant && (
          <p className="text-blue-600 text-sm mb-1">{item.selectedVariant.size} - {item.selectedVariant.color}</p>
        )}
        <p className="text-gray-600 text-sm mb-2">{item.description?.substring(0, 100)}...</p>
        
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(item.averageRating || 0))}{'☆'.repeat(5 - Math.floor(item.averageRating || 0))}
          </div>
          <span className="text-gray-500 text-xs ml-1">({item.totalRatings || 0})</span>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xl font-bold text-green-600">₹{item.price.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-500 line-through">₹{item.originalPrice.toLocaleString()}</span>
              <span className="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">{item.discountPercentage}% OFF</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-gray-300 rounded">
            <button onClick={() => updateCartQuantity(item._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100">-</button>
            <span className="px-3 py-1 border-x">{item.quantity}</span>
            <button onClick={() => updateCartQuantity(item._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
          </div>
          <button onClick={() => removeFromCart(item._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">X</button>
        </div>
        
        <div className="mt-3 text-right">
          <span className="font-bold text-lg">₹{(item.price * item.quantity).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default CartItemCard;