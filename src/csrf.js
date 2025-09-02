// CSRF Token Management
let csrfToken = null;

export const getCSRFToken = async () => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch('http://localhost:3001/api/csrf-token', {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : 'anonymous'
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
  
  const token = await getCSRFToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
    }
  });
};