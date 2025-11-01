import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { makeSecureRequest } from '../csrf.js';
import LoadingSpinner from '../LoadingSpinner.jsx';

function TrackOrderPage({ user, API_BASE }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [refundLoading, setRefundLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {    
    if (user && orderId) {
      document.title = `Track Order #${orderId.slice(-8)} - SamriddhiShop`;
      fetchOrderDetails();
    } else if (!user && orderId) {
        // If user is not logged in, we can't fetch order details. Redirect to login.
        navigate('/login', { state: { from: location } });
    } else if (!orderId) {
      // If no orderId is present in the URL, we can't track anything.
      navigate('/orders');
    }

    return () => {
      document.title = 'SamriddhiShop';
    };
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        generateTrackingHistory(data);
      } else {
        alert('Order not found');
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to fetch order details');
      navigate('/orders');
    }
    setLoading(false);
  };

  const handleOpenRefundModal = () => {
    if (order) {
      setRefundForm({
        name: order.shippingAddress?.name || user?.name || '',
        email: user?.email || '',
        subject: `Refund Details for Order #${order.orderNumber || order._id.slice(-8)}`,
        message: `Please provide the following details for your refund of ₹${order.total.toFixed(2)}:\n\n- Bank Name:\n- Account Holder Name:\n- Account Number:\n- IFSC Code:\n- UPI ID (Optional):`
      });
      setShowRefundModal(true);
    }
  };

  const handleRefundFormSubmit = async (e) => {
    e.preventDefault();
    setRefundLoading(true);
    try {
      const [contactResponse, orderUpdateResponse] = await Promise.all([
        makeSecureRequest(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refundForm)
        }),
        makeSecureRequest(`${API_BASE}/api/orders/${orderId}/refund-details-submitted`, {
          method: 'PATCH'
        })
      ]);

      if (contactResponse.ok && orderUpdateResponse.ok) {
        fetchOrderDetails();
        setShowRefundModal(false);
        alert('Your bank details have been submitted successfully. We will process your refund shortly.');
      } else {
        const errorData = await contactResponse.json();
        alert(errorData.error || 'Failed to submit details. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Refund form submission error:', error);
      alert('An error occurred. Please try again.');
    }
    setRefundLoading(false);
  };

  const handleRefundFormChange = (e) => {
    setRefundForm({ ...refundForm, [e.target.name]: e.target.value });
  };

  const generateTrackingHistory = (orderData) => {
    let timeline = [];
    const statusHistory = orderData.statusHistory || [];

    timeline.push({
      status: 'pending',
      title: 'Order Placed',
      description: 'Your order has been successfully placed and is being processed.',
      date: new Date(orderData.createdAt),
      completed: true,
    });

    statusHistory.forEach(historyItem => {
      if (historyItem.status !== 'pending') {
        let title = `Order ${historyItem.status.charAt(0).toUpperCase() + historyItem.status.slice(1)}`;
        let description = `Your order is now ${historyItem.status}.`;
        switch(historyItem.status) {
          case 'processing': title = 'Order Confirmed'; description = 'Your order has been confirmed and is being prepared for shipment.'; break;
          case 'shipped': title = 'Order Shipped'; description = 'Your order has been shipped and is on its way to you.'; break;
          case 'delivered': title = 'Order Delivered'; description = 'Your order has been successfully delivered.'; break;
        }
        timeline.push({ status: historyItem.status, title, description, date: new Date(historyItem.updatedAt), completed: true });
      }
    });

    const terminalStatuses = ['delivered', 'cancelled', 'refunded'];
    if (terminalStatuses.includes(orderData.status)) {
      if (!timeline.some(step => step.status === orderData.status)) {
        timeline.push({ status: orderData.status, title: `Order ${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}`, description: `This order has been ${orderData.status}.`, date: new Date(statusHistory.length > 0 ? statusHistory[statusHistory.length - 1].updatedAt : orderData.createdAt), completed: true });
      }
    } else {
      const expectedDelivery = orderData.courierDetails?.estimatedDelivery ? new Date(orderData.courierDetails.estimatedDelivery) : new Date(new Date(orderData.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000);
      timeline.push({ status: 'delivered', title: 'Expected Delivery', description: 'Your order will be delivered to your address.', date: expectedDelivery, completed: false, estimated: true });    
    }
    setTrackingHistory(timeline);
  };

  const getStatusIcon = (status, completed) => {
    if (completed && status !== 'cancelled' && status !== 'refunded') return '✅';
    switch (status) {
      case 'pending': return '📋';
      case 'processing': return '⏳';
      case 'shipped': return '🚚';
      case 'out-for-delivery': return '🚛';
      case 'delivered': return '📦';
      case 'cancelled': return '❌';
      case 'refunded': return '💸';
      default: return '⭕';
    }
  };

  const getStatusColor = (status, completed) => {
    if (completed) return 'text-green-600';
    if (status === order?.status) return 'text-blue-600';
    return 'text-gray-400';
  };

  if (loading) return <LoadingSpinner />;

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Order not found</h2>
        <Link to="/orders" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/orders')} className="text-blue-500 hover:text-blue-700 mb-4">← Back to Orders</button>
        <h1 className="text-3xl font-bold">Track Order #{order.orderNumber || order._id.slice(-8)}</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Order Details</h3>
            <p><strong>Order ID:</strong> #{order.orderNumber || order._id.slice(-8)}</p>
            <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Total Amount:</strong> ₹{order.total.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Current Status</h3>
            <div className="flex items-center space-x-2"><span className="text-2xl">{getStatusIcon(order.status, true)}</span><span className="font-medium capitalize text-lg">{order.status}</span></div>
            <p className="text-sm text-gray-600 mt-1">Last updated: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          {order.shippingAddress && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Delivery Address</h3>
              <p className="text-sm font-medium text-gray-800">{order.shippingAddress.name}</p>
              <p className="text-sm text-gray-700">{order.shippingAddress.mobileNumber} {order.shippingAddress.alternateMobileNumber && `(Alt: ${order.shippingAddress.alternateMobileNumber})`}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.street}<br />{order.shippingAddress.city}, {order.shippingAddress.state}<br />{order.shippingAddress.zipCode}, {order.shippingAddress.country}</p>
            </div>
          )}
        </div>
      </div>

      {order.courierDetails && (
        <div className="bg-blue-50 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">🚚 Shipping & Tracking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div><h3 className="font-semibold text-blue-700 mb-2">Courier Partner</h3><p className="text-lg font-medium text-blue-900">{order.courierDetails.courierName}</p></div>
            <div><h3 className="font-semibold text-blue-700 mb-2">Tracking Number</h3><p className="text-lg font-mono bg-white px-3 py-2 rounded border text-blue-900">{order.courierDetails.trackingNumber}</p></div>
            {order.courierDetails.shippedAt && (<div><h3 className="font-semibold text-blue-700 mb-2">Shipped Date</h3><p className="text-blue-900">{new Date(order.courierDetails.shippedAt).toLocaleDateString('en-IN')}</p><p className="text-sm text-blue-700">{new Date(order.courierDetails.shippedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></div>)}
            {order.courierDetails.estimatedDelivery && (<div><h3 className="font-semibold text-blue-700 mb-2">Expected Delivery</h3><p className="text-blue-900">{new Date(order.courierDetails.estimatedDelivery).toLocaleDateString('en-IN')}</p><p className="text-sm text-blue-700">Estimated</p></div>)}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-6">Tracking Timeline</h2>
        <div className="space-y-6">
          {trackingHistory.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex flex-col items-center"><div className={`text-2xl ${getStatusColor(step.status, step.completed)}`}>{getStatusIcon(step.status, step.completed)}</div>{index < trackingHistory.length - 1 && (<div className={`w-0.5 h-12 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-300'}`}></div>)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div><h3 className={`font-semibold ${step.completed ? 'text-green-600' : step.status === order.status ? 'text-blue-600' : 'text-gray-400'}`}>{step.title}</h3><p className={`text-sm mt-1 ${step.completed ? 'text-gray-700' : 'text-gray-500'}`}>{step.description}</p></div>
                  <div className="text-right"><p className={`text-sm ${step.completed ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{step.completed ? step.date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : `Expected: ${step.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div><h3 className="font-medium">{item.name}</h3>{item.selectedVariant && (<p className="text-sm text-blue-600">{item.selectedVariant.size} - {item.selectedVariant.color}</p>)}<p className="text-sm text-gray-600">Quantity: {item.quantity}</p></div>
              <div className="text-right"><p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p><p className="text-sm text-gray-600">₹{item.price} each</p></div>
            </div>
          ))}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span></div>
            {order.shippingCost > 0 && (<div className="flex justify-between text-gray-600"><span>Shipping</span><span>₹{order.shippingCost.toFixed(2)}</span></div>)}
            {order.couponCode && order.discount && (<div className="flex justify-between text-green-600"><span>Discount ({order.couponCode})</span><span>-₹{order.discount.toFixed(2)}</span></div>)}
            <div className="flex justify-between items-center pt-2 border-t">{order.paymentMethod === 'cod' && order.paymentStatus !== 'received' ? (<><span className="text-lg font-semibold">Payment Due at Delivery</span><span className="text-lg font-bold text-orange-600">₹{order.total.toFixed(2)}</span></>) : (<p><strong>Payment Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>)}</div>
          </div>
        </div>
      </div>

      {order.status === 'refunded' && (
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Refund Information</h3>
          {order.paymentMethod === 'cod' ? (order.refundDetailsSubmitted ? (<p className="text-green-700 text-sm font-medium">✓ You have shared your bank account details. Your refund will be processed within 5-7 business days.</p>) : (<><p className="text-yellow-700 text-sm mb-3">Since this was a Cash on Delivery order, please provide your bank account details for us to process the refund.</p><button onClick={handleOpenRefundModal} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Enter Bank Account Details</button></>)) : (<p className="text-yellow-700 text-sm">Your refund of <strong>₹{order.total.toFixed(2)}</strong> will be credited to your original payment method within 5-7 business days.</p>)}
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-800">Submit Refund Details</h3><p className="text-sm text-gray-600">Please fill out your bank details carefully.</p></div>
            <form onSubmit={handleRefundFormSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Subject</label><input type="text" name="subject" value={refundForm.subject} onChange={handleRefundFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" readOnly /></div>
              <div><label className="block text-sm font-medium text-gray-700">Bank Details</label><textarea name="message" value={refundForm.message} onChange={handleRefundFormChange} rows="6" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Please provide your bank details here." required /></div>
              <div className="p-4 border-t flex justify-end space-x-3"><button type="button" onClick={() => setShowRefundModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button><button type="submit" disabled={refundLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">{refundLoading ? 'Submitting...' : 'Submit Details'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
        <p className="text-blue-700 text-sm mb-3">If you have any questions about your order or delivery, please contact our support team.</p>
        <div className="flex space-x-4"><Link to="/support/contact" className="border border-blue-500 text-blue-500 px-4 py-2 rounded text-sm hover:bg-blue-50">Report Issue</Link></div>
      </div>
    </div>
  );
}

export default TrackOrderPage;