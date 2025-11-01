import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { makeSecureRequest } from '../csrf.js';

function CustomerServicePage({ API_BASE }) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const tabs = [
    { id: 'contact', label: 'Contact Us', icon: '📞' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'returns', label: 'Returns', icon: '↩️' },
    { id: 'shipping', label: 'Shipping', icon: '🚚' },
    { id: 'terms', label: 'Terms', icon: '📜' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' }
  ];

  useEffect(() => {
    const currentTab = location.pathname.split('/').pop();
    const activeTabInfo = tabs.find(t => t.id === currentTab);
    if (activeTabInfo) {
      document.title = `${activeTabInfo.label} - SamriddhiShop`;
    }
    return () => { document.title = 'SamriddhiShop'; };
  }, [location]);

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order by visiting the "My Orders" section in your profile or using the tracking link sent to your email.' },
    { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD). Credit/Debit cards and UPI payments are also available.' },
    { q: 'How long does delivery take?', a: 'Standard delivery takes 5-7 business days. Express delivery options are available for faster shipping.' },
    { q: 'Can I cancel my order?', a: 'Yes, you can cancel your order within 2 hours of placing it. Contact our support team for assistance.' },
    { q: 'What is your return policy?', a: 'You can return items within 1 day after delivery. Items must be unused and in original packaging.' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!contactForm.name.trim()) newErrors.name = 'Name is required.';
    if (!contactForm.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) newErrors.email = 'Email is invalid.';
    if (!contactForm.subject.trim()) newErrors.subject = 'Subject is required.';
    if (!contactForm.message.trim()) newErrors.message = 'Message is required.';
    else if (contactForm.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters long.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm({ ...contactForm, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleContactSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (response.ok) {
        alert('Message sent successfully! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      alert('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"><span>←</span><span>Back to Home</span></Link>
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><span className="text-3xl text-white">🎧</span></div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Customer Service</h1>
          <p className="text-gray-600">We're here to help you with any questions or concerns</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => (
                <Link key={tab.id} to={`/support/${tab.id}`} className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-2 font-medium whitespace-nowrap transition-all flex-grow ${location.pathname.endsWith(tab.id) ? 'border-b-3 border-blue-600 text-blue-600 bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`}>
                  <span className="text-base">{tab.icon}</span><span className="text-xs">{tab.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-8">
            <Routes>
              <Route path="contact" element={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2"><span>📝</span><span>Send us a Message</span></h2>
                    <div className="space-y-4">
                      <div><input type="text" name="name" placeholder="Your Name" value={contactForm.name} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}</div>
                      <div><input type="email" name="email" placeholder="Your Email" value={contactForm.email} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}</div>
                      <div><input type="text" name="subject" placeholder="Subject" value={contactForm.subject} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} />{errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}</div>
                      <div><textarea name="message" placeholder="Your Message" value={contactForm.message} onChange={handleInputChange} rows="4" className={`w-full px-4 py-3 border rounded-xl ${errors.message ? 'border-red-500' : 'border-gray-300'}`} />{errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}</div>
                      <button onClick={handleContactSubmit} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Sending...' : 'Send Message'}</button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-xl">📧</span></div><div><p className="font-semibold text-green-800">Email Support</p><p className="text-green-600">support@samriddhishop.in</p></div></div>
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-xl">📱</span></div><div><p className="font-semibold text-blue-800">Phone Support</p><p className="text-blue-600">+91 9580889615</p></div></div>
                      <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl"><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-xl">🕒</span></div><div><p className="font-semibold text-purple-800">Business Hours</p><p className="text-purple-600">Mon-Sat: 9AM-6PM</p></div></div>
                    </div>
                  </div>
                </div>
              } />
              <Route path="faq" element={
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2"><span>❓</span><span>Frequently Asked Questions</span></h2>
                  <div className="space-y-4">{faqs.map((faq, index) => (<div key={index} className="bg-gray-50 p-6 rounded-xl"><h3 className="font-semibold text-gray-800 mb-2">{faq.q}</h3><p className="text-gray-600">{faq.a}</p></div>))}</div>
                </div>
              } />
              <Route path="returns" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Return Policy</h2>
                  <p>You can return items within 1 day of delivery. Items must be unused and in original packaging. Some items like personalized products may not be eligible for return.</p>
                </div>
              } />
              <Route path="shipping" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Shipping Information</h2>
                  <p>We currently deliver to all major cities in Uttar Pradesh. Standard delivery takes 5-7 business days.</p>
                </div>
              } />
              <Route path="terms" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Terms of Service</h2>
                  <p>Welcome to SamriddhiShop. By using this site, you agree to be bound by these terms and conditions.</p>
                </div>
              } />
              <Route path="privacy" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h2>
                  <p>We use the information we collect to provide, maintain, protect and improve our services, and to protect SamriddhiShop and our users.</p>
                </div>
              } />
              <Route index element={<Navigate to="contact" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerServicePage;