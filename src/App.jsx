import React, { useState, useEffect, lazy, Suspense, useRef, startTransition } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { t } from './i18n.js';
import { subscribeUser } from './pushNotifications.js';
import { getToken, setToken, getUser, setUser, clearAuth } from './storage.js';
import { useOutsideClick } from './useOutsideClick.js';
import { secureRequest } from "./secureRequest.js";

// Import only the most critical, lightweight components directly
import LoadingSpinner from './LoadingSpinner.jsx';
import ScrollToTop from './ScrollToTop.jsx';

// Lazy load all page components AND heavier layout components
const Header = lazy(() => import('./Header.jsx'));
const Footer = lazy(() => import('./Footer.jsx'));
const BottomNavBar = lazy(() => import('./BottomNavBar.jsx'));
const MetaPixelTracker = lazy(() => import('./MetaPixelTracker.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductListPage = lazy(() => import('./pages/ProductListPage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const OrderStatusPage = lazy(() => import('./pages/OrderStatusPage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'));
const CustomerServicePage = lazy(() => import('./pages/CustomerServicePage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const BlogPage = lazy(() => import('./pages/BlogPage.jsx'));
const BlogPostDetailPage = lazy(() => import('./pages/BlogPostDetailPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');


// --- Logo Configuration ---
const LOGO_URL = "https://storage.googleapis.com/samriddhi-blog-images-123/WhatsApp%20Image%202025-12-16%20at%2011.59.38%20AM.jpeg"; // <-- CHANGE YOUR LOGO URL HERE

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

  const removeFromCart = (productId) => {
    updateCartQuantity(productId, 0);
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]); // New state for full product objects
  const [notification, setNotification] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userNotifications, setUserNotifications] = useState([]);
  const [cookieConsent, setCookieConsent] = useState(null); // Initialize as null

  // Handle cookie consent after mount to avoid hydration issues
  useEffect(() => {
    setCookieConsent(localStorage.getItem('cookie_consent'));
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    startTransition(() => {
      setCookieConsent('true');
    });
  };

  // Effect to automatically hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Disappear after 5 seconds

      // Cleanup the timer if the component unmounts or notification changes
      return () => clearTimeout(timer);
    }
  }, [notification]);

    // Load user from localStorage on app start
useEffect(() => {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  const restore = async () => {
    if (token && savedUser) {
      setToken(token);
      setUser(JSON.parse(savedUser));

      const valid = await validateToken(token);

      if (!valid) {
        logout();
      }
    } else {
      // Load guest cart only if user is not logged in
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }

    setIsInitialLoad(false);
    fetchProducts().finally(() => setLoading(false));
  };

  restore();
}, []);


  // Validate token and set user
const validateToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return false;

    const profile = await response.json();

    const userObj = {
      id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      isEmailVerified: profile.isEmailVerified,
      role: profile.role,
    };

    setUser(userObj);

    // Load data only after token is verified
    await Promise.all([
      fetchWishlist(),
      fetchCart(),
      fetchUserNotifications(),
    ]);

    return true;

  } catch (err) {
    console.error("validateToken network error:", err);
    // Offline: trust the token but skip API fetches
    return true;
  }
};


  // Sync cart with server when cart changes for logged-in users
useEffect(() => {
  if (user && !isInitialLoad) {
    syncCart(cart);
  }
}, [user, cart, isInitialLoad]);

    // Set up notification polling for logged-in users
useEffect(() => {
  if (!user || isInitialLoad) return;

  const interval = setInterval(fetchUserNotifications, 60000);

  return () => clearInterval(interval);
}, [user, isInitialLoad]);

const fetchWishlist = async () => {
  try {
    const token = getToken();
    if (!token) {
      setWishlistProducts([]);
      setWishlistItems([]);
      return;
    }

    const response = await secureRequest(`${API_BASE}/api/wishlist`);

    // 🔒 If token is invalid or session expired, auto logout
    if (response.status === 401 || response.status === 403) {
      console.warn("Wishlist: Token expired or invalid.");
      logout();
      return;
    }

    if (!response.ok) {
      console.error("Wishlist fetch failed:", response.status);
      return;
    }

    const data = await response.json();

    // Backend returns { wishlist: [...ids], products: [...] }
    if (data && Array.isArray(data.products)) {
      setWishlistProducts(data.products);
      setWishlistItems(data.products.map(item => item._id));
    } else {
      setWishlistProducts([]);
      setWishlistItems([]);
    }

  } catch (error) {
    console.error("Error fetching wishlist:", error);
  }
};

const fetchCart = async () => {
  try {
    const token = getToken();
    if (!token) {
      setCart([]);
      return;
    }

    const response = await secureRequest(`${API_BASE}/api/cart`);

    // Handle expired token
    if (response.status === 401 || response.status === 403) {
      console.warn("Cart fetch: token invalid → logging out");
      logout();
      return;
    }

    if (!response.ok) {
      console.error("Failed to fetch cart:", response.status);
      return;
    }

    const data = await response.json();

    const cartFromServer = data.cart || [];

    setCart(cartFromServer);
    localStorage.setItem("cart", JSON.stringify(cartFromServer));

  } catch (error) {
    console.error("Error fetching cart:", error);
    // If offline → fallback to local cart
    const fallback = localStorage.getItem("cart");
    if (fallback) setCart(JSON.parse(fallback));
  }
};


