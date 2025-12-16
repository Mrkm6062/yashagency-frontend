import React from 'react';
import { Link } from 'react-router-dom';

const BottomNavBar = React.memo(function BottomNavBar({ user, logout, cartCount, wishlistCount, location }) {

  const adminEmails = ['admin@samriddhishop.com', 'support@samriddhishop.in'];

  const isAdmin = user?.role === 'admin' || adminEmails.includes(user?.email);
    
  const navItems = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/products', icon: '🛍️', label: 'Shop' },
    { to: '/cart', icon: '🛒', label: 'Cart', count: cartCount, badgeColor: 'bg-blue-600' },
    { to: '/blogs', icon: '📝', label: 'Blogs' },
    { to: '/wishlist', icon: '❤️', label: 'Wishlist', requiresUser: true, count: wishlistCount },
    { to: '/orders', icon: '📦', label: 'Orders', requiresUser: true },
    { to: '/profile', icon: '👤', label: 'Profile', requiresUser: true },
  ];  

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-t-lg z-40">
      <nav className="flex justify-around items-center h-16">
        {navItems.map(item => {
          if ((item.requiresUser && !user)) return null;
          
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <Link key={item.label} to={item.to} className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`} style={{ lineHeight: '1.2' }}>
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              {item.count > 0 && (
                <span className={`absolute top-1 right-[28%] transform translate-x-1/2 ${item.badgeColor || 'bg-pink-500'} text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center p-1`}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
        {!user && (
          <Link to="/login" className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${location.pathname === '/login' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
            <span className="text-2xl">🔑</span>
            <span className={`text-xs font-medium ${location.pathname === '/login' ? 'font-bold' : ''}`}>Login</span>
          </Link>
        )}
      </nav>
    </div>
  );
});

export default BottomNavBar;