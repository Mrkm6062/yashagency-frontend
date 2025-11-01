import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard.jsx';

function SuggestedProducts({ allProducts, currentProductId, currentCategory }) {
  const [suggested, setSuggested] = useState([]);

  useEffect(() => {
    if (allProducts.length > 0) {
      // Filter out the current product
      const otherProducts = allProducts.filter(p => p._id !== currentProductId);

      // Find products in the same category
      let categoryProducts = otherProducts.filter(p => p.category === currentCategory);

      // Shuffle and take up to 4
      let suggestions = categoryProducts.sort(() => 0.5 - Math.random()).slice(0, 4);

      // If not enough, fill with other random products
      if (suggestions.length < 4) {
        const otherRandom = otherProducts.filter(p => p.category !== currentCategory).sort(() => 0.5 - Math.random());
        suggestions = [...suggestions, ...otherRandom.slice(0, 4 - suggestions.length)];
      }
      
      setSuggested(suggestions);
    }
  }, [allProducts, currentProductId, currentCategory]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">You might also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {suggested.map(product => <ProductCard key={product._id} product={product} />)}
      </div>
    </div>
  );
}

export default SuggestedProducts;