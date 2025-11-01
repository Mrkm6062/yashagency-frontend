import React, { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Forgot Password - SamriddhiShop';
    return () => { document.title = 'SamriddhiShop'; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message || 'An error occurred.');
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Your Password</h2>
        <p className="text-center text-gray-600 mb-6">Enter your email address and we will send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;