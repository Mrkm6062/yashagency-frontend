// CSRF Token Management
let csrfToken = null;

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const getCSRFToken = async () => {
  if (csrfToken) return csrfToken;
  
  try {
    const authToken = localStorage.getItem('token');
    if (!authToken) return null; // Can't get CSRF if not logged in

    const response = await fetch(`${API_BASE}/api/csrf-token`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

export const makeSecureRequest = async (url, options = {}) => {
  // Skip CSRF for GET requests
  if (options.method === 'GET' || !options.method) {
    return fetch(url, options);
  }
  
  // Fetch the CSRF token if it's not already cached
  const token = csrfToken || await getCSRFToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
    }
  });
};