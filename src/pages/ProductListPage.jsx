import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner.jsx';
import ProductCard from '../ProductCard.jsx';

function ProductListPage({ products, loading, addToCart }) {
  const navigate = useNavigate();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'name'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(12); // Initial number of products to display
  const observer = useRef();
  const loadingRef = useRef(null); // Element to observe for infinite scroll
  const location = useLocation();

  // This effect will sync the URL search query with the filter UI
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlSearchTerm = queryParams.get('search') || '';
    // If you want the search term to appear in the filter's search box
    // you would need a state for it, but the filtering logic below
    // already uses the URL directly.
  }, [location.search]);

  useEffect(() => {
    applyFilters();
    document.title = 'All Products - SamriddhiShop';
    return () => {
      document.title = 'SamriddhiShop';
    };
  }, [products, filters, location.search]); // Re-run applyFilters when these change

  useEffect(() => {
    // Reset displayCount whenever filters or search terms change
    setDisplayCount(12);
  }, [filters, searchTerm]);

  const applyFilters = () => {
    // Extract search term from URL if present
    const queryParams = new URLSearchParams(location.search);
    const urlSearchTerm = queryParams.get('search');
    const currentSearch = urlSearchTerm;

    let filtered = [...products];

    if (currentSearch) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
        product.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(currentSearch.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(product => product.price >= minPrice);
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(product => product.price <= maxPrice);
      }
    }

    if (filters.minRating) {
      const minRating = parseFloat(filters.minRating);
      if (!isNaN(minRating)) {
        filtered = filtered.filter(product => (product.averageRating || 0) >= minRating);
      }
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  // Effect for Intersection Observer (Infinite Scrolling)
  useEffect(() => {
    if (loading) return; // Don't observe if initial products are still loading

    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create new observer
    observer.current = new IntersectionObserver((entries) => {
      // If the loading sentinel is visible AND there are more products to load
      if (entries[0].isIntersecting && displayCount < filteredProducts.length) {
        // Add a small delay to prevent rapid loading
        setTimeout(() => {
          setDisplayCount(prevCount => prevCount + 12); // Load 12 more products
        }, 300); // Debounce loading
      }
    }, { threshold: 0.5 }); // Trigger when 50% of the element is visible

    // Start observing the loadingRef element
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    // Cleanup function
    return () => { if (observer.current) observer.current.disconnect(); };
  }, [loading, filteredProducts, displayCount]); // Re-run when products or displayCount changes
  const categories = [...new Set(products.map(p => p.category))];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <button 
        onClick={() => navigate('/')}
        className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span>←</span>
        <span>Back to Home</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Products</h1>

        <button
          onClick={() => setShowFilters(true)}
          className="md:hidden bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center space-x-2 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
        >
          <span>🔍</span>
          <span>Filters</span>
        </button>
      </div>
      
      <div className="hidden md:block bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.minRating}
            onChange={(e) => setFilters({...filters, minRating: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
        <button
          onClick={() => {
            setFilters({ category: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name' });
          }}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>
      
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-6">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setFilters({ category: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name' });
                    // No need to call applyFilters here, as closing the modal will trigger useEffect
                    // which will then apply the filters based on the updated state.
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
                <button onClick={() => setShowFilters(false)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        Showing {Math.min(displayCount, filteredProducts.length)} of {filteredProducts.length} products
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.slice(0, displayCount).map(product => (
          <ProductCard key={product._id} product={product} addToCart={addToCart} />
        ))}
      </div>
      {displayCount < filteredProducts.length && (
        <div ref={loadingRef} className="text-center mt-8">
          <LoadingSpinner />
        </div>
      )}
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ProductListPage;