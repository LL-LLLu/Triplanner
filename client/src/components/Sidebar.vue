<template>
  <aside class="w-full lg:w-[400px] bg-white/90 dark:bg-black/90 backdrop-blur flex flex-col border-r border-gray-200 dark:border-gray-800 z-20 shadow-xl h-full relative transition-all duration-300">
    
    <!-- Inputs -->
    <div class="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0 overflow-y-auto custom-scrollbar max-h-[50vh]">
      
      <!-- Destinations -->
      <div class="mb-4">
        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Origin City (Optional)</label>
        <input v-model="tripStore.originCity" type="text" placeholder="e.g. New York, London" class="w-full p-2.5 bg-gray-50 dark:bg-neutral-900 border-transparent rounded-lg text-sm focus:ring-1 ring-black dark:ring-white outline-none mb-4">

        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Destinations</label>
        <div class="flex flex-wrap gap-2 mb-2">
           <div v-for="(dest, i) in tripStore.destinations" :key="i" class="bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-bold">
              {{ dest }}
              <button @click="tripStore.removeDestination(i)" class="hover:text-red-500">×</button>
           </div>
        </div>
        <div class="flex gap-2">
           <input v-model="newDest" @keyup.enter="addDest" type="text" placeholder="Enter city..." class="w-full p-2.5 bg-gray-50 dark:bg-neutral-900 border-transparent rounded-lg text-sm focus:ring-1 ring-black dark:ring-white outline-none">
           <button @click="addDest" class="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-lg"><i class="fas fa-plus"></i></button>
        </div>
      </div>

      <!-- Must Visit -->
      <div class="mb-4">
        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Must Visit (Optional)</label>
        <div class="flex flex-wrap gap-2 mb-2">
           <div v-for="(item, i) in tripStore.mustVisit" :key="i" class="bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-bold">
              {{ item }}
              <button @click="tripStore.removeMustVisit(i)" class="hover:text-red-500">×</button>
           </div>
        </div>
        <div class="flex gap-2">
           <input v-model="newMust" @keyup.enter="addMust" type="text" placeholder="E.g. Eiffel Tower..." class="w-full p-2.5 bg-gray-50 dark:bg-neutral-900 border-transparent rounded-lg text-sm focus:ring-1 ring-black dark:ring-white outline-none">
           <button @click="addMust" class="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-lg"><i class="fas fa-plus"></i></button>
        </div>
      </div>

      <!-- Controls -->
      <div class="grid grid-cols-2 gap-3 mb-5">
         <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Days</label>
            <input v-model.number="tripStore.days" type="number" min="1" max="14" class="w-full p-2 bg-gray-50 dark:bg-neutral-900 rounded-lg font-bold text-sm">
         </div>
         <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Budget</label>
            <select v-model="tripStore.budget" class="w-full p-2 bg-gray-50 dark:bg-neutral-900 rounded-lg font-bold text-xs">
                <option>Budget</option>
                <option>Moderate</option>
                <option>Luxury</option>
            </select>
         </div>
      </div>

      <button @click="tripStore.generateTrip" :disabled="tripStore.loading" class="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
        {{ tripStore.loading ? 'Generating Plan...' : 'Create Itinerary' }}
      </button>
      
      <div v-if="tripStore.error" class="mt-2 text-red-500 text-xs text-center">{{ tripStore.error }}</div>
    </div>

    <!-- Results List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-black">
        <div v-if="!tripStore.tripData" class="h-full flex flex-col items-center justify-center text-gray-400 text-center">
            <i class="fas fa-globe text-4xl mb-4 opacity-20"></i>
            <p class="text-sm">Add destinations to start.</p>
        </div>

        <div v-else class="space-y-8 pb-20">
            <!-- Cost Header -->
            <div v-if="tripStore.tripData.costs" class="bg-black dark:bg-neutral-900 rounded-2xl p-5 text-white flex justify-between items-end">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Est.</p>
                    <h2 class="text-2xl font-display font-bold">{{ tripStore.tripData.costs.total }}</h2>
                </div>
                <button @click="tripStore.saveTrip" class="bg-white/10 hover:bg-white/20 p-2 rounded text-xs font-bold">Save Trip</button>
            </div>

            <!-- Itinerary -->
            <div v-for="(item, i) in tripStore.tripData.itinerary" :key="i" class="relative pl-8 border-l border-gray-200 dark:border-neutral-800 ml-2">
                <div class="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-black dark:bg-white"></div>
                <span class="text-[10px] font-bold text-gray-400 uppercase">{{ item.day }} - {{ item.time }}</span>
                <h3 class="font-bold text-sm mt-1">{{ item.name }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ item.description }}</p>
            </div>
        </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTripStore } from '../stores/trip';

const tripStore = useTripStore();
const newDest = ref('');
const newMust = ref('');

const addDest = () => {
    if(newDest.value) {
        tripStore.addDestination(newDest.value);
        newDest.value = '';
    }
};

const addMust = () => {
    if(newMust.value) {
        tripStore.addMustVisit(newMust.value);
        newMust.value = '';
    }
};
</script>
