import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';

// API Base URL
const API_BASE = 'http://localhost:3001/api';

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
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const savedCart = localStorage.getItem('cart');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchWishlist();
      fetchCart();
    } else if (savedCart) {
      setCart(JSON.parse(savedCart));
      setIsInitialLoad(false);
    } else {
      setIsInitialLoad(false);
    }
    fetchProducts();
  }, []);

  // Sync cart with server when cart changes for logged-in users
  useEffect(() => {
    if (user && !isInitialLoad && cart.length >= 0) {
      syncCart(cart);
    }
  }, [cart, user, isInitialLoad]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.wishlist || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cart: cartData })
      });
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products from:', `${API_BASE}/products`);
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      console.log('Products fetched:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
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
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        // Fetch user's cart from server
        setTimeout(() => {
          fetchWishlist();
          fetchCart();
        }, 100);
        
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
            <Route path="/product/:id" element={<ProductDetailPage products={products} addToCart={addToCart} wishlistItems={wishlistItems} setWishlistItems={setWishlistItems} />} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateCartQuantity={updateCartQuantity} addToCart={addToCart} user={user} setNotification={setNotification} />} />
            <Route path="/login" element={<LoginPage login={login} user={user} />} />
            <Route path="/orders" element={<OrderStatusPage user={user} />} />
            <Route path="/wishlist" element={<WishlistPage user={user} wishlistItems={wishlistItems} setWishlistItems={setWishlistItems} addToCart={addToCart} />} />
            <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
            <Route path="/track/:orderId" element={<TrackOrderPage user={user} />} />
            <Route path="/checkout" element={<CheckoutPage user={user} />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
          </Routes>
        </main>
        <Footer />
        
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${
            notification.type === 'wishlist' ? 'bg-red-500' : 'bg-green-500'
          }`}>
            <div>
              <p className="font-semibold">{notification.message}</p>
              <p className="text-sm opacity-90">{notification.product}</p>
            </div>
            <Link 
              to={notification.type === 'wishlist' ? '/wishlist' : '/cart'}
              className={`bg-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${
                notification.type === 'wishlist' ? 'text-red-500' : 'text-green-500'
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

// Header Component
function Header({ user, logout, cartCount }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            SamriddhiShop
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Products</Link>
            <Link to="/cart" className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative">
              <span className="flex items-center space-x-1">
                <span>🛒</span>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
            {user && <Link to="/orders" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">My Orders</Link>}
            {user && <Link to="/wishlist" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Wishlist</Link>}
            {user && <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Profile</Link>}
            {user?.email === 'admin@samriddhishop.com' && (
              <Link to="/admin" className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-medium transition-colors">
                Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-600 text-sm">Hi, {user.name}</span>
                <button 
                  onClick={logout} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200 mt-4 bg-gray-50">
            <nav className="flex flex-col space-y-1 pt-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                to="/cart" 
                className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2 flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>🛒 Cart</span>
                {cartCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                    {cartCount}
                  </span>
                )}
              </Link>
              {user && (
                <Link 
                  to="/orders" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
              {user && (
                <Link 
                  to="/wishlist" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist
                </Link>
              )}
              {user && (
                <Link 
                  to="/profile" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-white transition-colors font-medium py-3 px-4 rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              )}
              {user?.email === 'admin@samriddhishop.com' && (
                <Link 
                  to="/admin" 
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium transition-colors mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              {user ? (
                <div className="pt-3 mt-3 border-t border-gray-300 mx-2">
                  <p className="text-gray-600 text-sm mb-3 px-2">Hi, {user.name}</p>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors w-full border"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mx-2 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Placeholder components - you'll need to implement these
function HomePage({ products, loading }) {
  return <div>Home Page - Products: {products.length}</div>;
}

function ProductListPage({ products, loading }) {
  return <div>Product List - Products: {products.length}</div>;
}

function ProductDetailPage({ products, addToCart, wishlistItems, setWishlistItems }) {
  return <div>Product Detail Page</div>;
}

function CartPage({ cart, removeFromCart, updateCartQuantity, addToCart, user, setNotification }) {
  return <div>Cart Page - Items: {cart.length}</div>;
}

function LoginPage({ login, user }) {
  return <div>Login Page</div>;
}

function OrderStatusPage({ user }) {
  return <div>Order Status Page</div>;
}

function WishlistPage({ user, wishlistItems, setWishlistItems, addToCart }) {
  return <div>Wishlist Page</div>;
}

function ProfilePage({ user, setUser }) {
  return <div>Profile Page</div>;
}

function TrackOrderPage({ user }) {
  return <div>Track Order Page</div>;
}

function CheckoutPage({ user }) {
  return <div>Checkout Page</div>;
}

function AdminPanel({ user }) {
  return <div>Admin Panel</div>;
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p>&copy; 2024 SamriddhiShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default App;