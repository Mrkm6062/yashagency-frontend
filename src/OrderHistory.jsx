import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function OrderHistory({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No orders yet.</p>
          <Link to="/products" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="border p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Order #{order.orderNumber || order._id}</span>
                <span className="text-green-600 font-bold">₹{order.total.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;