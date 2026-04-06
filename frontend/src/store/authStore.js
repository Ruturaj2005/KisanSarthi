import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  farmer: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  isLoading: true,
  isAuthenticated: false,

  setFarmer: (farmer, accessToken) => {
    if (typeof window !== 'undefined' && accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    set({ farmer, accessToken, isAuthenticated: !!farmer, isLoading: false });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    set({ farmer: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await api.get('/farmer/profile');
      set({ farmer: data.data.farmer, accessToken: token, isAuthenticated: true, isLoading: false });
    } catch {
      set({ farmer: null, accessToken: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
  },

  login: async ({ email, password, otp }) => {
    const { data } = await api.post('/auth/login', { email, password, otp });
    const { accessToken, farmer } = data.data;
    get().setFarmer(farmer, accessToken);
    return data;
  },

  register: async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  verifyOtp: async ({ email, otp }) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    const { accessToken, farmer } = data.data;
    get().setFarmer(farmer, accessToken);
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    get().clearAuth();
  },
}));

export default useAuthStore;
