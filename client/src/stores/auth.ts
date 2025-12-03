import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

// Axios defaults
axios.defaults.baseURL = 'http://localhost:3000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post('/auth/login', { email, password });
        this.token = res.data.token;
        this.user = res.data.user;
        localStorage.setItem('token', this.token as string);
        localStorage.setItem('user', JSON.stringify(this.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        router.push('/planner');
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Login failed';
      } finally {
        this.loading = false;
      }
    },
    async register(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/auth/register', { email, password });
        // Don't auto login, wait for approval (or tell them)
        return true;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Registration failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      router.push('/');
    }
  }
});
