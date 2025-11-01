import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { makeSecureRequest } from '../csrf.js';
import LoadingSpinner from '../LoadingSpinner.jsx';

function OrderStatusPage({ user, API_BASE }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Orders - SamriddhiShop';
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    return () => { document.title = 'SamriddhiShop'; };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/orders/${orderId}/cancel`, { 
        method: 'PATCH',
      });

      if (response.ok) {
        fetchOrders(); // Re-fetch orders to show the updated status.
        alert('Order cancelled successfully.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to cancel order.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('An error occurred while trying to cancel the order.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Please login to view your orders</h2>
        <Link to="/login" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600 mb-4">No orders found</h2>
          <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.orderNumber || order._id.slice(-8)}</h3>
                  <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-xl font-bold text-green-600 mt-2">₹{order.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Order Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.selectedVariant && (<span className="text-blue-600 text-sm ml-2">({item.selectedVariant.size} - {item.selectedVariant.color})</span>)}
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {['pending', 'processing'].includes(order.status) && (
                      <button onClick={() => handleCancelOrder(order._id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Cancel Order</button>
                    )}
                    <Link to={`/track/${order._id}`} className="text-blue-500 hover:text-blue-700 font-medium">Track Order</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderStatusPage;