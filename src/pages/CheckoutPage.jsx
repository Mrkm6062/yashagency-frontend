import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function CheckoutPage({ user, clearCart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({ name: '', mobileNumber: '', alternateMobileNumber: '', street: '', city: '', state: '', zipCode: '', country: 'India', addressType: 'home' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingCost, setShippingCost] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState(0);

  const { items = [], total = 0, buyNow = false } = location.state || {};
  
  const subtotal = total;
  const tax = 0; // Tax functionality removed
  const finalTotal = subtotal + shippingCost - discount;

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!items || items.length === 0) {
      navigate('/cart');
      return;
    }
    document.title = 'Checkout - Yash Agency';
    fetchAddresses();
    fetchSettings();

    return () => { document.title = 'Yash Agency'; }
  }, [user, items, navigate]);

  // This effect will run whenever the selected address changes
  useEffect(() => {
    if (selectedAddress?.zipCode) {
      checkPincodeDeliverability(selectedAddress.zipCode);
      calculateShippingCost(selectedAddress.zipCode, selectedAddress.state);
    } else {
      // Reset deliverability and shipping if no address is selected
      setIsDeliverable(false);
      setDeliveryMessage('');
      setShippingCost(0); // Reset if no address is selected
    }
  }, [selectedAddress]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings`);
      const data = await response.json();
      setMinOrderAmount(data.minOrderAmount || 0);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const calculateShippingCost = async (pincode, state) => {
    try {
      const response = await fetch(`${API_BASE}/api/calculate-shipping`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pincode, state })
      });
      const data = await response.json();
      setShippingCost(data.shippingCost ?? 0);
    } catch (error) {
      console.error('Error fetching shipping cost:', error);
      setShippingCost(0); // Default to free on error
    }
  };

  const checkPincodeDeliverability = async (pincode) => {
    if (!pincode || pincode.length !== 6) {
      setIsDeliverable(false);
      setDeliveryMessage('Please select an address with a valid 6-digit pincode.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/check-pincode/${pincode}`);
      const data = await response.json();
      setIsDeliverable(data.deliverable);
      setDeliveryMessage(data.message);
    } catch (error) {
      setIsDeliverable(false);
      setDeliveryMessage('Could not verify pincode. Please try again.');
      console.error('Error checking pincode:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await secureRequest(`${API_BASE}/api/profile`);
      const data = await response.json();
      setAddresses(data.addresses || []);
      if (data.addresses && data.addresses.length > 0) {
        // Automatically select the home address or the first one if home is not found
        const defaultSelected = data.addresses.find(addr => addr.addressType === 'home') || data.addresses[0];
        setSelectedAddress(defaultSelected);
        // The useEffect for selectedAddress will now trigger the shipping calculation
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.name || !newAddress.mobileNumber) {
      alert('Please fill in all required fields for the new address.');
      return;
    }
    setLoading(true);
    try {
      const response = await secureRequest(`${API_BASE}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      if (response.ok) {
        const savedAddress = await response.json();
        await fetchAddresses(); // Refresh address list
        // Find the full address object from the refreshed list to select it
        const fullNewAddress = (await (await secureRequest(`${API_BASE}/api/profile`)).json()).addresses.find(a => a.street === newAddress.street);
        if (fullNewAddress) setSelectedAddress(fullNewAddress);

        setShowNewAddressForm(false); // Hide the form
        setNewAddress({ name: '', mobileNumber: '', alternateMobileNumber: '', street: '', city: '', state: '', zipCode: '', country: 'India', addressType: 'home' });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add address');
      }
    } catch (error) { alert('Failed to add address'); }
    setLoading(false);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const response = await secureRequest(`${API_BASE}/api/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, total: subtotal })
      });
      const data = await response.json();
      if (response.ok) {
        setDiscount(data.discount);
        setCouponId(data.couponId);
        alert(`Coupon applied! ₹${data.discount} discount`);
      } else {
        alert(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      alert('Failed to apply coupon');
    }
  };

  const placeOrder = async () => {
    let shippingAddress;

    if (selectedAddress) {
      shippingAddress = selectedAddress;
    } else if (newAddress.street && newAddress.city) {
      shippingAddress = newAddress;
    } else {
      alert('Please select or enter a shipping address');
      return;
    }

    if (!shippingAddress.zipCode) {
      alert('Please provide a pincode for delivery verification.');
      return;
    }

    setLoading(true);

    if (!selectedAddress && saveAddress && newAddress.street && newAddress.city) {
      try {
        await secureRequest(`${API_BASE}/api/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAddress)
        });
      } catch (error) {
        console.error('Error saving new address:', error);
      }
    }

    try {
      const payload = { items, total: finalTotal, shippingAddress, paymentMethod, couponCode, couponId, discount, shippingCost, tax };
      const response = await secureRequest(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        alert('Order placed successfully!');
        if (!buyNow) clearCart();
        navigate(`/track/${data.orderId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Checkout failed');
      }
    } catch (error) {
      alert('Checkout failed. Please try again.');
    }
    setLoading(false);
  };

  // Determine button text and action
  const getButtonConfig = () => {
    // Check minimum order amount
    if (minOrderAmount > 0 && subtotal < minOrderAmount) {
      return { 
        text: `Min Order: ₹${minOrderAmount}`, 
        action: () => alert(`Minimum order amount is ₹${minOrderAmount}. Please add more items.`), 
        disabled: true 
      };
    }
    // For COD
    return { text: '🛒 Place Order', action: placeOrder, disabled: loading || !termsAccepted || !selectedAddress || !isDeliverable };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
        >
          <span>&larr;</span>
          <span>Go Back</span>
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">{buyNow ? 'Complete your purchase' : 'Review your order and complete payment'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="">
              <h2 className="text-xl font-semibold text-gray-900 mb-4"> Select Delivery Address </h2>
              {addresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-gray-700">Saved Addresses</h3>
                  {addresses.map(address => (
                    <label 
                      key={address._id} 
                      className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?._id === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-100'}`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <input type="radio" name="address" onChange={() => { setSelectedAddress(address); setShowNewAddressForm(false); }} className="mt-1 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{address.name}<span className="ml-2 text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full capitalize">{address.addressType}</span></p>
                        <p className="font-medium text-gray-800">{address.mobileNumber}</p>
                        <p className="text-gray-600">{address.street}, {address.city}, {address.state} - {address.zipCode}</p>
                      </div>
                    </label>
                  ))}
                  {(deliveryMessage && selectedAddress && (
                    <div className={`p-3 rounded-lg text-sm font-medium text-center ${isDeliverable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {deliveryMessage}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-6">
                {!showNewAddressForm ? (
                  <button onClick={() => { setShowNewAddressForm(true); setSelectedAddress(null); }} className="w-full text-blue-600 border-2 border-dashed border-blue-300 hover:bg-blue-50 py-3 rounded-lg transition-colors">
                    + Add another address
                  </button>
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Full Name *" value={newAddress.name || ''} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} className="px-4 py-3 border rounded-lg" />
                      <input type="tel" placeholder="Mobile Number *" value={newAddress.mobileNumber || ''} onChange={(e) => setNewAddress({...newAddress, mobileNumber: e.target.value})} className="px-4 py-3 border rounded-lg" />
                      <input type="text" placeholder="Street Address *" value={newAddress.street || ''} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className="px-4 py-3 border rounded-lg" />
                      <input type="text" placeholder="City *" value={newAddress.city || ''} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="px-4 py-3 border rounded-lg" />
                      <input type="text" placeholder="State" value={newAddress.state || ''} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} className="px-4 py-3 border rounded-lg" />
                      <input type="text" placeholder="ZIP Code *" value={newAddress.zipCode || ''} onChange={(e) => {
                        setNewAddress({...newAddress, zipCode: e.target.value});
                        if (e.target.value.length === 6) {
                          checkPincodeDeliverability(e.target.value);
                          calculateShippingCost(e.target.value, newAddress.state);
                        }
                      }} className="px-4 py-3 border rounded-lg" />
                    </div>
                    <div className="mt-4">
                      <button onClick={handleAddAddress} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="">
              <h2 className="text-xl font-bold text-gray-900 mb-4"> Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer"><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-blue-500" /><div className="flex items-center space-x-3"><span className="text-2xl">💵</span><div><p className="font-medium">Cash on Delivery</p><p className="text-gray-600 text-sm">Pay on delivery</p></div></div></label>
              </div>
            </div>
          </div>
            <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start lg:h-fit">
              <div className="">
              <h2 className="text-xl font-bold text-gray-900 mb-4"> Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item, index) => (<div key={index} className="flex items-center space-x-3"><img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" /><div className="flex-1"><h3 className="font-medium text-sm">{item.name}</h3>{item.selectedVariant && (<p className="text-gray-500 text-xs">{item.selectedVariant.size} - {item.selectedVariant.color}</p>)}<p className="text-gray-600 text-sm">Qty: {item.quantity}</p></div><p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p></div>))}
              </div>
              <div className="border-t pt-4 mb-4"><div className="relative"><input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 pr-12 border rounded-lg" /><button onClick={applyCoupon} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-blue-600">→</button></div></div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{shippingCost > 0 ? `₹${shippingCost}` : 'Free'}</span></div>
                {minOrderAmount > 0 && subtotal < minOrderAmount && (
                  <div className="text-red-600 text-sm font-medium text-right">
                    Add items worth ₹{(minOrderAmount - subtotal).toLocaleString()} more
                  </div>
                )}
                {discount > 0 && (<div className="flex justify-between text-green-600"><span>Discount ({couponCode})</span><span>-₹{discount.toLocaleString()}</span></div>)}
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>₹{finalTotal.toLocaleString()}</span></div>
              </div>
              <div className="mt-4">
                <label className="flex items-start space-x-2">
                  <input 
                    type="checkbox" 
                    checked={termsAccepted} 
                    onChange={(e) => setTermsAccepted(e.target.checked)} 
                    className="mt-1 rounded text-blue-500 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-gray-600">
                    I have read and agree to the{' '}
                    <Link to="/support/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</Link>,{' '}
                    <Link to="/support/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{' '}
                    <Link to="/support/returns" target="_blank" className="text-blue-600 hover:underline">Refund Policy</Link>.
                  </span>
                </label>
              </div>
              
              <button onClick={getButtonConfig().action} disabled={getButtonConfig().disabled} className="w-full mt-6 bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '⏳ Processing...' : getButtonConfig().text}
              </button>

              <div className="mt-4 text-center"><p className="text-gray-500 text-sm">🔒 Your payment information is secure</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;