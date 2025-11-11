import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { FaArrowRight, FaShareAlt, FaArrowDown, FaCheckCircle } from 'react-icons/fa';
import { makeSecureRequest } from '../csrf.js';
import { getToken, getUser } from '../storage.js';
import LoadingSpinner from '../LoadingSpinner.jsx';
import SuggestedProducts from '../SuggestedProducts.jsx';
import { getOptimizedImageUrl } from '../imageUtils.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function ProductDetailPage({ products, addToCart, wishlistItems, fetchWishlist, setNotification }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [showManualPincode, setShowManualPincode] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isZooming, setIsZooming] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [zoomPosition, setZoomPosition] = useState({ x: '50%', y: '50%' });
  
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - SamriddhiShop`;
    }
    return () => {
      document.title = 'SamriddhiShop';
    };
  }, [product]);

  useEffect(() => {
    const token = getToken();
    setCanReview(!!token);

    // Get product ID from state passed by Link component, or find it from slug
    const productId = location.state?.productId;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      }
      setLoading(false);
    };

    if (productId) {
      fetchProduct();
    } else {
      // Fallback if the page is loaded directly without state (e.g., refresh)
      // We find the product by its slug from the all products list.
      const productFromSlug = products.find(p => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === slug);
      if (productFromSlug) {
        setProduct(productFromSlug);
        setLoading(false);
      }
      // If not found, you might want to redirect to a 404 page or fetch by slug from API if supported
    }
  }, [slug, location.state, products]);
  
  useEffect(() => {
    const fetchUserAddress = async () => {
      const user = getUser();
      const token = getToken();
      if (user && token) {
        try {
          const response = await fetch(`${API_BASE}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.addresses && data.addresses.length > 0) {
              const homeAddress = data.addresses.find(addr => addr.addressType === 'home') || data.addresses[0];
              setUserAddress(homeAddress);
              if (homeAddress.zipCode) {
                checkPincode(homeAddress.zipCode);
              }
            }
          }
        } catch (error) { console.error('Failed to fetch user address:', error); }
      }
    };
    fetchUserAddress();
  }, []);

  useEffect(() => {
    // When both size and color are selected, find the matching variant
    if (selectedSize && selectedColor && product && product.variants) {
      const variant = product.variants.find(
        v => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, product]);

  const submitReview = async () => {
    const token = getToken();
    if (!token) {
      alert('Please login to submit a review');
      return;
    }
    
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/products/${product._id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review })
      });
      
      if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        setReview('');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      alert('Failed to submit review');
    }
  };

  const handleBuyNow = () => {
    const performBuyNow = () => {
      const buyNowItem = { ...product, quantity, selectedVariant };
      navigate('/checkout', { state: { items: [buyNowItem], total: product.price * quantity, buyNow: true } });
    };

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      if (window.innerWidth < 1024) { // On mobile, show the selector
        setPendingAction(() => performBuyNow);
        setShowSizeSelector(true);
      } else {
        alert('Please select a size and color');
      }
      return;
    }
    performBuyNow();
  };

  const handleAddToCart = () => {
    const performAddToCart = () => {
      const productWithVariant = { ...product, selectedVariant };
      for (let i = 0; i < quantity; i++) {
        addToCart(productWithVariant);
      }
    };

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      if (window.innerWidth < 1024) { // On mobile, show the selector
        setPendingAction(() => performAddToCart);
        setShowSizeSelector(true);
      } else {
        alert('Please select a size and color');
      }
      return;
    }
    performAddToCart();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this amazing product: ${product.description}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing product:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPosition({ x: `${x}%`, y: `${y}%` });
  };

  const checkPincode = async (pincodeToCheck) => {
    const code = pincodeToCheck || pincode;
    if (!code || code.length !== 6) {
      setPincodeStatus({ available: false, message: 'Please enter a valid 6-digit pincode.' });
      return;
    }
    setPincodeStatus({ loading: true });
    try {
      const response = await fetch(`${API_BASE}/api/check-pincode/${code}`);
      const data = await response.json();
      if (response.ok && data.deliverable) {
        setPincodeStatus({ available: true, message: `Yes! Delivery is available to ${code}.` });
      } else {
        setPincodeStatus({ available: false, message: data.message || `Sorry, delivery is not available to ${code} yet.` });
      }
    } catch (error) {
      console.error('Pincode check error:', error);
      setPincodeStatus({ available: false, message: 'Could not verify pincode. Please try again.' });
    }
  };

  if (loading || !product) {
    return <LoadingSpinner />;
  }

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const sizes = product.variants ? [...new Set(product.variants.map(v => v.size))] : [];
  const colorsForSelectedSize = selectedSize
    ? product.variants
        .filter(v => v.size === selectedSize)
        .map(v => ({ color: v.color, stock: v.stock }))
    : [];
  const isVariantOutOfStock = selectedVariant && selectedVariant.stock <= 0;


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="mb-8 hidden sm:block">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-blue-600">Products</Link>
            <span>/</span>
            <span className="text-gray-800">{product.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="lg:sticky lg:top-8 lg:h-fit space-y-4">
            <div
              className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden relative cursor-zoom-in"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
            >
              <picture>
                <source
                  srcSet={`${getOptimizedImageUrl(images[selectedImage], { format: 'webp', width: 400 })} 400w, ${getOptimizedImageUrl(images[selectedImage], { format: 'webp', width: 800 })} 800w, ${getOptimizedImageUrl(images[selectedImage], { format: 'webp', width: 1200 })} 1200w`}
                  sizes="(max-width: 1023px) 90vw, 45vw"
                  type="image/webp"
                />
                <img
                  src={images[selectedImage]}
                  srcSet={`${getOptimizedImageUrl(images[selectedImage], { width: 400 })} 400w, ${getOptimizedImageUrl(images[selectedImage], { width: 800 })} 800w, ${getOptimizedImageUrl(images[selectedImage], { width: 1200 })} 1200w`}
                  sizes="(max-width: 1023px) 90vw, 45vw"
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  loading="lazy"
                  style={{
                    transform: isZooming ? 'scale(2)' : 'scale(1)',
                    transformOrigin: `${zoomPosition.x} ${zoomPosition.y}`,
                  }}
                />
              </picture>
              {/* {product.originalPrice && product.discountPercentage > 0 && (
                <div className="absolute top-1 left-1 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {product.discountPercentage}% OFF
                </div>
              )} */}
              <button
                onClick={handleShare} aria-label="Share this product"
                className="absolute top-2 right-1 w-6 h-6 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500">
                <FaShareAlt className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  const token = getToken();
                  if (!token) { alert('Please login to add to wishlist'); return; }
                  const isInWishlist = wishlistItems && wishlistItems.includes(product._id);
                  try {
                    const response = await makeSecureRequest(`${API_BASE}/api/wishlist/${product._id}`, { method: isInWishlist ? 'DELETE' : 'POST' });
                    if (response.ok) {
                      fetchWishlist(); 
                      setNotification({ message: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', product: product.name, type: 'wishlist' });
                      setTimeout(() => setNotification(null), 3000);
                    } else {
                      const data = await response.json().catch(() => ({}));
                      alert(data.error || `Failed to update wishlist`);
                    }
                  } catch (error) { alert(`Failed to update wishlist`); }
                }} aria-label={wishlistItems?.includes(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`absolute top-10 right-1 w-6 h-6 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${wishlistItems?.includes(product._id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'}`}>
                <svg className="w-5 h-5" fill={wishlistItems?.includes(product._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            <div className="flex space-x-3">
              {images.map((img, index) => (
                <button key={index} onClick={() => setSelectedImage(index)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'}`}>
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pb-48 lg:pb-0">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{product.category}</span>
                <div className="flex items-center text-yellow-400">
                  {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                  <span className="text-gray-600 text-sm ml-2">({product.averageRating || 0}) {product.totalRatings || 0} reviews</span>
                </div>
              </div>
              <h3 className="text-3xl lg:text-4x1 font-bold text-gray-900 mb-4">{product.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && product.discountPercentage > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-green-800 text-lg font-bold px-2 py-1 rounded flex items-center">
                      <FaArrowDown className="mr-1" /> {product.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {product.variants && product.variants.length > 0 && (
              <div className="">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Select Size</h3>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSize(size);
                          // Automatically select color if only one is available for this size
                          const colorsForThisSize = product.variants
                            .filter(v => v.size === size)
                            .map(v => ({ color: v.color, stock: v.stock }));

                          if (colorsForThisSize.length === 1) {
                            setSelectedColor(colorsForThisSize[0].color);
                          } else {
                            setSelectedColor(null); // Reset if multiple or none, forcing user choice
                          }
                        }}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${selectedSize === size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSize && colorsForSelectedSize.length > 1 && ( // Only show color selection if there's more than one color
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Select Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {colorsForSelectedSize.map((item, index) => (
                        <button key={index} onClick={() => setSelectedColor(item.color)} className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${selectedColor === item.color ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'} ${item.stock <= 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}`} disabled={item.stock <= 0}>
                          {item.color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isVariantOutOfStock && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-red-700 font-semibold">This combination is currently out of stock.</p>
                  </div>
                )}
              </div>
            )}

            <div className="">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Details</h3>
              {userAddress && !showManualPincode ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2 bg-gray-100 p-2 rounded-md">
                    Deliver to Your Home : <strong>{userAddress.name}</strong> - {userAddress.street}, {userAddress.city}, {userAddress.state} - {userAddress.zipCode}
                    <br />
                    {pincodeStatus && (
                    <div className={`text-sm font-medium mb-2 ${pincodeStatus.loading ? 'text-gray-500' : pincodeStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                      {pincodeStatus.loading ? `Checking for your address...` : pincodeStatus.message}
                    </div>
                  )}
                  </p>
                  <button onClick={() => setShowManualPincode(true)} className="text-blue-600 text-sm hover:underline">Check another pincode</button>
                </div>
              ) : (
                <div>
                  <div className="flex space-x-2">
                    <input type="number" placeholder="Enter Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-48 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => checkPincode()} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center"><FaArrowRight className="h-5 w-5" /></button>
                  </div>
                  {pincodeStatus && showManualPincode && (
                    <div className={`mt-3 text-sm font-medium ${pincodeStatus.loading ? 'text-gray-500' : pincodeStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                      {pincodeStatus.loading ? 'Checking...' : pincodeStatus.message}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-4 fixed bottom-16 left-0 right-0 bg-white p-4 border-t shadow-lg z-10 lg:static lg:p-0 lg:border-none lg:shadow-none">
              <div className="flex items-stretch gap-2 sm:gap-4">
                <div>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 sm:px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
                    <span className="px-3 sm:px-4 py-3 border-x border-gray-300 min-w-[10px] sm:min-w-[10px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 sm:px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
                  </div>
                </div>
                <button onClick={handleAddToCart} disabled={isVariantOutOfStock} className="flex-1 bg-blue-600 text-white py-1 px-1 rounded-xl text-base font-bold hover:bg-blue-700 transition-colors border-2 border-blue-600 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} disabled={isVariantOutOfStock} className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl text-base font-bold hover:bg-green-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                  Buy Now
                </button>
              </div>
            </div>

            {product.showHighlights && product.highlights?.length > 0 && (
              <div className="">
                <h3 className="font-bold text-black-900 mb-4">Product Highlights</h3>
                <div className="space-y-3">
                  {product.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-3"><span className="text-green-500">✓</span><span className="text-blue-800">{highlight}</span></div>
                  ))}
                </div>
              </div>
            )}
            
            {product.showSpecifications && product.specifications?.length > 0 && (
              <div className="">
                <h3 className="font-bold text-gray-900 mb-4">📋 Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-700">{spec.key}:</span>
                      <span className="text-gray-600 sm:text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {product.showWarranty && product.warranty && (
              <div className="bg-green-50 p-6 rounded-xl">
                <h3 className="font-semibold text-green-900 mb-4">🛡️ Warranty</h3>
                <p className="text-green-800 whitespace-pre-line">{product.warranty}</p>
              </div>
            )}
            
            {canReview && (
              <div className="text-center lg:text-left">
                {!showReviewForm ? (
                  <button onClick={() => setShowReviewForm(true)} className="bg-blue-600 text-white px-16 py-3 rounded-lg hover:bg-blue-700 transition-colors lg:w-full lg:py-4 lg:text-lg lg:font-semibold lg:rounded-xl">Write Rate and Review</button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Rating</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Review</label>
                      <textarea value={review} onChange={(e) => setReview(e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Share your experience..."/>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={submitReview} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit</button>
                      <button onClick={() => setShowReviewForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {product.ratings && product.ratings.length > 0 && (
              <div className="">
                <h2 className="text-1xl font-semibold text-gray-900 mb-4">Customer Reviews & Ratings</h2>
                <h4 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  {product.averageRating} <span className="text-green-400 ml-1">★</span>
                </h4>
                <p className="text-gray-600 text-sm mb-4 flex items-center">
                  based on {product.ratings.length} ratings by&nbsp;
                  <FaCheckCircle className="mr-1.5 text-blue-500" /> Verified Buyers
                </p>
                <div className="space-y-4">
                  {product.ratings.slice(0, visibleReviewsCount).map((rating, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center font-bold text-gray-800 mb-2">
                        {rating.rating} <span className="text-green-400 ml-1">★</span>
                      </div>
                      {rating.review && <p className="text-lg font-bold text-gray-800 mb-2">{rating.review}</p>}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>by {rating.userId?.name || 'Anonymous'}</span>
                        <span className="text-sm text-gray-500">{new Date(rating.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {product.ratings.length > visibleReviewsCount && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setVisibleReviewsCount(prevCount => prevCount + 5)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                      Load More Reviews
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <SuggestedProducts allProducts={products} currentProductId={product._id} currentCategory={product.category} />
        </div>

        {/* Mobile Size Selector Popup */}
        {showSizeSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setShowSizeSelector(false)}>
            <div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-24 shadow-lg transform transition-transform duration-300 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Select a Size</h3>
                <button onClick={() => setShowSizeSelector(false)} className="text-gray-500 text-2xl">&times;</button>
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                {sizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSize(size);
                      const colorsForThisSize = product.variants.filter(v => v.size === size).map(v => ({ color: v.color, stock: v.stock }));
                      if (colorsForThisSize.length === 1) {
                        setSelectedColor(colorsForThisSize[0].color);
                      } else {
                        setSelectedColor(null); // This case shouldn't happen if the popup is only for size
                      }
                    }}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${selectedSize === size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (pendingAction) pendingAction();
                  setShowSizeSelector(false);
                }}
                disabled={!selectedVariant}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;