const syncCart = async (cartData) => {
  if (!getToken()) return;

  try {
    const response = await secureRequest(`${API_BASE}/api/cart`, {
      method: "POST",
      body: JSON.stringify({ cart: cartData }),
    });

    if (response.ok) {
      console.log("Cart synced successfully");
    } else {
      console.warn(`Cart sync failed with status ${response.status}. Request queued for retry.`);
      if (response.status === 401 || response.status === 403) {
        logout();
      }
    }
  } catch (error) {
    console.error("Cart sync network error. Request queued for retry.", error);
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

const addToCart = async (product) => {
  let newCart;

  // Check if item already exists in cart
  const existingItem = cart.find(item => item._id === product._id);

  if (existingItem) {
    newCart = cart.map(item =>
      item._id === product._id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    newCart = [...cart, { ...product, quantity: 1 }];
  }

  // Update UI immediately (fast UX)
  setCart(newCart);
  localStorage.setItem('cart', JSON.stringify(newCart));

  // If user logged in → sync with server using secureRequest
  if (user) {
    try {
      await secureRequest(`${API_BASE}/api/cart`, {
        method: "POST",
        body: JSON.stringify({ cart: newCart })
      });
    } catch (err) {
      console.error("Cart sync failed in addToCart:", err);
    }
  }

  // Show popup notification
  setNotification({
    message: "Added to cart",
    product: product.name,
    type: "success"
  });
};


  // Login function (SECURE VERSION)
const login = async (email, password) => {
  try {
    // 🔥 1. Remove any old token to avoid "already logged in" backend block
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    const handleLoginCartSync = async (loginToken) => {
      const localCartRaw = localStorage.getItem('cart');
      const localCart = localCartRaw ? JSON.parse(localCartRaw) : [];

      try {
        const response = await secureRequest(`${API_BASE}/api/cart`);

        if (!response.ok) {
          if (localCart.length > 0) {
            setCart(localCart);
          }
          return;
        }

        const serverData = await response.json();
        const serverCart = serverData.cart || [];

        const mergedCartMap = new Map();

        serverCart.forEach(item => mergedCartMap.set(item._id, item));

        localCart.forEach(localItem => {
          if (mergedCartMap.has(localItem._id)) {
            const existingItem = mergedCartMap.get(localItem._id);
            existingItem.quantity =
              (Number(existingItem.quantity) || 0) + 
              (Number(localItem.quantity) || 0);
          } else {
            mergedCartMap.set(localItem._id, { ...localItem });
          }
        });

        const mergedCart = Array.from(mergedCartMap.values());
        setCart(mergedCart);
        localStorage.setItem('cart', JSON.stringify(mergedCart));

      } catch (error) {
        console.error('Error during cart sync on login:', error);
      }
    };

    // 🔥 2. Perform login API request
    const response = await secureRequest(`${API_BASE}/api/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.status === 429) {
      alert('Too many login attempts. Please wait 15 minutes and try again.');
      return false;
    }

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Login failed.');
      return false;
    }

    // 🔥 3. Store new login token (fresh & secure)
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // 🔥 4. Perform post-login sync actions
    try {
      await Promise.all([
        handleLoginCartSync(data.token),
        fetchWishlist(),
        fetchUserNotifications(),
      ]);

      subscribeUser();
      return true;

    } catch (syncError) {
      console.error("Error during post-login sync:", syncError);
      return true;
    }

  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

// Logout function (SECURE VERSION)
const logout = async () => {
  try {
    const token = localStorage.getItem('token');

    // 🔥 1. Notify backend to invalidate sessionVersion
    if (token) {
      await secureRequest(`${API_BASE}/api/logout`, {
        method: "POST"
      }).catch(() => {}); // Avoid breaking logout if backend is down
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  // 🔥 2. Clear frontend session
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');

  clearAuth();
  setUser(null);
  setCart([]);
  setUserNotifications([]);

};

  // Fetch user-specific notificatio
  const fetchUserNotifications = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await secureRequest(`${API_BASE}/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        setUserNotifications(data);
      } else if (response.status === 401 || response.status === 403) {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user notifications:', error);
    }
  };

  // Clear cart function
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    if (user) {
      syncCart([]); // Also sync with backend
    }
  };

  return (
    <Router>      
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        {cookieConsent === 'true' && <MetaPixelTracker user={user} />}
        <ConditionalLayout user={user} logout={logout} cartCount={cart.length} wishlistCount={wishlistItems.length} notifications={userNotifications} setUserNotifications={setUserNotifications} API_BASE={API_BASE} LOGO_URL={LOGO_URL} t={t} secureRequest={secureRequest}>
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage products={products} loading={loading} addToCart={addToCart} />} />
              <Route path="/products" element={<ProductListPage products={products} loading={loading} addToCart={addToCart} />} />
              <Route path="/product/:slug" element={<ProductDetailPage products={products} addToCart={addToCart} wishlistItems={wishlistItems} fetchWishlist={fetchWishlist} setNotification={setNotification} API_BASE={API_BASE} />} />
              <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateCartQuantity={updateCartQuantity} addToCart={addToCart} user={user} setNotification={setNotification} API_BASE={API_BASE} />} />
              <Route path="/login" element={<LoginPage login={login} user={user} setNotification={setNotification} API_BASE={API_BASE} />} />

              <Route path="/orders" element={<OrderStatusPage user={user} API_BASE={API_BASE} />} />
              <Route path="/wishlist" element={<WishlistPage user={user} wishlistProducts={wishlistProducts} fetchWishlist={fetchWishlist} addToCart={addToCart} setNotification={setNotification} API_BASE={API_BASE} />} />
              <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} API_BASE={API_BASE} />} />
              <Route path="/track/:orderId" element={<TrackOrderPage user={user} API_BASE={API_BASE} />} />
              <Route path="/checkout" element={<CheckoutPage user={user} clearCart={clearCart} API_BASE={API_BASE} />} />
              <Route path="/admin/*" element={<AdminPanel user={user} API_BASE={API_BASE} />} />
              <Route path="/support/*" element={<CustomerServicePage API_BASE={API_BASE} />} />
              <Route path="/blogs" element={<BlogPage />} />
              <Route path="/blogs/:slug" element={<BlogPostDetailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage API_BASE={API_BASE} />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage API_BASE={API_BASE} />} />
            </Routes>
          </Suspense>
        </main>
        </ConditionalLayout>        
        
        {/* Cookie Consent Banner - Keep this in the main app body */}
        {cookieConsent === null || cookieConsent === 'false' ? (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center sm:text-left">
              We use cookies for analytics and to improve your experience. By continuing to use our site, you agree to our use of cookies. 
              <Link to="/support/privacy" className="underline hover:text-blue-300 ml-1">Learn More</Link>
            </p>
            <div className="flex-shrink-0 flex gap-3">
              <button onClick={handleAcceptCookies} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Accept</button>
            </div>
          </div>
        ) : null}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${
            notification.type === 'wishlist' ? 'bg-pink-500' :
            notification.type === 'success' ? 'bg-blue-500' :
            notification.type === 'info' ? 'bg-gray-700' : 'bg-green-500'
          }`}>
            <div>
              <p className="font-semibold">{notification.message}</p>
              <p className="text-sm opacity-90">{notification.product}</p>
            </div>
            {/* Only show a button for certain notification types */}
            {notification.type !== 'info' && (
              <Link 
                to={
                  notification.type === 'wishlist' ? '/wishlist' :
                  notification.type === 'success' ? '/products' : '/cart'
                }
                className={`bg-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${
                  notification.type === 'wishlist' ? 'text-pink-500' :
                  notification.type === 'success' ? 'text-blue-500' : 'text-green-500'
                }`}
                onClick={() => setNotification(null)}
              >
                {notification.type === 'wishlist' ? 'Go to Wishlist' :
                 notification.type === 'success' ? 'Start Shopping' : 'Go to Cart'
                }
              </Link>
            )}
          </div>
        )}
      </div>
    </Router>
  );
}

const ConditionalLayout = ({ children, user, logout, cartCount, wishlistCount, notifications, setUserNotifications, API_BASE, LOGO_URL, t, secureRequest }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide footer on specific pages only on mobile to reduce distractions
  const shouldHideOnMobile =
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/track/') ||
    location.pathname === '/orders' ||
    location.pathname === '/cart' ||
    location.pathname === '/wishlist' ||
    location.pathname === '/products' ||
    location.pathname === '/profile' ||
    location.pathname.startsWith('/support');
  const hideFooter = isMobile && shouldHideOnMobile;

  // Determine if we are on an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Hide header on profile, support, and admin pages
  const hideHeader = isAdminPage || (isMobile && (location.pathname === '/profile' || location.pathname.startsWith('/support')));

  return (
    <div className="pb-16 lg:pb-0">
      <Suspense fallback={<div className="h-[85px] bg-white border-b"></div>}>
        {!hideHeader && <Header user={user} logout={logout} cartCount={cartCount} wishlistCount={wishlistCount} notifications={notifications} setUserNotifications={setUserNotifications} API_BASE={API_BASE} LOGO_URL={LOGO_URL} t={t} makeSecureRequest={secureRequest} />}
      </Suspense>
      <div className="flex-grow">{children}</div>
      <Suspense fallback={null}>
        <BottomNavBar user={user} logout={logout} cartCount={cartCount} wishlistCount={wishlistCount} location={location} />
        {!hideFooter && !isAdminPage && <Footer API_BASE={API_BASE} LOGO_URL={LOGO_URL} />}
      </Suspense>
    </div>
  );
};
export default App;
