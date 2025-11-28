import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner.jsx';
import ProductCard from '../ProductCard.jsx';
import { getOptimizedImageUrl } from '../imageUtils.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function HomePage({ products, loading, addToCart }) {
  const [banners, setBanners] = useState({
    desktop: {
      title: 'Welcome to SamriddhiShop',
      subtitle: 'Discover amazing products at great prices',
      backgroundImage: ''
    },
    mobile: {
      title: 'Welcome to SamriddhiShop',
      subtitle: 'Amazing products, great prices',
      backgroundImage: ''
    }
  });

  useEffect(() => {
    fetchBanner();
    document.title = 'SamriddhiShop - Quality Products, Great Prices';
    return () => {
      document.title = 'SamriddhiShop'; // Reset title on unmount
    };
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/banner`);
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
    }
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full mx-0 px-0 overflow-x-hidden">
      {/* 🔹 Full-width Banner Section */}
      <Link to="/products" className="block w-full">
        {/* Desktop Banner */}
        <div className="hidden md:block relative mb-8 cursor-pointer w-full">
          {banners.desktop?.backgroundVideo ? (
            <video
              src={banners.desktop.backgroundVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto rounded-none"
            />
          ) : banners.desktop?.backgroundImage ? (
            <picture>
              <source srcSet={getOptimizedImageUrl(banners.desktop.backgroundImage, { format: 'webp' })} type="image/webp" />
              <img
                src={banners.desktop.backgroundImage}
                alt="Desktop Banner"
                className="w-full h-auto object-cover rounded-none"
                fetchpriority="high"
              />
            </picture>
          ) : (
            <div className="w-full h-96 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-12">
            <div className="relative z-10 max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">{banners.desktop?.title}</h1>
              <p className="text-xl mb-6">{banners.desktop?.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Mobile Banner */}
        <div className="md:hidden block relative mb-8 cursor-pointer w-full">
          {banners.mobile?.backgroundVideo ? (
            <video
              src={banners.mobile.backgroundVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto rounded-none"
            />
          ) : banners.mobile?.backgroundImage ? (
            <picture>
              <source srcSet={getOptimizedImageUrl(banners.mobile.backgroundImage, { format: 'webp' })} type="image/webp" />
              <img
                src={banners.mobile.backgroundImage}
                alt="Mobile Banner"
                className="w-full h-auto object-cover rounded-none"
                fetchpriority="high"
              />
            </picture>
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-8">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3">{banners.mobile?.title}</h2>
              <p className="text-lg mb-5">{banners.mobile?.subtitle}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* 🔹 Centered Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
          <section key={category} className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold capitalize">{category}</h2>
              <Link
                to={`/products?category=${encodeURIComponent(category)}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categoryProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} addToCart={addToCart} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default HomePage;