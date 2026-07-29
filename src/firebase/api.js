import { auth } from './config';

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();

export const callApi = async (name, data = {}) => {
  const user = auth.currentUser;
  let token = null;
  if (user) {
    token = await user.getIdToken();
  }
  
  const response = await fetch(`${BACKEND_URL}/api/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ data })
  });
  
  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error?.message || resData.error || 'API call failed');
  }
  
  return { data: resData.result };
};
