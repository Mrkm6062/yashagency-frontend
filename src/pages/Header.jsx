import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ 
  user, 
  logout, 
  cartCount, 
  wishlistCount, 
  notifications, 
  setUserNotifications, 
  LOGO_URL,
  t,
  makeSecureRequest
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false); // Hide search bar after search
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="YashAgency Logo" className="h-10 w-auto" />
              ) : (
                <span className="text-2xl font-bold text-gray-800">YashAgency</span>
              )}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link to="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
              {user && <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>}
            </nav>
            <div className="flex items-center space-x-4">
              {showSearch ? (
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => setShowSearch(false)}
                    placeholder="Search for products..."
                    className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 w-48"
                  />
                </form>
              ) : (
                <button onClick={() => setShowSearch(true)} className="text-gray-600 hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              )}
              <Link to="/cart" className="relative text-gray-600 hover:text-gray-900">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;