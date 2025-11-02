import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { makeSecureRequest } from '../csrf.js';
import { getToken } from '../storage.js';
import LoadingSpinner from '../LoadingSpinner.jsx';
import SuggestedProducts from '../SuggestedProducts.jsx';
import { getOptimizedImageUrl } from '../imageUtils.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function ProductDetailPage({ products, addToCart, wishlistItems, fetchWishlist, setNotification }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);
  
  const submitReview = async () => {
    const token = getToken();
    if (!token) {
      alert('Please login to submit a review');
      return;
    }
    
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/products/${id}/rating`, {
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
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select size and color');
      return;
    }
    const buyNowItem = { ...product, quantity, selectedVariant };
    navigate('/checkout', { state: { items: [buyNowItem], total: product.price * quantity, buyNow: true } });
  };

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select size and color');
      return;
    }
    const productWithVariant = { ...product, selectedVariant };
    for (let i = 0; i < quantity; i++) {
      addToCart(productWithVariant);
    }
  };

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      setPincodeStatus({ available: false, message: 'Please enter a valid 6-digit pincode.' });
      return;
    }
    setPincodeStatus({ loading: true });
    try {
      const response = await fetch(`${API_BASE}/api/check-pincode/${pincode}`);
      const data = await response.json();
      if (response.ok && data.deliverable) {
        setPincodeStatus({ available: true, message: `Yes! Delivery is available to ${pincode}.` });
      } else {
        setPincodeStatus({ available: false, message: data.message || `Sorry, delivery is not available to ${pincode} yet.` });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="mb-8">
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
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden relative">
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
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </picture>
              {product.originalPrice && product.discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {product.discountPercentage}% OFF
                </div>
              )}
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
                className={`absolute bottom-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${wishlistItems?.includes(product._id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'}`}>
                <svg className="w-6 h-6" fill={wishlistItems?.includes(product._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{product.category}</span>
                <div className="flex items-center text-yellow-400">
                  {'★'.repeat(Math.floor(product.averageRating || 0))}{'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                  <span className="text-gray-600 text-sm ml-2">({product.averageRating || 0}) {product.totalRatings || 0} reviews</span>
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && product.discountPercentage > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">{product.discountPercentage}% OFF</span>
                  </>
                )}
              </div>
            </div>
            
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-3">Select Size & Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.variants.map((variant, index) => (
                    <button key={index} onClick={() => setSelectedVariant(variant)} className={`p-3 border rounded-lg text-sm font-medium transition-colors ${selectedVariant === variant ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'} ${variant.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={variant.stock <= 0}>
                      <div>{variant.size} - {variant.color}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
                  <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3">Check Delivery Availability</h3>
              <div className="flex space-x-2">
                <input type="number" placeholder="Enter Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-48 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={checkPincode} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center"><FaArrowRight className="h-5 w-5" /></button>
              </div>
              {pincodeStatus && (
                <div className={`mt-3 text-sm font-medium ${pincodeStatus.loading ? 'text-gray-500' : pincodeStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                  {pincodeStatus.loading ? 'Checking...' : pincodeStatus.message}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button onClick={handleBuyNow} className="w-full bg-orange-500 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg">
                🛒 Buy Now  ₹{(product.price * quantity).toLocaleString()}
              </button>
              <button onClick={handleAddToCart} className="w-full bg-blue-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors border-2 border-blue-600">
                Add to Cart
              </button>
            </div>

            {product.showHighlights && product.highlights?.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-4">✨ Product Highlights</h3>
                <div className="space-y-3">
                  {product.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-3"><span className="text-blue-500">✓</span><span className="text-blue-800">{highlight}</span></div>
                  ))}
                </div>
              </div>
            )}
            
            {product.showSpecifications && product.specifications?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">📋 Specifications</h3>
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
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">⭐ Rate this Product</h3>
                <p className="text-blue-700 text-sm mb-4">Share your thoughts about this product.</p>
                {!showReviewForm ? (
                  <button onClick={() => setShowReviewForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Write a Review</button>
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
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {product.ratings.map((rating, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2"><span className="font-medium text-gray-900">{rating.userId?.name || 'Anonymous'}</span><div className="flex text-yellow-400">{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</div></div>
                        <span className="text-sm text-gray-500">{new Date(rating.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      {rating.review && <p className="text-gray-700">{rating.review}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-12">
          <SuggestedProducts allProducts={products} currentProductId={product._id} currentCategory={product.category} />
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;