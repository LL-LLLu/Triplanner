import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios';
import App from './App.vue'
import router from './router'
import './style.css'
import 'mapbox-gl/dist/mapbox-gl.css' // Mapbox CSS

// FontAwesome
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Restore Auth Header
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Global Error Handler (Session Expired)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (router.currentRoute.value.path !== '/') {
        router.push('/');
      }
    }
    return Promise.reject(error);
  }
);

app.mount('#app')