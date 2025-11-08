import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FaHourglassHalf, FaCog, FaTruck, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import { makeSecureRequest } from '../csrf.js';
import { getToken } from '../storage.js';
import SalesChart from '../SalesChart.jsx';
import DeliveryAreaManagement from '../DeliveryAreaManagement.jsx';
import ProductForm from './ProductForm.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const LOGO_URL = "https://storage.googleapis.com/samriddhi-blog-images-123/bigsize.png";

function AdminPanel({ user, API_BASE }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({ search: '', userType: 'all', sortBy: 'name' });
  const [contacts, setContacts] = useState([]);
  const [settingsForm, setSettingsForm] = useState({ shippingCost: 0, phone: '', email: '', instagram: '', facebook: '' });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [orderFilters, setOrderFilters] = useState({ startDate: '', endDate: '', status: 'all', searchTerm: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryAreas, setDeliveryAreas] = useState({ states: [], districts: [], pincodes: [] });
  const [courierForm, setCourierForm] = useState({ courierName: '', trackingNumber: '', estimatedDelivery: '', notes: '' });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Coupon form state
  const [couponForm, setCouponForm] = useState({
    code: '', discount: '', type: 'percentage', minAmount: '', maxDiscount: '', expiryDate: '', oneTimeUse: false
  });
  const [couponReport, setCouponReport] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [bannerForm, setBannerForm] = useState({ desktop: { title: '', subtitle: '', backgroundImage: '', backgroundVideo: '' }, mobile: { title: '', subtitle: '', backgroundImage: '', backgroundVideo: '' } });
  const [adminNotification, setAdminNotification] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (user?.email !== 'admin@samriddhishop.com') {
      return;
    }
    document.title = 'Admin Panel - SamriddhiShop';
    fetchData();
    return () => { document.title = 'SamriddhiShop'; };
  }, [user]);

  const fetchData = async () => {
    try {
      const token = getToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const [productsRes, ordersRes, couponsRes, usersRes, contactsRes, settingsRes, analyticsRes, bannerRes, deliveryAreasRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/products`, { headers }),
        fetch(`${API_BASE}/api/admin/orders`, { headers }),
        fetch(`${API_BASE}/api/admin/coupons`, { headers }),
        fetch(`${API_BASE}/api/admin/users`, { headers }),
        fetch(`${API_BASE}/api/admin/contacts`, { headers }),
        fetch(`${API_BASE}/api/settings`, { headers }),
        fetch(`${API_BASE}/api/admin/analytics`, { headers }),
        fetch(`${API_BASE}/api/banner`),
        fetch(`${API_BASE}/api/admin/delivery-areas`, { headers })
      ]);
      
      setProducts(await productsRes.json());
      setOrders(await ordersRes.json());
      setCoupons(await couponsRes.json());
      const userData = await usersRes.json();
      setUsers(userData);
      setFilteredUsers(userData);
      setContacts(await contactsRes.json());
      const settingsData = await settingsRes.json() || {};
      setSettingsForm(settingsData);
      setAnalytics(await analyticsRes.json());
      const bannerData = await bannerRes.json();
      setBannerForm(bannerData);
      const deliveryData = await deliveryAreasRes.json();
      setDeliveryAreas(deliveryData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchOrdersByDate = async () => {
    try {
      const params = new URLSearchParams(orderFilters);
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/orders/date-range?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching filtered orders:', error);
    }
  };

  const toggleProduct = async (productId, enabled) => {
    try {
      await makeSecureRequest(`${API_BASE}/api/admin/products/${productId}/toggle`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !enabled }) });
      fetchData();
      localStorage.removeItem('products_cache');
    } catch (error) { alert('Failed to toggle product'); }
  };

  const updateOrderStatus = async (orderId, status, withCourier = false) => {
    try {
      const payload = { status };
      if (withCourier && status === 'shipped') {
        Object.assign(payload, courierForm);
      }
      await makeSecureRequest(`${API_BASE}/api/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      fetchData();
      setSelectedOrder(null);
      setCourierForm({ courierName: '', trackingNumber: '', estimatedDelivery: '', notes: '' });
      alert('Order status updated!');
    } catch (error) { alert('Failed to update order status'); }
  };

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === 'shipped') setSelectedOrder(orderId);
    else updateOrderStatus(orderId, newStatus);
  };

  const saveCoupon = async () => {
    setLoading(true);
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/admin/coupons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(couponForm) });
      if (response.ok) {
        alert('Coupon created!');
        setCouponForm({ code: '', discount: '', type: 'percentage', minAmount: '', maxDiscount: '', expiryDate: '', oneTimeUse: false });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create coupon');
      }
    } catch (error) { alert('Failed to create coupon'); }
    setLoading(false);
  };

  const toggleCoupon = async (couponId, isActive) => {
    try {
      await makeSecureRequest(`${API_BASE}/api/admin/coupons/${couponId}/toggle`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) });
      fetchData();
    } catch (error) { alert('Failed to toggle coupon'); }
  };

  const fetchCouponReport = async () => {
    try {
      const response = await makeSecureRequest(`${API_BASE}/api/admin/coupons/report`);
      const data = await response.json();
      setCouponReport(data);
      setShowReport(true);
    } catch (error) { alert('Failed to fetch coupon report'); }
  };

  const updateSettings = async () => {
    try {
      await makeSecureRequest(`${API_BASE}/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm) });
      alert('Settings updated successfully!');
    } catch (error) { alert('Failed to update settings.'); }
  };

  const updateBanner = async () => {
    try {
      await makeSecureRequest(`${API_BASE}/api/admin/banner`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bannerForm) });
      alert('Banner updated successfully!');
    } catch (error) { alert('Failed to update banner'); }
  };

  const handlePrintKOT = (order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write('<html><head><title>Customer Receipt</title>');
    printWindow.document.write('<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>');
    printWindow.document.write('<style>');    
    printWindow.document.write(`
      @media print { @page { size: 80mm auto; margin: 2mm; } }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; color: #000; }
      .kot-container { width: 100%; box-sizing: border-box; }
      .logo-container { text-align: center; margin-bottom: 15px; }
      .logo { max-height: 60px; }
      .barcode-container { text-align: center; margin-top: 15px; }
      h1 { text-align: center; margin: 0 0 15px; font-size: 1.2rem; }
      .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 15px; margin-bottom: 15px; }
      .details-grid p { margin: 0; font-size: 0.8rem; }
      .details-grid .full-width { grid-column: 1 / -1; }
      .products-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .products-table th, .products-table td { border: 1px solid #ccc; padding: 4px; text-align: left; font-size: 0.8rem; }
      .products-table th { background-color: #f2f2f2; }
      .total-row td { font-weight: bold; }
      strong { font-weight: 600; }
    `);
    printWindow.document.write('</style></head><body>');
    
    const address = order.shippingAddress;
    const orderIdForBarcode = order.orderNumber || order._id.slice(-8);
    const fullAddress = `${address.street}, ${address.city}, ${address.state || ''} - ${address.zipCode || ''}`;
    const phoneNumbers = `${address.mobileNumber}${address.alternateMobileNumber ? `, Alt: ${address.alternateMobileNumber}` : ''}`;

    printWindow.document.write('<div class="kot-container">');
    printWindow.document.write('<div class="logo-container">');
    printWindow.document.write(`<img src="${LOGO_URL}" alt="SamriddhiShop Logo" class="logo" />`);
    printWindow.document.write('</div>');
    printWindow.document.write('<h1>Customer Receipt</h1>');
    printWindow.document.write(`<p style="text-align:center; font-size: 0.8rem; margin-bottom: 15px;">${new Date(order.createdAt).toLocaleString('en-IN')}</p>`);
    printWindow.document.write('<div class="details-grid">');
    printWindow.document.write(`<p><strong>Order ID:</strong> ${order.orderNumber || order._id.slice(-8)}</p>`);
    printWindow.document.write(`<p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>`);    
    printWindow.document.write(`<p><strong>Name:</strong> ${address.name || order.userId?.name || 'N/A'}</p>`);
    printWindow.document.write(`<p><strong>Phone:</strong> ${address.mobileNumber || order.userId?.phone || 'N/A'}</p>`);
    printWindow.document.write(`<p class="full-width"><strong>Address:</strong> ${fullAddress}</p>`);
    printWindow.document.write(`<p class="full-width"><strong>Email:</strong> ${order.userId?.email || 'N/A'}</p>`);
    printWindow.document.write(`<p class="full-width"><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</p>`);
    printWindow.document.write('</div>');

    printWindow.document.write('<table class="products-table">');
    printWindow.document.write('<thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>');
    printWindow.document.write('<tbody>');
    
    let subtotal = 0;
    order.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      printWindow.document.write(`<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price.toFixed(2)}</td><td>₹${itemTotal.toFixed(2)}</td></tr>`);
    });

    printWindow.document.write('</tbody>');
    printWindow.document.write('</table>');

    printWindow.document.write(`<div style="text-align: right; margin-top: 15px; font-size: 1.1rem;"><strong>Grand Total: ₹${order.total.toFixed(2)}</strong></div>`);

    printWindow.document.write('<div class="barcode-container">');
    printWindow.document.write(`<svg id="barcode"></svg>`);
    printWindow.document.write('</div>');
    
    printWindow.document.write('<div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">');
    printWindow.document.write('<p style="margin: 0; font-weight: bold;">Thank You for Your Purchase!</p>');
    printWindow.document.write('<p style="margin: 5px 0 0; font-size: 0.9rem;">Please Visit Again</p>');
    printWindow.document.write('</div>');

    printWindow.document.write('</div>');

    printWindow.document.write('<script>');
    printWindow.document.write(`JsBarcode("#barcode", "${orderIdForBarcode}", { format: "CODE128", height: 40, displayValue: true, fontSize: 14, margin: 5 });`);
    printWindow.document.write('</script>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    // Add a delay to allow content (like images and barcode) to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 1000); // 1-second delay
  };

  const getReceiptHTML = (order) => {
    const address = order.shippingAddress;
    const orderId = order.orderNumber || order._id.slice(-8);
    const fullAddress = `${address.street}, ${address.city}, ${address.state || ''} - ${address.zipCode || ''}, ${address.country || ''}`;

    let itemsHtml = '';
    order.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      itemsHtml += `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price.toFixed(2)}</td><td>₹${itemTotal.toFixed(2)}</td></tr>`;
    });

    return `
      <div class="kot-container">
        <div class="logo-container"><img src="${LOGO_URL}" alt="Logo" class="logo" crossorigin="anonymous" /></div>
        <h1>Customer Receipt</h1>
        <div class="details-grid">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          <p><strong>Name:</strong> ${address.name || order.userId?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${address.mobileNumber || order.userId?.phone || 'N/A'}</p>
          <p class="full-width"><strong>Address:</strong> ${fullAddress}</p>
        </div>
        <table class="products-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; margin-top: 15px; font-size: 1.1rem;"><strong>Grand Total: ₹${order.total.toFixed(2)}</strong></div>
        <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">
          <p style="margin: 0; font-weight: bold;">Thank You for Your Purchase!</p>
        </div>
      </div>
    `;
  };

  const handleDownloadPDF = async (order) => {
    const orderId = order.orderNumber || order._id.slice(-8);
    const receiptElement = document.createElement('div');
    receiptElement.style.width = '400px'; // Standard thermal printer width
    receiptElement.style.padding = '20px';
    receiptElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    receiptElement.innerHTML = `
      <style>
        .kot-container { border: 2px solid #000; padding: 15px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-height: 60px; }
        h1 { text-align: center; margin: 0 0 15px; font-size: 1.5rem; }
        .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 15px; margin-bottom: 15px; }
        .details-grid p { margin: 0; font-size: 0.9rem; }
        .details-grid .full-width { grid-column: 1 / -1; }
        .products-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .products-table th, .products-table td { border: 1px solid #ccc; padding: 6px; text-align: left; font-size: 0.9rem; }
        .products-table th { background-color: #f2f2f2; }
        strong { font-weight: 600; }
      </style>
      ${getReceiptHTML(order)}
    `;

    document.body.appendChild(receiptElement);
    const canvas = await html2canvas(receiptElement, { useCORS: true });
    document.body.removeChild(receiptElement);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`receipt-${orderId}.pdf`);
  };

  const handlePrintFilteredOrders = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Filtered Orders Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 20px; }
      h1 { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9rem; }
      th { background-color: #f2f2f2; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        button { display: none; }
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h1>Filtered Orders Report</h1>');
    printWindow.document.write(`<p>Generated on: ${new Date().toLocaleString('en-IN')}</p>`);
    printWindow.document.write(`<p>Total Orders: ${orders.length}</p>`);
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>');
    printWindow.document.write('<tbody>');

    orders.forEach(order => {
      printWindow.document.write(`
        <tr>
          <td>${order.orderNumber || order._id.slice(-8)}</td>
          <td>${new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
          <td>${order.userId?.name || 'N/A'}</td>
          <td>₹${order.total.toFixed(2)}</td>
          <td>${order.status}</td>
          <td>${order.paymentMethod === 'cod' ? `COD: ${order.paymentStatus}` : 'Prepaid'}</td>
        </tr>
      `);
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const applyUserFilters = (filters) => {
    let filtered = [...users];
    if (filters.search) filtered = filtered.filter(user => user.name.toLowerCase().includes(filters.search.toLowerCase()) || user.email.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.userType === 'admin') filtered = filtered.filter(user => user.email === 'admin@samriddhishop.com');
    else if (filters.userType === 'user') filtered = filtered.filter(user => user.email !== 'admin@samriddhishop.com');
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'email': return a.email.localeCompare(b.email);
        case 'orders-high': return (b.orderCount || 0) - (a.orderCount || 0);
        case 'amount-high': return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'date-new': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-old': return new Date(a.createdAt) - new Date(b.createdAt);
        default: return a.name.localeCompare(b.name);
      }
    });
    setFilteredUsers(filtered);
  };

  if (user?.email !== 'admin@samriddhishop.com') {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p className="text-gray-600 mt-2">Admin access required</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg min-h-screen transition-all duration-300`}>
          <div className="p-4 border-b flex items-center justify-between h-[68px]">
            {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">🛠️ Admin</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">{sidebarOpen ? '←' : '→'}</button>
          </div>
          <nav className="p-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'orders', label: 'Orders', icon: '🛒' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'messages', label: 'Messages', icon: '💬' },
              { id: 'coupons', label: 'Coupons', icon: '🎫' },
              { id: 'banner', label: 'Banner', icon: '🖼️' },
              { id: 'delivery-area', label: 'Delivery Area', icon: '🗺️' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <Link key={tab.id} to={`/admin/${tab.id}`} className={`w-full flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} px-4 py-3 rounded-lg mb-2 font-medium transition-all duration-200 ${location.pathname.endsWith(tab.id) ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`} title={!sidebarOpen ? tab.label : ''} onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                <div className="relative group" onClick={() => setSidebarOpen(false)}>
                  <span className="text-lg">{tab.icon}</span>
                  {!sidebarOpen && (<div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">{tab.label}</div>)}
                </div>
                {sidebarOpen && <span className="ml-3">{tab.label}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex-1 p-4 md:p-8 relative">
          {/* Mobile Header and Dropdown */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100">
                <span className="text-xl">☰</span>
              </button>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Dropdown Menu */}
            {sidebarOpen && (
              <div className="absolute top-16 left-4 right-4 bg-white rounded-lg shadow-lg border z-20">
                <nav className="p-2">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                    { id: 'products', label: 'Products', icon: '📦' },
                    { id: 'orders', label: 'Orders', icon: '🛒' },
                    { id: 'users', label: 'Users', icon: '👥' },
                    { id: 'messages', label: 'Messages', icon: '💬' },
                    { id: 'coupons', label: 'Coupons', icon: '🎫' },
                    { id: 'banner', label: 'Banner', icon: '🖼️' },
                    { id: 'delivery-area', label: 'Delivery Area', icon: '🗺️' },
                    { id: 'settings', label: 'Settings', icon: '⚙️' }
                  ].map(tab => (
                    <Link key={tab.id} to={`/admin/${tab.id}`} onClick={() => setSidebarOpen(false)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 font-medium transition-colors ${location.pathname.endsWith(tab.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>

          <div className="">
            <Routes>
              <Route path="dashboard" element={
                <div className="w-full space-y-6">
                  <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Dashboard Overview</h3>
                  </div>
                  <div className="flex justify-between items-center mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg"><h4 className="text-blue-800 font-semibold text-xs">Today's Orders</h4><p className="text-lg font-bold text-blue-600">{analytics.today?.totalOrders || 0}</p></div>
                    <div className="bg-green-50 p-3 rounded-lg"><h4 className="text-green-800 font-semibold text-xs">Today's Revenue</h4><p className="text-lg font-bold text-green-600">₹{(analytics.today?.totalRevenue || 0).toLocaleString()}</p></div>
                    <div className="bg-purple-50 p-3 rounded-lg"><h4 className="text-purple-800 font-semibold text-xs">Today's COD Orders</h4><p className="text-lg font-bold text-purple-600">{analytics.today?.codOrders || 0}</p></div>
                    <div className="bg-yellow-50 p-3 rounded-lg"><h4 className="text-yellow-800 font-semibold text-xs">Today's COD Revenue</h4><p className="text-lg font-bold text-yellow-600">₹{(analytics.today?.codRevenue || 0).toLocaleString()}</p></div>
                    <div className="bg-red-50 p-3 rounded-lg"><h4 className="text-red-800 font-semibold text-xs">Today's Prepaid Orders</h4><p className="text-lg font-bold text-red-600">{analytics.today?.prepaidOrders || 0}</p></div>
                    <div className="bg-indigo-50 p-3 rounded-lg"><h4 className="text-indigo-800 font-semibold text-xs">Today's Prepaid Revenue</h4><p className="text-lg font-bold text-indigo-600">₹{(analytics.today?.prepaidRevenue || 0).toLocaleString()}</p></div>
                    <div className="bg-pink-50 p-3 rounded-lg"><h4 className="text-pink-800 font-semibold text-xs">Total Cancelled</h4><p className="text-lg font-bold text-pink-600">₹{(analytics.totalCancelled || 0).toLocaleString()}</p></div>
                    <div className="bg-orange-50 p-3 rounded-lg"><h4 className="text-orange-800 font-semibold text-xs">Total Refunded</h4><p className="text-lg font-bold text-orange-600">₹{(analytics.totalRefunded || 0).toLocaleString()}</p></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><h4 className="text-gray-800 font-semibold text-xs">Total Revenue</h4><p className="text-lg font-bold text-gray-600">₹{(analytics.totalRevenue || 0).toLocaleString()}</p></div>
                  </div>
                  {analytics.weeklySales?.length > 0 && <div className="bg-white p-2 rounded-lg shadow-sm border mt-6"><SalesChart salesData={analytics.weeklySales} /></div>}
                  <div className="mt-6">
                      <h4 className="font-semibold mb-4">Order Status Distribution</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                          {analytics.statusCounts?.map(status => {
                              const getStatusConfig = (statusId) => {
                                  switch (statusId) {
                                      case 'pending': return { color: 'bg-red-100 text-red-800', icon: <FaHourglassHalf className="mx-auto mb-2 text-3xl" /> };
                                      case 'processing': return { color: 'bg-yellow-100 text-yellow-800', icon: <FaCog className="mx-auto mb-2 text-3xl animate-spin-slow" /> };
                                      case 'shipped': return { color: 'bg-blue-100 text-blue-800', icon: <FaTruck className="mx-auto mb-2 text-3xl" /> };
                                      case 'delivered': return { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="mx-auto mb-2 text-3xl" /> };
                                      default: return { color: 'bg-gray-100 text-gray-800', icon: <FaQuestionCircle className="mx-auto mb-2 text-3xl" /> };
                                  }
                              };
                              const config = getStatusConfig(status._id);
                              return (<div key={status._id} className={`p-6 rounded-lg text-center ${config.color}`}>{config.icon}<p className="text-2xl font-bold">{status.count}</p><p className="font-semibold capitalize">{status._id}</p></div>);
                          })}
                      </div>
                  </div>
                </div>
              } />

              <Route path="products" element={
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Products Management</h3>
                    <button onClick={() => setShowProductForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"> + Add New Product</button>
                  </div>
                  <ProductForm
                    showProductForm={showProductForm}
                    setShowProductForm={setShowProductForm}
                    editingProduct={editingProduct}
                    setEditingProduct={setEditingProduct}
                    fetchData={fetchData}
                    setAdminNotification={setAdminNotification}
                    API_BASE={API_BASE}
                  />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Products List</h3>
                    
                    {/* Mobile Card View */}
                    <div className="space-y-4 md:hidden">
                      {products.map(product => (
                        <div key={product._id} className="bg-white p-4 rounded-lg shadow border">
                          <div className="flex items-start gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 truncate">{product.name}</p>
                              <p className="text-sm text-green-600 font-semibold">₹{product.price}</p>
                              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                              {product.variants && product.variants.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Variants:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {product.variants.map((variant, index) => (<span key={index} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{variant.size}/{variant.color}: <strong>{variant.stock}</strong></span>))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t flex items-center justify-end gap-3">
                            <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                            <button onClick={() => toggleProduct(product._id, product.enabled)} className={`px-3 py-1 rounded-full text-xs font-semibold ${product.enabled !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{product.enabled !== false ? 'Enabled' : 'Disabled'}</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white border rounded-lg overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {products.map(product => (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">₹{product.price}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{product.stock}</td>
                              <td className="px-4 py-3 text-sm"><button onClick={() => toggleProduct(product._id, product.enabled)} className={`px-3 py-1 rounded text-xs ${product.enabled !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{product.enabled !== false ? 'Enabled' : 'Disabled'}</button></td>
                              <td className="px-4 py-3 text-sm"><button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="text-blue-600 hover:underline font-medium">Edit</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              } />

              <Route path="users" element={
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <span className="text-blue-800 font-medium">Total Users: {filteredUsers.length}</span>
                    </div>
                    <button
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," + 
                          "Name,Email,Phone,User Type,Join Date,Orders,Total Amount\n" +
                          filteredUsers.map(user => 
                            `"${user.name}","${user.email}","${user.phone || 'N/A'}","${user.email === 'admin@samriddhishop.com' ? 'Admin' : 'User'}","${new Date(user.createdAt).toLocaleDateString('en-IN')}","${user.orderCount || 0}","₹${user.totalAmount || 0}"`
                          ).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `users_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📊 Export Excel
                    </button>
                  </div>
                </div>
                
                {/* User Filters */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userFilters.search}
                        onChange={(e) => {
                          const newFilters = {...userFilters, search: e.target.value};
                          setUserFilters(newFilters);
                          applyUserFilters(newFilters);
                        }}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">User Type</label>
                      <select
                        value={userFilters.userType}
                        onChange={(e) => {
                          const newFilters = {...userFilters, userType: e.target.value};
                          setUserFilters(newFilters);
                          applyUserFilters(newFilters);
                        }}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="admin">Admin</option>
                        <option value="user">Regular Users</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sort By</label>
                      <select
                        value={userFilters.sortBy}
                        onChange={(e) => {
                          const newFilters = {...userFilters, sortBy: e.target.value};
                          setUserFilters(newFilters);
                          applyUserFilters(newFilters);
                        }}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="orders-high">Highest Orders</option>
                        <option value="amount-high">Highest Amount</option>
                        <option value="date-new">Newest First</option>
                        <option value="date-old">Oldest First</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setUserFilters({ search: '', userType: 'all', sortBy: 'name' });
                          setFilteredUsers(users);
                        }}
                        className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Responsive User List */}
                <div className="space-y-4 md:hidden">
                  {filteredUsers.map(user => (
                    <div key={user._id} className="bg-white p-4 rounded-lg shadow border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600 break-all">{user.email}</p>
                          <p className="text-sm text-gray-600">{user.phone || 'No phone'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.email === 'admin@samriddhishop.com' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.email === 'admin@samriddhishop.com' ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t grid grid-cols-5 text-center gap-2">
                        <div><p className="text-xs text-gray-500">Joined</p><p className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString('en-IN')}</p></div>
                        <div><p className="text-xs text-gray-500">Orders</p><p className="font-medium text-sm">{user.orderCount || 0}</p></div>
                        <div><p className="text-xs text-gray-500">Total Spent</p><p className="font-medium text-sm">₹{(user.totalAmount || 0).toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Cart</p><p className="font-medium text-sm">{user.cart?.length || 0}</p></div>
                        <div><p className="text-xs text-gray-500">Wishlist</p><p className="font-medium text-sm">{user.wishlist?.length || 0}</p></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stats</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cart</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Wishlist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${user.email === 'admin@samriddhishop.com' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{user.email === 'admin@samriddhishop.com' ? 'Admin' : 'User'}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600 break-words"><div>{user.email}</div><div>{user.phone || 'Not provided'}</div></td>
                          <td className="px-4 py-3 text-sm text-gray-600"><div>Orders: <strong>{user.orderCount || 0}</strong></div><div>Spent: <strong>₹{(user.totalAmount || 0).toLocaleString()}</strong></div></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>                          
                          <td className="px-4 py-3 text-sm text-gray-600">{user.cart?.length || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.wishlist?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No users found</p>
                  </div>
                )}
              </div>} />

              <Route path="orders" element={
                <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <h3 className="text-lg font-semibold">Order Management</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={fetchOrdersByDate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={handlePrintFilteredOrders}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full sm:w-auto"
                    >
                      🖨️ Print Filtered Orders
                    </button>
                  </div>
                </div>
                
                {/* Date Filters */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Search by Order ID</label>
                      <input type="text" placeholder="Order ID..." value={orderFilters.searchTerm}
                        onChange={(e) => setOrderFilters({ ...orderFilters, searchTerm: e.target.value })}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={orderFilters.startDate}
                        onChange={(e) => setOrderFilters({...orderFilters, startDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={orderFilters.endDate}
                        onChange={(e) => setOrderFilters({...orderFilters, endDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={orderFilters.status}
                        onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Orders List */}
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order._id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0 mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">Order #{order.orderNumber || order._id.slice(-8)}</h4>
                          <p className="text-gray-600">₹{order.total} | {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500 break-words">Customer: {order.userId?.name} ({order.userId?.email})</p>
                          {order.courierDetails?.trackingNumber && (
                            <p className="text-sm text-blue-600 break-words">Tracking: {order.courierDetails.trackingNumber} | {order.courierDetails.courierName}</p>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="w-full md:w-auto px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                            disabled={
                              order.status === 'cancelled' || 
                              order.status === 'refunded' ||
                              (() => {
                                if (order.status === 'delivered') {
                                  const deliveryEntry = order.statusHistory?.find(h => h.status === 'delivered');
                                  const deliveryDate = deliveryEntry ? new Date(deliveryEntry.updatedAt) : new Date(order.createdAt);
                                  return (new Date() - deliveryDate) > 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
                                }
                                return false;
                              })()
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'cancelled' ? 'CANCELLED' : 
                             order.status === 'refunded' ? 'REFUNDED' : 
                             order.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ml-2 ${
                            order.paymentMethod === 'cod' && order.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                            order.paymentMethod === 'cod' && order.paymentStatus === 'received' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.paymentMethod === 'cod' ? `COD: ${order.paymentStatus}` : 'Prepaid'}
                          </span>
                          <button
                            onClick={() => handlePrintKOT(order)}
                            className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
                            title="Print Receipt">
                            🖨️ Print
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 break-words">
                      Items:{' '}
                      {order.items
                        .map(
                          (item) =>
                          `${item.name}${item.selectedVariant ? ` (${item.selectedVariant.size}-${item.selectedVariant.color})` : ''} (${item.quantity})`
                        ).join(', ')}
                      </div>
                      {order.shippingAddress && (
                        <div className="text-sm text-gray-600 mt-2 break-words bg-gray-50 p-2 rounded">
                          <p><strong>Address:</strong> {order.shippingAddress.name} ({order.shippingAddress.addressType})</p>
                          <p>
                            {order.shippingAddress.mobileNumber}
                            {order.shippingAddress.alternateMobileNumber && `, ${order.shippingAddress.alternateMobileNumber}`}
                          </p>
                          <p>
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Courier Details Modal */}
                {selectedOrder && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4">Add Courier Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Courier Name</label>
                          <select
                            value={courierForm.courierName}
                            onChange={(e) => setCourierForm({...courierForm, courierName: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Courier</option>
                            <option value="Blue Dart">Blue Dart</option>
                            <option value="DTDC">DTDC</option>
                            <option value="FedEx">FedEx</option>
                            <option value="Delhivery">Delhivery</option>
                            <option value="Ekart">Ekart</option>
                            <option value="India Post">India Post</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tracking Number</label>
                          <input
                            type="text"
                            value={courierForm.trackingNumber}
                            onChange={(e) => setCourierForm({...courierForm, trackingNumber: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Estimated Delivery</label>
                          <input
                            type="date"
                            value={courierForm.estimatedDelivery}
                            onChange={(e) => setCourierForm({...courierForm, estimatedDelivery: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Notes</label>
                          <textarea
                            value={courierForm.notes}
                            onChange={(e) => setCourierForm({...courierForm, notes: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateOrderStatus(selectedOrder, 'shipped', true)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          Ship Order
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>} />

              <Route path="coupons" element={
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Create New Coupon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Discount Value"
                      value={couponForm.discount}
                      onChange={(e) => setCouponForm({...couponForm, discount: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({...couponForm, type: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Minimum Amount"
                      value={couponForm.minAmount}
                      onChange={(e) => setCouponForm({...couponForm, minAmount: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={couponForm.oneTimeUse}
                        onChange={(e) => setCouponForm({...couponForm, oneTimeUse: e.target.checked})}
                        className="rounded"
                      />
                      <span>One-time use per user</span>
                    </label>
                  </div>
                  <button
                    onClick={saveCoupon}
                    disabled={loading}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Coupon'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Coupon Management</h3>
                    <button
                      onClick={fetchCouponReport}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Usage Report
                    </button>
                  </div>
                  {coupons.map(coupon => (
                    <div key={coupon._id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{coupon.code}</h4>
                        <p className="text-gray-600">
                          {coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`}
                          {coupon.minAmount && ` | Min: ₹${coupon.minAmount}`}
                          {coupon.oneTimeUse && ' | One-time use'}
                        </p>
                        <p className="text-sm text-gray-500">Used: {coupon.usageCount || 0} times</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCoupon(coupon._id, coupon.isActive)}
                          className={`px-3 py-1 rounded text-sm ${
                            coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {coupon.isActive ? 'Enabled' : 'Disabled'}
                        </button>
                        <span className={`px-3 py-1 rounded text-sm ${
                          new Date(coupon.expiryDate) > new Date() ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {new Date(coupon.expiryDate) > new Date() ? 'Valid' : 'Expired'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon Usage Report Modal */}
                {showReport && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Coupon Usage Report</h3>
                        <button
                          onClick={() => setShowReport(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-4">
                        {couponReport.map(coupon => (
                          <div key={coupon._id} className="border p-4 rounded">
                            <h4 className="font-medium mb-2">{coupon.code} - Used {coupon.usageCount} times</h4>
                            {coupon.usedBy.length > 0 ? (
                              <div className="space-y-2">
                                {coupon.usedBy.map((usage, index) => (
                                  <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{usage.userId?.name}</span> ({usage.userId?.email})
                                    <span className="text-gray-500 ml-2">
                                      Order: {usage.orderId?.orderNumber} | 
                                      {new Date(usage.usedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No usage yet</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              } />

              <Route path="banner" element={
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Home Page Banner Settings</h2>
                {/* Desktop Banner Form */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">🖥️ Desktop Banner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><input type="text" placeholder="Title" value={bannerForm.desktop.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, desktop: { ...bannerForm.desktop, title: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Subtitle" value={bannerForm.desktop.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, desktop: { ...bannerForm.desktop, subtitle: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="url" placeholder="Background Image URL" value={bannerForm.desktop.backgroundImage}
                        onChange={(e) => setBannerForm({ ...bannerForm, desktop: { ...bannerForm.desktop, backgroundImage: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="url" placeholder="Desktop Background Video URL" value={bannerForm.desktop.backgroundVideo}
                        onChange={(e) => setBannerForm({ ...bannerForm, desktop: { ...bannerForm.desktop, backgroundVideo: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Mobile Banner Form */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">📱 Mobile Banner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><input type="text" placeholder="Title" value={bannerForm.mobile.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, mobile: { ...bannerForm.mobile, title: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Subtitle" value={bannerForm.mobile.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, mobile: { ...bannerForm.mobile, subtitle: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="url" placeholder="Background Image URL" value={bannerForm.mobile.backgroundImage}
                        onChange={(e) => setBannerForm({ ...bannerForm, mobile: { ...bannerForm.mobile, backgroundImage: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="url" placeholder="Mobile Background Video URL" value={bannerForm.mobile.backgroundVideo}
                        onChange={(e) => setBannerForm({ ...bannerForm, mobile: { ...bannerForm.mobile, backgroundVideo: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={updateBanner}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Banners
                  </button>
                </div>
              </div>
              } />

              <Route path="messages" element={
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contact Messages</h3>
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-blue-800 font-medium">Total Messages: {contacts.length}</span>
                  </div>
                </div>
                
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl text-gray-600 mb-2">No Messages Yet</h3>
                    <p className="text-gray-500">Contact form messages will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contacts.map(contact => (
                      <div key={contact._id} className="bg-white border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-base md:text-lg text-gray-800">{contact.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  contact.status === 'new' ? 'bg-green-100 text-green-800' :
                                  contact.status === 'read' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {contact.status}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm break-all">📧 {contact.email}</p>
                            </div>
                            <p className="text-gray-500 text-xs text-right whitespace-nowrap">{new Date(contact.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 text-sm mb-1">📝 Subject: {contact.subject}</h5>
                            <div className="bg-gray-50 p-3 rounded-lg max-h-28 overflow-y-auto">
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">{contact.message}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 md:space-x-3 mt-auto">
                          <button 
                            onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${contact.subject}`)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-xs md:text-sm text-center"
                          >
                            📧 Reply
                          </button>
                          <button 
                            onClick={async () => {
                              try {                                
                                await makeSecureRequest(`${API_BASE}/api/admin/contacts/${contact._id}/status`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'read' }),
                                });
                                fetchData();
                              } catch (error) {
                                console.error('Error updating status:', error);
                              }
                            }}
                            className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 text-xs md:text-sm text-center"
                          >
                            ✓ Mark as Read
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              } />

              <Route path="delivery-area" element={<DeliveryAreaManagement deliveryAreas={deliveryAreas} fetchData={fetchData} />} />

              <Route path="settings" element={
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Shipping Settings</h3>
                  <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                    <label className="font-medium">Shipping Cost (₹):</label>
                    <input
                      type="number"
                      value={settingsForm.shippingCost}
                      onChange={(e) => setSettingsForm({ ...settingsForm, shippingCost: Number(e.target.value) })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-32"
                    />
                    <button
                      onClick={updateSettings}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto"
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Set to 0 for free shipping</p>
                </div>                

                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Contact & Social Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Email</label>
                      <input type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Phone</label>
                      <input type="tel" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instagram URL</label>
                      <input type="url" value={settingsForm.instagram} onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Facebook URL</label>
                      <input type="url" value={settingsForm.facebook} onChange={(e) => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <button
                    onClick={updateSettings}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Contact Info
                  </button>
                </div>

              </div>
              } />

              <Route index element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;