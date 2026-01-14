import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CartItemCard({ item, hasDiscount, updateCartQuantity, removeFromCart }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const images = [item.imageUrl, ...(item.images || [])].filter(Boolean);
  
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (e) => {
    setLocalQuantity(e.target.value);
  };

  const handleBlur = () => {
    const newQty = parseInt(localQuantity, 10);
    if (!isNaN(newQty) && newQty > 0) {
      updateCartQuantity(item._id, newQty);
    } else {
      setLocalQuantity(item.quantity);
    }
  };

  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  return (
    <div className="relative bg-white shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
      <button onClick={() => removeFromCart(item._id)} className="absolute -top-3 -right-3 z-10 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 flex items-center justify-center shadow-md text-lg cursor-pointer">X</button>
      <Link to={`/product/${slug}`} state={{ productId: item._id }}>
        <div className="relative overflow-hidden aspect-[1/1]">
          <img 
            src={images[0]} 
            alt={item.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
          />
          {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse w-full h-full" />}
        </div>
      </Link>
      <div className="p-1">
        <Link to={`/product/${slug}`} state={{ productId: item._id }}>
          <h5 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors cursor-pointer text-center">{item.name}</h5>
        </Link>
        {item.selectedVariant && (
          <p className="text-blue-600 text-sm mb-1 text-center">{item.selectedVariant.size} - {item.selectedVariant.color}</p>
        )}
        
        <div className="flex items-center justify-center space-x-2 mb-3">
          <span className="text-lg font-bold text-green-600">₹{item.price.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-500 line-through">₹{item.originalPrice.toLocaleString()}</span>
              <span className="bg-red-100 text-red-800 text-sm px-1.5 py-0.5 rounded">{item.discountPercentage}% OFF</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-gray-300 rounded">
            <button onClick={() => updateCartQuantity(item._id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100">-</button>
            <input 
              type="number" 
              min="1"
              value={localQuantity}
              onChange={handleQuantityChange}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              className="w-10 text-center px-1 py-1 border-x focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={() => updateCartQuantity(item._id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
          </div>
          <div className="text-right">
          <span className="font-bold text-lg">₹{(item.price * item.quantity).toLocaleString()}</span>
        </div>
        </div>
        
      </div>
    </div>
  );
}

export default CartItemCard;