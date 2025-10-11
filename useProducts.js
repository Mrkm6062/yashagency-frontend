import { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const cached = localStorage.getItem('products_cache');
      const cacheTime = localStorage.getItem('products_cache_time');

      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 300000) { // 5-minute cache
        setProducts(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data || []);
        localStorage.setItem('products_cache', JSON.stringify(data || []));
        localStorage.setItem('products_cache_time', Date.now().toString());
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}