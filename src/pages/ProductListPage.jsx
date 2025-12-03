import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner.jsx';
import ProductCard from '../ProductCard.jsx';

function ProductListPage({ products, loading, addToCart }) {
  const navigate = useNavigate();
  const { categoryName } = useParams(); // Get category from URL
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
  
  useEffect(() => {
    // Sync the category from the URL parameter to the filter state
    const currentCategory = categoryName === 'allcategory' ? '' : decodeURIComponent(categoryName || '');
    setFilters(prev => ({ ...prev, category: currentCategory }));
  }, [categoryName]);

  useEffect(() => {
    applyFilters();
    document.title = 'All Products - SamriddhiShop';
    return () => {
      document.title = 'SamriddhiShop';
    };
  }, [products, filters, location.search, categoryName]); // Re-run applyFilters when these change

  useEffect(() => {
    // Reset displayCount whenever filters or search terms change
    setDisplayCount(12);
  }, [filters, location.search]);

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

  const categoryColors = [
    'blue',
    'red',
    'green',
    'purple',
    'pink',
    'indigo',
    'teal',
    'yellow'
  ];

  if (loading) return <LoadingSpinner />;
  // Format category name (capitalize each word)
const formattedCategory =
  categoryName && categoryName !== "allcategory"
    ? decodeURIComponent(categoryName)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Products";

  return (
    <div>
          <Helmet>
            {/* Dynamic Title */}
            <title>
              {formattedCategory === "All Products"
                ? "All Products - Samriddhi Shop"
                : `${formattedCategory} – Buy Latest ${formattedCategory} Online | Samriddhi Shop`}
            </title>

            {/* Meta Description */}
            <meta
              name="description"
              content={
                formattedCategory === "All Products"
                  ? "Shop all products across all categories at Samriddhi Shop. Trending items updated daily with fast delivery."
                  : `Shop trending ${formattedCategory} at Samriddhi Shop. Explore latest designs, top quality, and fast delivery. Updated daily.`
              }
            />

            {/* Breadcrumb Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: "Home",
                      item: "https://samriddhishop.in",
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: formattedCategory,
                      item:
                        formattedCategory === "All Products"
                          ? "https://samriddhishop.in/products/allcategory"
                          : `https://samriddhishop.in/products/${categoryName}`,
                    },
                  ],
                }),
              }}
            />

            {/* ItemList Schema (products list) */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: filteredProducts.map((p, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: p.name,
                    url: `https://samriddhishop.in/product/${p._id}`,
                  })),
                }),
              }}
            />
          </Helmet>
          <h1 className="text-xl font-bold mb-2">
            {formattedCategory} – Latest Collection
          </h1>

          <p className="text-gray-600 mb-4">
            Discover the latest {formattedCategory} on Samriddhi Shop. We offer
            trending and high-quality products updated daily. Enjoy the best prices
            and fast delivery across India.
          </p>
      {/* Categories Section */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-4 md:flex-nowrap md:justify-start md:overflow-x-auto md:pb-4 md:-mx-4 md:px-4 md:scrollbar-thin md:scrollbar-thumb-gray-300 md:scrollbar-track-gray-100">
          {/* "All" Category */}
          <div
            key="all-categories"
            onClick={() => navigate('/products/allcategory')}
            className="flex flex-col items-center flex-shrink-0 w-16 md:w-28 text-center cursor-pointer group"
          >
            <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center mb-2 border-2 transition-all duration-200 group-hover:border-blue-400 ${
              !filters.category ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'
            }`}>
              <img 
                src="https://storage.googleapis.com/samriddhi-blog-images-123/VERIFYLOGO%20ICON.png" 
                alt="All Categories" 
                className="w-8 h-8 md:w-14 md:h-14 object-contain"
              />
            </div>
            <p className={`text-sm font-medium transition-colors ${!filters.category ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-500'}`}>
              All
            </p>
          </div>

          {/* Dynamic Categories */}
          {categories.map((category, index) => {
            const color = categoryColors[index % categoryColors.length];
            const activeClasses = `border-${color}-600 ring-2 ring-${color}-200`;
            const hoverClasses = `group-hover:border-${color}-400`;
            const activeTextClasses = `text-${color}-600`;
            const hoverTextClasses = `group-hover:text-${color}-500`;

            return (
              <div
              key={category}
              onClick={() => navigate(`/products/${encodeURIComponent(category)}`)}
              className="flex flex-col items-center flex-shrink-0 w-16 md:w-28 text-center cursor-pointer group md:flex-shrink-0"
            >
              <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center mb-2 border-2 transition-all duration-200 ${hoverClasses} ${
                filters.category === category ? activeClasses : 'border-gray-300'
              }`}>
                {/* Replace with actual category images when available */}
                <img src={`https://via.placeholder.com/80x80.png/E2E8F0/4A5568?text=${encodeURIComponent(category.substring(0,1))}`} alt={category} className="w-full h-full object-cover rounded-full" />
              </div>
              <p className={`text-xs font-medium transition-colors ${filters.category === category ? activeTextClasses : `text-gray-700 ${hoverTextClasses}`}`}>{category}</p>
            </div>
          )})}
        </div>
      </div>

      <div className="flex justify-between items-center">
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
        <div className="w-full flex flex-wrap items-end gap-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-grow">
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
          </div>
          <button
          onClick={() => {
            setFilters({ category: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name' });
            navigate('/products/allcategory');
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors h-fit"
        >
          Clear Filters
        </button>
        </div>
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
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    navigate(newCategory ? `/products/${encodeURIComponent(newCategory)}` : '/products/allcategory');
                  }}
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
                    navigate('/products/allcategory');
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