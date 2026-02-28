import React from 'react';
import { Link } from 'react-router-dom';
// import { getOptimizedImageUrl } from './imageUtils.js';

const Footer = React.memo(function Footer({ API_BASE, LOGO_URL }) {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12 lg:pb-8 pb-24">
      <div className="w-full mx-0 px-1 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="pr-4">
            {/* <picture>
              <source srcSet={getOptimizedImageUrl(LOGO_URL, { format: 'webp', width: 400 })} type="image/webp" />
              <img src={LOGO_URL} alt="YashAgency" width="227" height="67" className="w-auto mb-4" />
            </picture> */}
            <p className="text-gray-300 text-sm">Your trusted online shopping destination for quality products at great prices.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-300 hover:text-white">Home</Link></li>
                {/* <li><Link to="/products" className="text-gray-300 hover:text-white">Products</Link></li> */}
                <li><Link to="/orders" className="text-gray-300 hover:text-white">My Orders</Link></li>
                <li><Link to="/wishlist" className="text-gray-300 hover:text-white">Wishlist</Link></li>
                <li><Link to="/profile" className="text-gray-300 hover:text-white">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Customer Service</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/support/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
                <li><Link to="/support/faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
                <li><Link to="/support/returns" className="text-gray-300 hover:text-white">Return Policy</Link></li>
                <li><Link to="/support/shipping" className="text-gray-300 hover:text-white">Shipping Info</Link></li>
                <li><Link to="/support/terms" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
                <li><Link to="/support/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>              
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; 2026 Yash Agency. All rights reserved. | Built by Samriddhi Digital Solutions</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;