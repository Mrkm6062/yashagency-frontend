import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { useOutsideClick } from './useOutsideClick.js';
import { getOptimizedImageUrl } from './imageUtils.js';

const Header = React.memo(function Header({ user, logout, cartCount, wishlistCount, notifications, setUserNotifications, API_BASE, LOGO_URL, t, makeSecureRequest }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  useOutsideClick(notificationRef, () => {
    if (showNotifications) setShowNotifications(false);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products/allcategory?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false); // Hide search bar after search
    }
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className="relative group text-gray-700 transition-colors font-medium py-2" aria-current={isActive ? 'page' : undefined}>
        <span className={isActive ? 'text-green-700' : 'group-hover:text-green-600'}>{children}</span>
        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out ${isActive ? 'scale-x-100' : ''}`}></span>
      </Link>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await makeSecureRequest(`${API_BASE}/api/notifications/${notification._id}/read`, { method: 'PATCH' });
        setUserNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false); // Close dropdown immediately on navigation
  };

  const markAllAsRead = async () => {
    try {
      await makeSecureRequest(`${API_BASE}/api/notifications/read-all`, { method: 'PATCH' });
      setUserNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setTimeout(() => setShowNotifications(false), 500);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      alert('Could not mark all notifications as read. Please try again.');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await makeSecureRequest(`${API_BASE}/api/notifications/clear-all`, { method: 'DELETE' });
      // Re-fetch would be better, but for now just clear the state
      setUserNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      console.error("Failed to clear all notifications", error);
      alert('Could not clear notifications. Please try again.');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full mx-0 px-1 px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center h-14 hover:opacity-80 transition-opacity">
            {/* Desktop Logo */}
            <picture className="hidden md:block h-full">
              <source srcSet={getOptimizedImageUrl(LOGO_URL, { format: 'webp/png' })} type="image/webp" />
              <img src={LOGO_URL} alt="SamriddhiShop" className="h-full w-auto" />
            </picture>
            {/* Mobile Logo */}
            <picture className="md:hidden h-full">
              <source srcSet={getOptimizedImageUrl("https://storage.googleapis.com/samriddhi-blog-images-123/WhatsApp%20Image%202025-12-16%20at%2011.59.38%20AM.jpeg", { format: 'webp/png' })} type="image/webp" />
              <img src="https://storage.googleapis.com/samriddhi-blog-images-123/VERIFYLOGO%20ICON.webp" alt="SamriddhiShop" className="h-full w-auto" />
            </picture>
          </Link>

          {/* Search Bar - Centered */}
          <div className="hidden lg:flex flex-1 justify-center px-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>


          <nav className="hidden lg:flex items-center space-x-8">
            <NavLink to="/">{t('HOME')}</NavLink>
            <NavLink to="/products">{t('PRODUCTS')}</NavLink>
            <NavLink to="/blogs">BLOGS</NavLink>
            <NavLink to="/cart">
              <span className="flex items-center space-x-1"><span>🛒</span><span>{t('CART')}</span>
              {cartCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">{cartCount}</span>
              )}
              </span>
            </NavLink>
            {user && <NavLink to="/orders">MY ORDERS</NavLink>}
            {user && <NavLink to="/wishlist">
              <span className="flex items-center space-x-1">
                <span>❤️</span>
                <span>WISHLIST</span>
                {wishlistCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1 ml-1">{wishlistCount}</span>
                )}
              </span>
            </NavLink>}
            {user && <NavLink to="/profile">PROFILE</NavLink>}
            {(user?.role === 'admin' || user?.email === 'yashagency25@gmail.com') && (
              <Link to="/admin" className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-medium transition-colors">
                ADMIN
              </Link>
            )}
            {user && (
              <div className="hidden lg:block relative" ref={notificationRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700" aria-label="View notifications">
                  <FaBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (                  
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-20 transform-gpu sm:transform-none">
                    <div className="p-3 font-semibold border-b flex justify-between items-center">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:underline">Mark all as read</button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <Link
                            key={n._id}
                            to={n.link || '#'}
                            onMouseDown={() => handleNotificationClick(n)}
                            className={`block p-3 hover:bg-gray-50 border-b last:border-b-0 ${!n.read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm text-left">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1 text-left">{new Date(n.createdAt).toLocaleString()}</p>
                          </Link>
                        ))
                      ) : (
                        <p className="p-4 text-sm text-gray-500">No new notifications.</p>
                      )}
                    </div>
                    {notifications.length > 0 && (<div className="p-2 border-t text-center"><div role="button" tabIndex="0" onClick={clearAllNotifications} onKeyDown={(e) => e.key === 'Enter' && clearAllNotifications()} className="text-xs font-medium text-red-600 hover:underline cursor-pointer">Clear All</div></div>)}
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-600 text-sm">Hi, {user.name}</span>
                <button onClick={logout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border">{t('LOGOUT')}</button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">{t('LOGIN')}</Link>
            )}
          </nav>
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Mobile Icons */}
            <button onClick={() => setShowSearch(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {showSearch ? (
              <div className="absolute top-0 left-0 right-0 bg-white shadow-md p-4" style={{ transform: 'translateY(100%)' }}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => setShowSearch(false)}
                    placeholder="Search for products..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </form>
              </div>
            ) : null}

            {user && (
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700" aria-label="View notifications">
                  <FaBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-10">
                    <div className="p-3 font-semibold border-b flex justify-between items-center">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:underline">Mark all as read</button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <Link
                            key={n._id}
                            to={n.link || '#'}
                            onMouseDown={() => handleNotificationClick(n)}
                            className={`block p-3 hover:bg-gray-50 border-b last:border-b-0 ${!n.read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm text-left">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1 text-left">{new Date(n.createdAt).toLocaleString()}</p>
                          </Link>
                        ))
                      ) : (<p className="p-4 text-sm text-gray-500">No new notifications.</p>)}
                    </div>
                    {notifications.length > 0 && (<div className="p-2 border-t text-center"><div role="button" tabIndex="0" onClick={clearAllNotifications} onKeyDown={(e) => e.key === 'Enter' && clearAllNotifications()} className="text-xs font-medium text-red-600 hover:underline cursor-pointer">Clear All</div></div>)}
                  </div>
                )}
              </div>
            )}
            {(user?.role === 'admin' || user?.email === 'yashagency25@gmail.com' || user?.email === 'support@samriddhishop.in') && (
              <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 text-sm font-bold">
                ADMIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;