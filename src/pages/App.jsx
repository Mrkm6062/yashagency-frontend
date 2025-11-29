import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProductListPage from './pages/ProductListPage';
// Assuming you have these other components
// import HomePage from './pages/HomePage'; 
// import CartPage from './pages/CartPage';
// import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  // Dummy fetch products
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    // For now, I'll assume products are passed to ProductListPage
    setLoading(false);
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => [...prevCart, product]);
  };

  const cartItemCount = cart.length;

  return (
    <Router>
      <Header cartItemCount={cartItemCount} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          {/* Add other routes here */}
          <Route path="/products" element={<ProductListPage products={products} loading={loading} addToCart={addToCart} />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;