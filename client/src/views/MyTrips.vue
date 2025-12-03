<template>
  <div class="min-h-screen bg-gray-50 dark:bg-darkBg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold font-display text-black dark:text-white">My Trips</h1>
        <router-link to="/planner" class="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800">Create New</router-link>
      </div>

      <div v-if="loading" class="text-center py-10 text-gray-400">Loading...</div>
      
      <div v-else-if="trips.length === 0" class="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800">
        <p class="text-gray-500 mb-4">No trips saved yet.</p>
        <router-link to="/planner" class="text-black dark:text-white underline font-bold">Start Planning</router-link>
      </div>

      <div v-else class="grid gap-4">
        <div v-for="trip in trips" :key="trip.id" class="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition relative">
          <button @click="deleteTrip(trip.id)" class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
          <div class="flex justify-between items-start pr-8">
             <div>
                <h3 class="font-bold text-lg mb-1 text-black dark:text-white">{{ trip.destinations }}</h3>
                <p class="text-xs text-gray-500 uppercase tracking-wide">{{ trip.duration }} Days • {{ trip.budget }}</p>
             </div>
             <div class="text-right">
                 <p class="text-sm font-bold text-black dark:text-white">{{ new Date(trip.createdAt).toLocaleDateString() }}</p>
             </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
             <router-link :to="'/trips/' + trip.id" class="text-xs font-bold bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition inline-block text-black dark:text-white">View Details</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const trips = ref<any[]>([]);
const loading = ref(true);

const loadTrips = async () => {
  try {
    const res = await axios.get('/api/trips');
    trips.value = res.data;
  } catch (error) {
    console.error('Failed to load trips');
  } finally {
    loading.value = false;
  }
};

const deleteTrip = async (id: number) => {
  if(!confirm("Delete this trip?")) return;
  try {
    await axios.delete(`/api/trips/${id}`);
    trips.value = trips.value.filter(t => t.id !== id);
  } catch (e) {
    alert("Failed to delete trip");
  }
};

onMounted(loadTrips);
</script>
