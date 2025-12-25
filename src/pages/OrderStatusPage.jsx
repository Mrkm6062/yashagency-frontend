import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';
import LoadingSpinner from '../LoadingSpinner.jsx';

function OrderStatusPage({ user, API_BASE, addToCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Orders - Yash Agency';
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    return () => { document.title = 'Yash Agency'; };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await secureRequest(`${API_BASE}/api/orders`);
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
      const response = await secureRequest(`${API_BASE}/api/orders/${orderId}/cancel`, { 
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

  const handleBuyAgain = (e, orderItems) => {
    e.stopPropagation(); // Prevent click from bubbling up to parent Link elements
    orderItems.forEach(item => {
      const productToAdd = { ...item.productId, selectedVariant: item.selectedVariant };
      for (let i = 0; i < item.quantity; i++) {
        addToCart(productToAdd);
      }
    });
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
            <div key={order._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.orderNumber || order._id.slice(-8)}</h3>
                  <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-sm font-bold text-green-600 mt-2">₹{order.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-gray-700">Items in this order:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <img src={item.productId.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.selectedVariant && (<p className="text-sm text-blue-600">{item.selectedVariant.size} - {item.selectedVariant.color}</p>)}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {['pending', 'processing'].includes(order.status) && (
                      <button onClick={() => handleCancelOrder(order._id)} className="px-10 text-red-500 hover:text-red-700 font-medium text-sm">Cancel Order</button>
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