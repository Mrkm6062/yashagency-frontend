import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { makeSecureRequest, clearCSRFToken } from '../csrf.js';
import { getToken, setToken, clearAuth } from '../storage.js';
import OrderHistory from '../OrderHistory.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function ProfilePage({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ name: '', mobileNumber: '', alternateMobileNumber: '', street: '', city: '', state: '', zipCode: '', country: 'India', addressType: 'home' });
  const [editingAddress, setEditingAddress] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState('initial'); // 'initial', 'otp_sent', 'verifying'
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'password', label: 'Security', icon: '🔒' },
    { id: 'logout', label: 'Logout', icon: '🚪', isAction: true },
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    const currentTab = tabs.find(tab => tab.id === activeTab);
    document.title = `${currentTab?.label || 'Profile'} - SamriddhiShop`;
    return () => { document.title = 'SamriddhiShop'; };
  }, [user, activeTab]);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProfile({ name: data.name, email: data.email, phone: data.phone || '', isEmailVerified: data.isEmailVerified });
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Profile updated successfully!'); // Note: Email is not updated via this route anymore if it's changed.
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      alert('Failed to update profile');
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Password changed successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      alert('Failed to change password');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    // Perform logout actions
    clearAuth(); // Clears token and user from cache and localStorage
    setUser(null); // Update user state in App.jsx
    localStorage.removeItem('cart'); // Clear guest cart on logout
    
    // Redirect to home page
    navigate('/');
  };

  const addAddress = async () => {
    if (!newAddress.street || !newAddress.city) {
      alert('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      if (response.ok) {
        await fetchProfile();
        setIsAddModalOpen(false); // Close modal on success
        setNewAddress({ name: '', mobileNumber: '', alternateMobileNumber: '', street: '', city: '', state: '', zipCode: '', country: 'India', addressType: 'home' });
        alert('Address added successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add address');
      }
    } catch (error) {
      alert('Failed to add address');
    }
    setLoading(false);
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/addresses/${addressId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchProfile();
        alert('Address deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete address');
      }
    } catch (error) {
      alert('Failed to delete address');
    }
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setIsEditModalOpen(true);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;
    setLoading(true);
    try {
        const response = await makeSecureRequest(`${API_BASE}/api/addresses/${editingAddress._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingAddress)
        });
        if (response.ok) {
            await fetchProfile();
            setIsEditModalOpen(false);
            setEditingAddress(null);
            alert('Address updated successfully!');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to update address');
        }
    } catch (error) {
        alert('Failed to update address');
    }
    setLoading(false);
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      alert('Please enter a valid new email address.');
      return;
    }
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/request-email-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setEmailChangeStep('otp_sent');
      } else {
        alert(data.error || 'Failed to send OTP for email change.');
      }
    } catch (error) {
      console.error('Request email change error:', error);
      alert('An error occurred while requesting email change.');
    }
    setLoading(false);
  };

  const handleVerifyEmailChange = async () => {
    if (!newEmail || !emailChangeOtp) {
      alert('Please enter the new email and OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/verify-email-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, otp: emailChangeOtp })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Update global user state and local storage with new email and token
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // Update token
        clearCSRFToken(); // Clear the old CSRF token
        setToken(data.token); // Update token in csrf.js

        // Reset form and re-fetch profile to ensure UI is updated
        setShowEmailChangeForm(false);
        setNewEmail('');
        setEmailChangeOtp('');
        setEmailChangeStep('initial');
        fetchProfile();
      } else {
        alert(data.error || 'Failed to verify email change.');
      }
    } catch (error) {
      console.error('Verify email change error:', error);
      alert('An error occurred while verifying email change.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🔐</span></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access your profile</p>
          <Link to="/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">Login to Continue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="w-full mx-0">
        <button
          onClick={() => navigate(-1)}
          className="my-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-white p-3 text-lg font-bold text-gray-800 shadow-md transition-colors hover:bg-gray-50 lg:hidden"
        >
          <span>&larr;</span>
          <span>My Profile</span>
        </button>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => {
                if (tab.isAction) {
                  return (
                    <button key={tab.id} onClick={handleLogout} className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all duration-200 flex-grow text-red-500 hover:bg-red-50`}>
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                }
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center space-y-1 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all duration-200 flex-grow ${activeTab === tab.id ? 'border-b-3 border-blue-600 text-blue-600 bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`}>
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label><input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" /></div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="flex items-center">
                        <input type="email" value={profile.email} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" readOnly />
                        {profile.isEmailVerified ? (
                          <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified
                          </span>
                        ) : (
                          <span className="ml-2 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full flex items-center">
                            Unverified
                          </span>
                        )}
                      </div>
                      {!showEmailChangeForm && (
                        <button onClick={() => setShowEmailChangeForm(true)} className="mt-2 text-blue-600 hover:underline text-sm">
                          Change Email
                        </button>
                      )}
                    </div>
                    {showEmailChangeForm && (
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Change Email Address</h4>
                        {emailChangeStep === 'initial' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="email"
                              placeholder="Enter new email address"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
                            />
                            <button onClick={handleRequestEmailChange} disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">
                              {loading ? 'Sending OTP...' : 'Request OTP'}
                            </button>
                          </div>
                        )}
                        {emailChangeStep === 'otp_sent' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Enter OTP"
                              value={emailChangeOtp}
                              onChange={(e) => setEmailChangeOtp(e.target.value)}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
                            />
                            <button onClick={handleVerifyEmailChange} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">
                              {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                          </div>
                        )}
                        <button onClick={() => setShowEmailChangeForm(false)} className="mt-2 text-red-600 hover:underline text-sm">
                          Cancel
                        </button>
                      </div>
                    )}
                    {/* Original email display, now with verification status */}
                    {/* <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Verified
                        </span>
                      </div>
                      <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" readOnly />
                    </div> */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r">+91</span>
                        <input type="tel" value={profile.phone?.replace(/^\+91/, '') || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setProfile({ ...profile, phone: `+91${digits}` }); } }} className="w-full px-4 py-3 border-none focus:ring-0" placeholder="9876543210" maxLength="10" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-9 text-center">
                    <button onClick={updateProfile} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-16 py-3 rounded-xl font-semibold">{loading ? 'Updating...' : 'Save Changes'}</button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <OrderHistory user={user} />
              </div>
            )}
            
            {activeTab === 'password' && (
              <div className="max-w-md mx-0">
                <div className="space-y-6">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full px-4 py-3 border rounded-xl" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label><input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-3 border rounded-xl" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-3 border rounded-xl" /></div>
                  <button onClick={changePassword} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold">{loading ? 'Updating...' : 'Update Password'}</button>
                  <div className="border-t pt-6 text-center">
                    <button onClick={() => navigate('/support/contact')} className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Contact Us & Policy</button>
                  </div>
                </div>
                
              </div>
            )}
            
            {activeTab === 'addresses' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-1xl font-bold text-gray-800">Saved Addresses</h2>
                  <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm">
                    + Add Address
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map(address => (
                    <div key={address._id} className="">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3"><span className="text-lg">{address.addressType === 'home' ? '🏠' : '🏢'}</span><span className="font-semibold text-blue-800">{address.name} ({address.addressType})</span></div>
                          <p className="font-medium text-gray-800 mb-1">{address.street}</p>
                          <p className="text-gray-600">{address.city}, {address.state}</p>
                          <p className="text-gray-600">{address.zipCode}, {address.country}</p>
                          <p className="font-small text-gray-800"> {address.mobileNumber}{address.alternateMobileNumber && `, ${address.alternateMobileNumber}`}</p>
                        </div>
                        <div className="flex flex-col space-y-2  transition-opacity">
                          <button onClick={() => openEditModal(address)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg" title="Edit address">Edit</button>
                          <button onClick={() => deleteAddress(address._id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg" title="Delete address">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEditModalOpen && editingAddress && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
                  <div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-800">Edit Address</h3></div>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" placeholder="Full Name *" value={editingAddress.name || ''} onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })} className="px-4 py-3 border rounded-xl" />
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r">+91</span>
                        <input type="tel" placeholder="Mobile Number *" value={editingAddress.mobileNumber?.replace(/^\+91/, '') || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setEditingAddress({ ...editingAddress, mobileNumber: `+91${digits}` }); } }} className="w-full px-4 py-3 border-none focus:ring-0" maxLength="10" />
                      </div>
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r">+91</span>
                        <input type="tel" placeholder="Alternate Mobile (Optional)" value={editingAddress.alternateMobileNumber?.replace(/^\+91/, '') || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setEditingAddress({ ...editingAddress, alternateMobileNumber: `+91${digits}` }); } }} className="w-full px-4 py-3 border-none focus:ring-0" maxLength="10" />
                      </div>
                      <input type="text" placeholder="Street Address *" value={editingAddress.street || ''} onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="City *" value={editingAddress.city || ''} onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="State" value={editingAddress.state || ''} onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="ZIP Code" value={editingAddress.zipCode || ''} onChange={(e) => setEditingAddress({ ...editingAddress, zipCode: e.target.value })} className="px-4 py-3 border rounded-xl" />
                      <div className="flex items-center space-x-4"><label><input type="radio" name="editAddressType" value="home" checked={editingAddress.addressType === 'home'} onChange={(e) => setEditingAddress({ ...editingAddress, addressType: e.target.value })} className="mr-1" /> Home</label><label><input type="radio" name="editAddressType" value="work" checked={editingAddress.addressType === 'work'} onChange={(e) => setEditingAddress({ ...editingAddress, addressType: e.target.value })} className="mr-1" /> Work</label></div>
                    </div>
                  </div>
                  <div className="p-6 border-t flex justify-end space-x-4">
                    <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold">Cancel</button>
                    <button onClick={handleUpdateAddress} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold">{loading ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </div>
              </div>
            )}

            {isAddModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
                  <div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-800">Add New Address</h3></div>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" placeholder="Full Name *" value={newAddress.name || ''} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} className="px-4 py-3 border rounded-xl" />
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r">+91</span>
                        <input type="tel" placeholder="Mobile Number *" value={newAddress.mobileNumber?.replace(/^\+91/, '') || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setNewAddress({ ...newAddress, mobileNumber: `+91${digits}` }); } }} className="w-full px-4 py-3 border-none focus:ring-0" maxLength="10" />
                      </div>
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r">+91</span>
                        <input type="tel" placeholder="Alternate Mobile (Optional)" value={newAddress.alternateMobileNumber?.replace(/^\+91/, '') || ''} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setNewAddress({ ...newAddress, alternateMobileNumber: `+91${digits}` }); } }} className="w-full px-4 py-3 border-none focus:ring-0" maxLength="10" />
                      </div>
                      <input type="text" placeholder="Street Address *" value={newAddress.street || ''} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="City *" value={newAddress.city || ''} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="State" value={newAddress.state || ''} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} className="px-4 py-3 border rounded-xl" />
                      <input type="text" placeholder="ZIP Code" value={newAddress.zipCode || ''} onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})} className="px-4 py-3 border rounded-xl" />
                      <div className="flex items-center space-x-4"><label><input type="radio" name="addressType" value="home" checked={newAddress.addressType === 'home'} onChange={(e) => setNewAddress({...newAddress, addressType: e.target.value})} className="mr-1" /> Home</label><label><input type="radio" name="addressType" value="work" checked={newAddress.addressType === 'work'} onChange={(e) => setNewAddress({...newAddress, addressType: e.target.value})} className="mr-1" /> Work</label></div>
                    </div>
                  </div>
                  <div className="p-6 border-t flex justify-end space-x-4">
                    <button onClick={() => setIsAddModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold">Cancel</button>
                    <button onClick={addAddress} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold">{loading ? 'Adding...' : 'Add Address'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;