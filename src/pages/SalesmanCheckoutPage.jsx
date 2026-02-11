import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';

function SalesmanCheckoutPage({ API_BASE }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (!location.state || !location.state.cart) {
      navigate('/salesman');
      return;
    }
    setCart(location.state.cart);
    const cust = location.state.customer;
    setCustomer(cust);
    setCustomerPhone(location.state.customerPhone || (cust ? cust.phone : ''));

    if (cust && cust.addresses && cust.addresses.length > 0) {
      // Automatically select the most recent addresss
      setSelectedAddress(cust.addresses[cust.addresses.length - 1]);
    }
  }, [location, navigate]);

  const updatePrice = (productId, newPrice) => {
    setCart(cart.map(item => 
      item.productId === productId ? { ...item, finalPrice: parseFloat(newPrice) || 0 } : item
    ));
  };

  const handlePlaceOrder = async () => {
    // Validate prices
    for (const item of cart) {
      if (item.finalPrice < item.minSellPrice) {
        alert(`Price for ${item.name} cannot be less than ₹${item.minSellPrice}`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        customerPhone: customer ? customer.phone : customerPhone,
        items: cart.map(item => ({

          productId: item.productId,
          quantity: Number(item.quantity),
          finalPrice: Number(item.finalPrice)
        })),
        shippingAddress: selectedAddress
      };

      const response = await secureRequest(`${API_BASE}/api/salesman/orders`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Order placed successfully! Order ID: ${data.orderNumber}`);
        navigate('/salesman');
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to place order');
    }
    setLoading(false);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const isOrderValid = cart.every(item => item.finalPrice >= item.minSellPrice);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/salesman')} className="mr-4 text-gray-600 hover:text-gray-900">← Back</button>
          <h1 className="text-2xl font-bold text-gray-800">Salesman Checkout</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Customer Details</h2>
          {customer ? (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{customer.name}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{customer.phone}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{customer.email}</span></div>
              {selectedAddress && (
                <div className="col-span-2 mt-2 pt-2 border-t">
                  <span className="text-gray-500 block mb-1">Shipping Address:</span>

                  <div className="font-medium text-sm bg-gray-50 p-2 rounded border">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipCode}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="text-gray-500">Guest Phone:</span> <span className="font-medium">{customerPhone}</span>
              <p className="text-xs text-yellow-600 mt-1">New guest account will be created.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Order Items</h2></div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Product</th>
                <th className="p-4 font-medium text-gray-600">Qty</th>
                <th className="p-4 font-medium text-gray-600">Min Price</th>
                <th className="p-4 font-medium text-gray-600">Selling Price (₹)</th>
                <th className="p-4 font-medium text-gray-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cart.map(item => (
                <tr key={item.productId}>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4 text-red-600 text-sm">₹{item.minSellPrice}</td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={item.minSellPrice}
                      value={item.finalPrice}
                      onChange={(e) => updatePrice(item.productId, e.target.value)}
                      className={`w-32 px-2 py-1 border rounded ${item.finalPrice < item.minSellPrice ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                  </td>
                  <td className="p-4 text-right font-medium">₹{(item.finalPrice * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-gray-50 flex justify-between items-center border-t">
            <div className="text-xl font-bold">Total: ₹{totalAmount.toFixed(2)}</div>
            <button onClick={handlePlaceOrder} disabled={loading || !isOrderValid} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Processing...' : 'Place Order'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesmanCheckoutPage;