import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPasswordPage({ API_BASE }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Reset Password - Yash Agency';
    return () => { document.title = 'Yash Agency'; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        navigate('/login');
      } else {
        setMessage(data.error || 'Failed to reset password.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Enter New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium">New Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required /></div>
          <div><label className="block text-sm font-medium">Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required /></div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPasswordPage;