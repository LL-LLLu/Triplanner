<template>
  <div class="min-h-screen flex bg-black overflow-hidden relative select-none">
    
    <!-- Full-screen 3D Earth Background -->
    <div class="absolute inset-0 z-0">
        <Map />
    </div>

    <!-- Left Side: Login Form (Floating over the map) -->
    <div class="relative w-full lg:w-2/5 flex items-center justify-center p-8 z-10">
      <div class="w-full max-w-md space-y-8">
        
        <div class="text-center lg:text-left">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-white mb-6 shadow-lg">
              <i class="fa-solid fa-plane-departure text-xl"></i>
          </div>
          <h1 class="text-4xl font-display font-bold text-white tracking-tight mb-2">TripGenius</h1>
          <p class="text-gray-300 text-lg">AI-Powered Travel Planning</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Email Address</label>
            <input v-model="email" type="email" required class="w-full p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 ring-white/50 outline-none transition text-white text-sm font-medium placeholder-gray-600" placeholder="name@example.com">
          </div>
          
          <div>
            <label class="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Password</label>
            <input v-model="password" type="password" required class="w-full p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 ring-white/50 outline-none transition text-white text-sm font-medium placeholder-gray-600" placeholder="••••••••">
          </div>

          <div v-if="authStore.error" class="text-red-400 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center gap-2">
             <i class="fa-solid fa-circle-exclamation"></i> {{ authStore.error }}
          </div>

          <button :disabled="authStore.loading" type="submit" class="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm uppercase tracking-wide">
            {{ authStore.loading ? 'Authenticating...' : 'Sign In' }}
          </button>
        </form>

        <div class="text-center lg:text-left pt-4">
          <span class="text-sm text-gray-400">New here? </span>
          <router-link to="/register" class="text-sm font-bold text-white hover:underline">Create an account</router-link>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import Map from '../components/Map.vue';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();

const handleLogin = async () => {
  await authStore.login(email.value, password.value);
};
</script>
