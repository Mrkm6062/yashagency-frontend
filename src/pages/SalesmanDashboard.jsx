import React, { useState, useEffect } from 'react';
import { secureRequest } from '../secureRequest.js';

function SalesmanDashboard({ user, API_BASE }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [orderHistory, setOrderHistory] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await secureRequest(`${API_BASE}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchOrderHistory();
    }
  }, [activeTab]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await secureRequest(`${API_BASE}/api/salesman/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.addresses && selectedCustomer.addresses.length > 0) {
      setSelectedAddress(selectedCustomer.addresses[selectedCustomer.addresses.length - 1]);
    } else {
      setSelectedAddress(null);
    }
  }, [selectedCustomer]);

  const searchCustomers = async (query) => {
    setCustomerSearch(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await secureRequest(`${API_BASE}/api/salesman/customers?search=${query}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) { console.error(error); }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product._id);
    if (existingItem) {
      alert('Product already in cart');
      return;
    }
    setCart([...cart, {
      productId: product._id,
      name: product.name,
      minSellPrice: product.minSellPrice || 0,
      price: product.price, // Default selling price
      finalPrice: product.price, // Editable
      quantity: 1,
      stock: product.stock
    }]);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartItem = (productId, field, value) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
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
        customerPhone: selectedCustomer ? selectedCustomer.phone : customerSearch,
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
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setShowCheckout(false);
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to place order');
    }
    setLoading(false);
  };

  const handleProceedToCheckout = () => {
    if (!selectedCustomer && (!customerSearch || customerSearch.length < 10)) {
      alert('Please select a customer or enter a valid phone number');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowCheckout(true);
    setShowMobileCart(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmount = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const isOrderValid = cart.every(item => item.finalPrice >= item.minSellPrice);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 z-20 py-2 border-b md:border-none">
          <h1 className="text-2xl font-bold text-gray-800">Salesman Dashboard</h1>
          
          <div className="flex items-center gap-4">
            {!showCheckout && activeTab === 'new' && (
              <button 
                onClick={() => setShowMobileCart(!showMobileCart)}
                className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <span>{showMobileCart ? '📦 Products' : '🛒 Cart'}</span>
                <span className="font-bold bg-white text-blue-600 rounded-full px-2 text-xs py-0.5">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </button>
            )}
            <div className="text-right hidden md:block">
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-gray-500">Salesman</p>
            </div>
          </div>
        </div>

        {!showCheckout && (
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'new' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            New Order
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Order History
          </button>
        </div>
        )}

        {activeTab === 'new' ? (
          showCheckout ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button onClick={() => setShowCheckout(false)} className="mr-4 text-gray-600 hover:text-gray-900">← Back</button>
                <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Customer Details</h2>
                {selectedCustomer ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedCustomer.name}</span></div>
                    <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedCustomer.phone}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedCustomer.email}</span></div>
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
                    <span className="text-gray-500">Guest Phone:</span> <span className="font-medium">{customerSearch}</span>
                    <p className="text-xs text-yellow-600 mt-1">New guest account will be created.</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6 border-b"><h2 className="text-lg font-semibold">Order Items</h2></div>
                <div className="overflow-x-auto">
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
                              onChange={(e) => updateCartItem(item.productId, 'finalPrice', parseFloat(e.target.value) || 0)}
                              className={`w-32 px-2 py-1 border rounded ${item.finalPrice < item.minSellPrice ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            />
                          </td>
                          <td className="p-4 text-right font-medium">₹{(item.finalPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-gray-50 flex justify-between items-center border-t">
                  <div className="text-xl font-bold">Total: ₹{totalAmount.toFixed(2)}</div>
                  <button onClick={handlePlaceOrder} disabled={loading || !isOrderValid} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Processing...' : 'Place Order'}</button>
                </div>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Selection Area */}
          <div className={`lg:col-span-2 space-y-6 ${showMobileCart ? 'hidden lg:block' : ''}`}>
            <div className="bg-white p-4 rounded-lg shadow">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div 
                        className="relative overflow-hidden aspect-[1/1] w-12 h-12 bg-gray-100 mb-2 rounded-lg cursor-pointer"
                        onClick={() => setFullScreenImage(product.imageUrl)}
                      >
                        <img 
                          src={product.imageUrl || 'https://via.placeholder.com/12x12?text=No+Image'}
                          alt={product.name}
                          className="w-12 h-12 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/12x12?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-sm">
                      <div className="text-gray-600">Base: <span className="font-medium text-gray-900">₹{product.price}</span></div>
                      <div className="text-red-600">Min: <span className="font-medium">₹{product.minSellPrice || 0}</span></div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">No products found</div>
              )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 font-medium text-gray-600">Product</th>
                      <th className="p-4 font-medium text-gray-600">Stock</th>
                      <th className="p-4 font-medium text-gray-600">Base Price</th>
                      <th className="p-4 font-medium text-gray-600">Min Price</th>
                      <th className="p-4 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map(product => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="p-4">
                      <div 
                        className="relative overflow-hidden aspect-[1/1] w-12 h-12bg-gray-100 mb-2 rounded-lg cursor-pointer"
                        onClick={() => setFullScreenImage(product.imageUrl)}
                      >
                        <img 
                          src={product.imageUrl || 'https://via.placeholder.com/12x12?text=No+Image'}
                          alt={product.name}
                          className="w-12 h-12 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/12x12?text=No+Image';
                          }}
                        />
                      </div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4">₹{product.price}</td>
                        <td className="p-4 text-red-600 font-medium">₹{product.minSellPrice || 0}</td>
                        <td className="p-4">
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">No products found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Order Creation Area */}
          <div className={`lg:col-span-1 ${!showMobileCart ? 'hidden lg:block' : ''}`}>
            <div className="bg-white p-6 rounded-lg shadow sticky top-4">
              <h2 className="text-lg font-bold mb-4">New Order</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                <input
                  type="text"
                  placeholder="Search Name, Email or Phone"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={customerSearch}
                  onChange={(e) => searchCustomers(e.target.value)}
                />
                {searchResults.length > 0 && !selectedCustomer && (
                  <div className="absolute z-10 bg-white border rounded shadow-lg w-full max-w-xs mt-1 max-h-48 overflow-y-auto">
                    {searchResults.map(c => (
                      <div 
                        key={c._id} 
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setSearchResults([]); }}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-gray-500 text-xs">{c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="mt-2 text-sm bg-blue-50 p-2 rounded flex justify-between items-center">
                    <span>Selected: <strong>{selectedCustomer.name}</strong></span>
                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-red-500 text-xs">Change</button>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={item.productId} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">×</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          className="w-full px-2 py-1 border rounded"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Final Price (Min: {item.minSellPrice})</label>
                        <input
                          type="number"
                          min={item.minSellPrice}
                          className={`w-full px-2 py-1 border rounded ${item.finalPrice < item.minSellPrice ? 'border-red-500 bg-red-50' : ''}`}
                          value={item.finalPrice}
                          onChange={(e) => updateCartItem(item.productId, 'finalPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right mt-2 text-sm font-medium">
                      Subtotal: ₹{(item.finalPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded">
                    Cart is empty
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleProceedToCheckout}
                  disabled={cart.length === 0 || !isOrderValid}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
          </div>
          )
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {orderHistory.map(order => (
                <div key={order._id} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-900">#{order.orderNumber || order._id.slice(-6)}</span>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="font-medium text-sm">{order.userId?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-500">{order.userId?.phone}</div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-sm text-gray-600">{order.items.length} items</span>
                    <span className="font-bold text-gray-900">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {orderHistory.length === 0 && <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">No orders found</div>}
            </div>

            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-medium text-gray-600">Order ID</th>
                    <th className="p-4 font-medium text-gray-600">Date</th>
                    <th className="p-4 font-medium text-gray-600">Customer</th>
                    <th className="p-4 font-medium text-gray-600">Items</th>
                    <th className="p-4 font-medium text-gray-600">Total</th>
                    <th className="p-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderHistory.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">#{order.orderNumber || order._id.slice(-6)}</td>
                      <td className="p-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="font-medium">{order.userId?.name || 'Guest'}</div>
                        <div className="text-sm text-gray-500">{order.userId?.phone}</div>
                      </td>
                      <td className="p-4 text-gray-600">{order.items.length} items</td>
                      <td className="p-4 font-medium">₹{order.total.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orderHistory.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>

      {fullScreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={() => setFullScreenImage(null)}>
          <div className="relative max-w-full max-h-full">
            <button 
              className="absolute -top-10 right-0 text-white text-2xl font-bold"
              onClick={() => setFullScreenImage(null)}
            >
              &times;
            </button>
            <img src={fullScreenImage} alt="Full Screen" className="max-w-full max-h-[90vh] object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesmanDashboard;
