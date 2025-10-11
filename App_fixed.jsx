import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { t } from './src/i18n.js';
import { makeSecureRequest } from './src/csrf.js';
import { getToken, setToken, getUser, setUser, clearAuth } from './src/storage.js';

// Lazy load heavy components
const ProductDetailPage = lazy(() => Promise.resolve({ default: ProductDetailPageComponent }));
const CheckoutPage = lazy(() => Promise.resolve({ default: CheckoutPageComponent }));
const AdminPanel = lazy(() => Promise.resolve({ default: AdminPanelComponent }));
const TrackOrderPage = lazy(() => Promise.resolve({ default: TrackOrderPageComponent }));
const ProfilePage = lazy(() => Promise.resolve({ default: ProfilePageComponent }));
const OrderStatusPage = lazy(() => Promise.resolve({ default: OrderStatusPageComponent }));
const WishlistPage = lazy(() => Promise.resolve({ default: WishlistPageComponent }));

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // Update cart item quantity
  const updateCartQuantity = (productId, newQuantity) => {
    let newCart;
    if (newQuantity <= 0) {
      newCart = cart.filter(item => item._id !== productId);
    } else {
      newCart = cart.map(item => 
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const token = getToken();
    const userData = getUser();
    const savedCart = localStorage.getItem('cart');
    
    if (token && userData) {
      // Validate token by making a test API call
      validateToken(token, userData);
    } else if (savedCart) {
      setCart(JSON.parse(savedCart));
      setIsInitialLoad(false);
    } else {
      setIsInitialLoad(false);
    }
    fetchProducts();
  }, []);

  // Validate token and set user
  const validateToken = async (token, userData) => {
    try {
      // Skip validation if we have valid user data and token exists
      if (token && userData && userData.email) {
        setUser(userData);
        setIsInitialLoad(false);
        // Fetch user data in background without blocking UI
        fetchWishlist().catch(console.error);
        fetchCart().catch(console.error);
        return;
      }
      
      // Only validate if we don't have complete user data
      const response = await fetch(`${API_BASE}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        const userObj = { 
          id: profileData._id, 
          name: profileData.name, 
          email: profileData.email, 
          phone: profileData.phone 
        };
        setUser(userObj);
        setUser(userObj);
        fetchWishlist();
        fetchCart();
      } else {
        clearAuth();
        setUser(null);
        setCart([]);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // Don't clear auth on network errors, just set user from stored data
      if (userData && userData.email) {
        setUser(userData);
      }
    }
    setIsInitialLoad(false);
  };

  // Sync cart with server when cart changes for logged-in users
  useEffect(() => {
    if (user && !isInitialLoad && cart.length >= 0) {
      syncCart(cart);
    }
  }, [cart, user, isInitialLoad]);

  const fetchWishlist = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Wishlist data:', data); // Debug log
        // Handle different possible response structures
        if (Array.isArray(data)) {
          setWishlistItems(data.map(item => typeof item === 'string' ? item : item._id));
        } else if (data.products && Array.isArray(data.products)) {
          setWishlistItems(data.products.map(p => typeof p === 'string' ? p : p._id));
        } else if (data.wishlist && Array.isArray(data.wishlist)) {
          setWishlistItems(data.wishlist.map(item => typeof item === 'string' ? item : item._id));
        } else {
          setWishlistItems([]);
        }
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = getToken();
      if (!token) {
        setIsInitialLoad(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data.cart || []);
        localStorage.setItem('cart', JSON.stringify(data.cart || []));
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setIsInitialLoad(false);
    }
  };

  const syncCart = async (cartData) => {
    try {
      await makeSecureRequest(`${API_BASE}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cart: cartData })
      });
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  // Fetch all products with caching
  const fetchProducts = async () => {
    const cached = localStorage.getItem('products_cache');
    const cacheTime = localStorage.getItem('products_cache_time');
    
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
      setProducts(JSON.parse(cached));
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
        localStorage.setItem('products_cache', JSON.stringify(data || []));
        localStorage.setItem('products_cache_time', Date.now().toString());
      } else {
        console.error('Failed to fetch products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
    setLoading(false);
  };

  // Add item to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Show notification
    setNotification({ message: 'Added to cart', product: product.name });
    setTimeout(() => setNotification(null), 3000);
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item._id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.status === 429) {
        alert('Too many login attempts. Please wait 15 minutes and try again.');
        return false;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        
        // Fetch user's cart from server
        Promise.all([fetchWishlist(), fetchCart()]).catch(console.error);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    setUser(null);
    setCart([]);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} logout={logout} cartCount={cart.length} />
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<HomePage products={products} loading={loading} />} />
            <Route path="/products" element={<ProductListPage products={products} loading={loading} />} />
            <Route path="/product/:id" element={<Suspense fallback={<LoadingSpinner />}><ProductDetailPage products={products} addToCart={addToCart} wishlistItems={wishlistItems} setWishlistItems={setWishlistItems} setNotification={setNotification} /></Suspense>} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateCartQuantity={updateCartQuantity} addToCart={addToCart} user={user} setNotification={setNotification} />} />
            <Route path="/login" element={<LoginPage login={login} user={user} />} />
            <Route path="/orders" element={<Suspense fallback={<LoadingSpinner />}><OrderStatusPage user={user} /></Suspense>} />
            <Route path="/wishlist" element={<Suspense fallback={<LoadingSpinner />}><WishlistPage user={user} wishlistItems={wishlistItems} setWishlistItems={setWishlistItems} addToCart={addToCart} setNotification={setNotification} /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<LoadingSpinner />}><ProfilePage user={user} setUser={setUser} /></Suspense>} />
            <Route path="/track/:orderId" element={<Suspense fallback={<LoadingSpinner />}><TrackOrderPage user={user} /></Suspense>} />
            <Route path="/checkout" element={<Suspense fallback={<LoadingSpinner />}><CheckoutPage user={user} /></Suspense>} />
            <Route path="/admin" element={<Suspense fallback={<LoadingSpinner />}><AdminPanel user={user} /></Suspense>} />
            <Route path="/support" element={<CustomerServicePage />} />
          </Routes>
        </main>
        <Footer />
        
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${
            notification.type === 'wishlist' ? 'bg-pink-500' : 'bg-green-500'
          }`}>
            <div>
              <p className="font-semibold">{notification.message}</p>
              <p className="text-sm opacity-90">{notification.product}</p>
            </div>
            <Link 
              to={notification.type === 'wishlist' ? '/wishlist' : '/cart'}
              className={`bg-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${
                notification.type === 'wishlist' ? 'text-pink-500' : 'text-green-500'
              }`}
              onClick={() => setNotification(null)}
            >
              {notification.type === 'wishlist' ? 'Go to Wishlist' : 'Go to Cart'}
            </Link>
          </div>
        )}
      </div>
    </Router>
  );
}

// Placeholder components - you'll need to implement these
function Header({ user, logout, cartCount }) {
  return <div>Header Component</div>;
}

function HomePage({ products, loading }) {
  return <div>Home Page Component</div>;
}

function ProductListPage({ products, loading }) {
  return <div>Product List Component</div>;
}

function ProductDetailPageComponent({ products, addToCart, wishlistItems, setWishlistItems, setNotification }) {
  return <div>Product Detail Component</div>;
}

function CartPage({ cart, removeFromCart, updateCartQuantity, addToCart, user, setNotification }) {
  return <div>Cart Component</div>;
}

function LoginPage({ login, user }) {
  return <div>Login Component</div>;
}

function OrderStatusPageComponent({ user }) {
  return <div>Order Status Component</div>;
}

function WishlistPageComponent({ user, wishlistItems, setWishlistItems, addToCart, setNotification }) {
  return <div>Wishlist Component</div>;
}

function ProfilePageComponent({ user, setUser }) {
  return <div>Profile Component</div>;
}

function TrackOrderPageComponent({ user }) {
  return <div>Track Order Component</div>;
}

function CheckoutPageComponent({ user }) {
  return <div>Checkout Component</div>;
}

function AdminPanelComponent({ user }) {
  return <div>Admin Panel Component</div>;
}

function CustomerServicePage() {
  return <div>Customer Service Component</div>;
}

function Footer() {
  return <div>Footer Component</div>;
}

function LoadingSpinner() {
  return <div>Loading...</div>;
}

export default App;