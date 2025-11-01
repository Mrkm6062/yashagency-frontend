import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaEnvelope, FaPhone } from 'react-icons/fa';

const Footer = React.memo(function Footer({ API_BASE, LOGO_URL }) {
  const [settings, setSettings] = useState({
    phone: '',
    email: '',
    instagram: '',
    facebook: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings`);
        if (response.ok) {
          setSettings(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch settings for footer:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-gray-800 text-white py-8 mt-12 lg:pb-8 pb-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="pr-4">
            <img src={LOGO_URL} alt="SamriddhiShop" className="h-24 mb-4" />
            <p className="text-gray-300 text-sm">Your trusted online shopping destination for quality products at great prices.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-300 hover:text-white">Home</Link></li>
                <li><Link to="/products" className="text-gray-300 hover:text-white">Products</Link></li>
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
          
          <div>
            <h4 className="font-semibold mb-3">Connect</h4>
            <div className="flex space-x-4">
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-2xl" aria-label="Follow us on Instagram"><FaInstagram /></a>}
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-2xl" aria-label="Follow us on Facebook"><FaFacebook /></a>}
              {settings.email && <a href={`mailto:${settings.email}`} className="text-gray-300 hover:text-white text-2xl" aria-label="Email us"><FaEnvelope /></a>}
              {settings.phone && <a href={`tel:${settings.phone}`} className="text-gray-300 hover:text-white text-2xl" aria-label="Call us"><FaPhone /></a>}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; 2024 SamriddhiShop. All rights reserved. | Built with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;