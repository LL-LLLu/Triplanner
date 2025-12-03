<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black p-4">
    <div class="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-neutral-800">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-display font-bold mb-2">Join TripGenius</h1>
        <p class="text-sm text-gray-500">Create an account to start planning</p>
      </div>

      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm text-center mb-4">
        Registration successful! Waiting for admin approval.
        <router-link to="/" class="block mt-2 font-bold underline">Back to Login</router-link>
      </div>

      <form v-else @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
          <input v-model="email" type="email" required class="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-black dark:focus:border-white transition text-sm" placeholder="you@example.com">
        </div>
        
        <div>
          <label class="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
          <input v-model="password" type="password" required class="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-black dark:focus:border-white transition text-sm" placeholder="••••••••">
        </div>

        <div v-if="authStore.error" class="text-red-500 text-xs text-center">{{ authStore.error }}</div>

        <button :disabled="authStore.loading" type="submit" class="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50">
          {{ authStore.loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <div class="mt-6 text-center" v-if="!success">
        <router-link to="/" class="text-xs text-gray-500 hover:text-black dark:hover:text-white transition">Already have an account? Sign in</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const success = ref(false);
const authStore = useAuthStore();

const handleRegister = async () => {
  const res = await authStore.register(email.value, password.value);
  if (res) success.value = true;
};
</script>
