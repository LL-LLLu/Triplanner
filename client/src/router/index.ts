import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Lazy load views
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Planner = () => import('../views/Planner.vue');
const MyTrips = () => import('../views/MyTrips.vue');
const TripDetails = () => import('../views/TripDetails.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    { 
      path: '/planner', 
      name: 'Planner', 
      component: Planner, 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/trips', 
      name: 'MyTrips', 
      component: MyTrips, 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/trips/:id', 
      name: 'TripDetails', 
      component: TripDetails, 
      meta: { requiresAuth: true } 
    },
  ]
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    next('/');
  } else {
    next();
  }
});

export default router;
