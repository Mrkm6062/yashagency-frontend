// Cached localStorage utility
let tokenCache = null;
let userCache = null;

export const getToken = () => {
  if (tokenCache === null) {
    tokenCache = localStorage.getItem('token');
  }
  return tokenCache;
};

export const setToken = (token) => {
  tokenCache = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getUser = () => {
  if (userCache === null) {
    const userData = localStorage.getItem('user');
    userCache = userData ? JSON.parse(userData) : null;
  }
  return userCache;
};

export const setUser = (user) => {
  userCache = user;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const clearAuth = () => {
  tokenCache = null;
  userCache = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};