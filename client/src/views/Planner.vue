<template>
  <div class="flex h-screen overflow-hidden relative">
    <Sidebar class="z-20" />
    <main class="flex-1 relative z-0">
      <div class="absolute top-4 right-4 z-[500] flex gap-2">
        <button @click="authStore.logout" class="bg-white/90 text-black px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-100">Logout</button>
        <router-link to="/trips" class="bg-black/90 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-900">My Trips</router-link>
      </div>
      <Map />
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
import Map from '../components/Map.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>
