<template>
  <div class="h-screen bg-gray-50 dark:bg-darkBg flex flex-col overflow-hidden">
    <!-- Loading / Error States -->
    <div v-if="loading" class="flex items-center justify-center h-full text-gray-400">Loading...</div>
    <div v-else-if="!trip" class="flex items-center justify-center h-full text-gray-400">Trip not found</div>
    
    <div v-else class="flex flex-col h-full max-w-[1920px] mx-auto w-full">
      
      <!-- Header (Fixed) -->
      <div class="px-6 py-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shrink-0 flex justify-between items-center z-20">
        <div class="flex items-center gap-4">
            <router-link to="/trips" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition">
                <i class="fa-solid fa-arrow-left text-sm"></i>
            </router-link>
            <div>
                <h1 class="text-xl font-display font-bold text-black dark:text-white leading-tight">{{ trip.destinations }}</h1>
                <p class="text-xs text-gray-500">{{ trip.duration }} Days • {{ trip.budget }} • {{ new Date(trip.createdAt).toLocaleDateString() }}</p>
            </div>
        </div>
        
        <div class="flex items-center gap-3">
             <!-- Tabs as Pill Selector -->
             <div class="bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg flex gap-1 mr-4">
                <button v-for="tab in ['Overview', 'Flights', 'Hotels', 'Dining', 'Budget']" :key="tab" 
                    @click="activeTab = tab"
                    :class="['px-3 py-1.5 text-xs font-bold rounded-md transition', activeTab === tab ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300']">
                    {{ tab }}
                </button>
             </div>

             <button @click="showAddModal = true" class="bg-black dark:bg-white text-white dark:text-black px-3 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Add Item
            </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex overflow-hidden relative">
        
        <!-- Overview (Split View: Map + List) -->
        <div v-if="activeTab === 'Overview'" class="flex w-full h-full">
            <!-- List Column -->
            <div class="w-full md:w-[400px] lg:w-[450px] bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col z-10 shadow-xl">
                <div class="p-4 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-black/20 backdrop-blur">
                    <h2 class="font-bold text-sm uppercase tracking-wider text-gray-500">Itinerary Timeline</h2>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    <div v-if="sortedOverviewItems.length === 0" class="text-center py-10 text-gray-400 text-sm">
                        No items yet. Start planning!
                    </div>

                    <div v-for="(item, i) in sortedOverviewItems" :key="i" class="relative pl-6 group">
                        <!-- Timeline Line -->
                        <div class="absolute left-2 top-2 bottom-[-24px] w-px bg-gray-200 dark:bg-neutral-700 group-last:bottom-0"></div>
                        <!-- Timeline Dot -->
                        <div :class="['absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center z-10', item.type === 'Flight' ? 'bg-blue-500' : item.type === 'Restaurant' ? 'bg-yellow-500' : item.type === 'Hotel' ? 'bg-purple-500' : 'bg-black dark:bg-white']">
                        </div>

                        <div class="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 transition border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 relative group/card">
                             <div class="flex justify-between items-start mb-1">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">{{ item.day ? `Day ${item.day}` : 'Trip Info' }}</span>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-black border border-gray-200 dark:border-neutral-700">{{ item.type || 'Activity' }}</span>
                             </div>
                             
                             <h3 class="font-bold text-sm text-black dark:text-white leading-snug mb-1">{{ item.name || item.from + ' to ' + item.to }}</h3>
                             <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{{ item.description }}</p>
                             
                             <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                    <span v-if="item.time"><i class="fa-regular fa-clock mr-1"></i>{{ item.time }}</span>
                                    <span v-if="item.city"><i class="fa-solid fa-location-dot mr-1"></i>{{ item.city }}</span>
                                </div>
                                <div class="text-xs font-bold text-green-600" v-if="item.estimatedCost > 0">${{ item.estimatedCost }}</div>
                             </div>

                             <button @click.stop="deleteItem(item._cat, item._idx)" class="absolute top-2 right-2 p-1.5 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition">
                                <i class="fa-solid fa-trash text-xs"></i>
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Map Column -->
            <div class="hidden md:block flex-1 relative h-full bg-gray-100 dark:bg-black">
                <Map />
            </div>
        </div>

        <!-- Other Tabs (Full Width List) -->
        <div v-else class="w-full h-full overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-darkBg p-8">
            
            <!-- Budget Tab -->
            <div v-if="activeTab === 'Budget'">
                <div class="max-w-4xl mx-auto">
                    <div class="flex justify-between items-end mb-6">
                        <h2 class="font-bold text-2xl text-black dark:text-white">Cost Breakdown</h2>
                        <div class="text-right">
                            <p class="text-xs text-gray-500 uppercase tracking-wider">Total Estimated</p>
                            <h3 class="text-3xl font-display font-bold text-green-600 transition-all duration-300">${{ totalCost }}</h3>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50 dark:bg-neutral-800 text-gray-500 uppercase text-xs border-b border-gray-200 dark:border-neutral-800">
                                <tr>
                                    <th class="p-4">Item</th>
                                    <th class="p-4">Type</th>
                                    <th class="p-4 text-right">Cost (USD)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-neutral-800">
                                <tr v-for="(item, i) in sortedOverviewItems" :key="i" class="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition">
                                    <td class="p-4 font-medium text-black dark:text-white">{{ item.name || item.from + ' -> ' + item.to }}</td>
                                    <td class="p-4">
                                        <span :class="['text-[10px] font-bold px-2 py-1 rounded', item.type === 'Flight' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600']">
                                            {{ item.type || 'Activity' }}
                                        </span>
                                    </td>
                                    <td class="p-4 text-right">
                                        <input type="number" v-model.number="item.estimatedCost" @change="saveTripUpdate" class="w-24 p-1.5 text-right bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-700 rounded text-sm font-bold focus:ring-1 ring-green-500 outline-none transition focus:scale-105">
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Flights -->
            <div v-if="activeTab === 'Flights'">
                <h2 class="font-bold mb-6 text-xl">Flight Details</h2>
                <div v-if="!trip.itinerary?.flights || trip.itinerary.flights.length === 0" class="text-gray-400 italic">No flight information added.</div>
                <div v-else class="grid gap-4">
                    <div v-for="(f, i) in trip.itinerary.flights" :key="i" class="p-4 border border-gray-100 dark:border-neutral-800 rounded-xl flex justify-between items-center bg-white dark:bg-neutral-900">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <span class="font-bold text-lg">{{ f.from }}</span>
                                <i class="fa-solid fa-arrow-right text-gray-300 text-sm"></i>
                                <span class="font-bold text-lg">{{ f.to }}</span>
                            </div>
                            <p class="text-sm text-gray-500">{{ f.description }}</p>
                        </div>
                        <a v-if="f.searchQuery" :href="'https://www.google.com/search?q=' + f.searchQuery" target="_blank" class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80">Book</a>
                    </div>
                </div>
            </div>

            <!-- Hotels -->
            <div v-if="activeTab === 'Hotels'">
               <h2 class="font-bold mb-6 text-xl">Hotel Recommendations</h2>
               <div v-if="hotelItems.length === 0" class="text-gray-400 italic">No hotels found in the itinerary.</div>
               <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div v-for="(item, i) in hotelItems" :key="i" class="p-5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition relative group">
                     <div class="flex justify-between items-start mb-3">
                        <h3 class="font-bold text-lg text-black dark:text-white">{{ item.name }}</h3>
                        <span class="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded uppercase tracking-wide">Stay</span>
                     </div>
                     <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{{ item.description }}</p>
                     <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                         <i class="fa-solid fa-location-dot"></i>
                         <span>{{ item.city }}</span>
                     </div>
                     <a v-if="item.searchQuery" :href="'https://www.google.com/search?q=' + item.searchQuery" target="_blank" class="block w-full text-center bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-xs font-bold hover:opacity-90 transition">
                        View / Book
                     </a>
                     <button @click="deleteItem('hotels', trip.itinerary.hotels.indexOf(item))" class="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                        <i class="fa-solid fa-trash"></i>
                     </button>
                  </div>
               </div>
            </div>

            <!-- Dining -->
            <div v-if="activeTab === 'Dining'">
               <h2 class="font-bold mb-6 text-xl">Dining & Food</h2>
               <div v-if="diningItems.length === 0" class="text-gray-400 italic">No dining spots found in the itinerary.</div>
               <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div v-for="(item, i) in diningItems" :key="i" class="p-5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition relative group">
                     <div class="flex justify-between items-start mb-3">
                        <h3 class="font-bold text-lg text-black dark:text-white">{{ item.name }}</h3>
                        <span class="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded uppercase tracking-wide">Eat</span>
                     </div>
                     <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{{ item.description }}</p>
                     <div class="flex items-center gap-4 text-xs text-gray-400">
                         <div class="flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> {{ item.city }}</div>
                         <div class="flex items-center gap-1"><i class="fa-regular fa-clock"></i> {{ item.time }}</div>
                     </div>
                     <button @click="deleteItem('restaurants', trip.itinerary.restaurants.indexOf(item))" class="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                        <i class="fa-solid fa-trash"></i>
                     </button>
                  </div>
               </div>
            </div>
        </div>

      </div>
    </div>
    
    <!-- Modal code remains same... -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 class="font-bold text-lg mb-4 text-black dark:text-white">Add to Trip</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                    <select v-model="newItem.category" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                        <option value="flights">Flight</option>
                        <option value="itinerary">Activity / Restaurant / Hotel</option>
                    </select>
                </div>

                <div v-if="newItem.category === 'flights'">
                    <input v-model="newItem.from" placeholder="From (e.g. NYC)" class="w-full p-2 mb-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                    <input v-model="newItem.to" placeholder="To (e.g. London)" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                </div>

                <div v-else>
                     <input v-model="newItem.name" placeholder="Name (e.g. The Ritz)" class="w-full p-2 mb-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                     <div class="grid grid-cols-2 gap-2 mb-2">
                        <select v-model="newItem.type" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                            <option value="Attraction">Attraction</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Hotel">Hotel</option>
                        </select>
                        <input v-model="newItem.day" placeholder="Day (e.g. 1)" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                     </div>
                     <div class="grid grid-cols-2 gap-2 mb-2">
                        <input v-model="newItem.city" placeholder="City" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                        <input v-model="newItem.time" placeholder="Time (e.g. Morning)" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 ring-black dark:ring-white outline-none">
                     </div>
                </div>

                <textarea v-model="newItem.description" placeholder="Notes / Description" class="w-full p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg text-sm h-20 focus:ring-2 ring-black dark:ring-white outline-none"></textarea>
            </div>

            <div class="flex gap-3 mt-6">
                <button @click="showAddModal = false" class="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition bg-gray-100 dark:bg-neutral-800 rounded-lg">Cancel</button>
                <button @click="addItem" class="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition shadow-lg">Save Item</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import Map from '../components/Map.vue';
import { useTripStore } from '../stores/trip';

const route = useRoute();
const tripStore = useTripStore();
const trip = ref<any>(null);
const loading = ref(true);
const activeTab = ref('Overview');
const showAddModal = ref(false);

const newItem = ref({
    category: 'itinerary', // 'flights' or 'itinerary'
    name: '',
    type: 'Attraction',
    description: '',
    from: '',
    to: '',
    day: '1',
    city: '',
    time: 'Anytime'
});

const diningItems = computed(() => {
    if (!trip.value?.itinerary?.restaurants) {
        // Fallback to itinerary if restaurants array empty (legacy)
        return trip.value?.itinerary?.itinerary?.filter((i: any) => i.type === 'Restaurant') || [];
    }
    return trip.value.itinerary.restaurants;
});

const hotelItems = computed(() => {
    if (!trip.value?.itinerary?.hotels) {
        // Fallback
        return trip.value?.itinerary?.itinerary?.filter((i: any) => i.type === 'Hotel') || [];
    }
    return trip.value.itinerary.hotels;
});

const fetchTrip = async () => {
    try {
        const res = await axios.get('/api/trips');
        trip.value = res.data.find((t: any) => t.id === Number(route.params.id));
        
        if (trip.value) {
            const raw = trip.value.itinerary;
            // Normalization
            if (Array.isArray(raw)) {
                trip.value.itinerary = { itinerary: raw, flights: [], hotels: [], restaurants: [], costs: null };
            }
            
            const it = trip.value.itinerary;
            if(!it.flights) it.flights = [];
            if(!it.itinerary) it.itinerary = [];
            if(!it.hotels) it.hotels = [];
            if(!it.restaurants) it.restaurants = [];

            // Assign metadata directly to objects to preserve reference for v-model
            it.itinerary.forEach((x: any, i: number) => { x._cat = 'itinerary'; x._idx = i; });
            it.flights.forEach((x: any, i: number) => { x._cat = 'flights'; x._idx = i; });
            it.hotels.forEach((x: any, i: number) => { x._cat = 'hotels'; x._idx = i; });
            it.restaurants.forEach((x: any, i: number) => { x._cat = 'restaurants'; x._idx = i; });

            // Update Trip Store so Map component can render this data
            tripStore.tripData = trip.value.itinerary;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const addItem = async () => {
    if(!trip.value) return;
    
    const it = trip.value.itinerary;

    if(newItem.value.category === 'flights') {
        const item = {
            from: newItem.value.from,
            to: newItem.value.to,
            type: 'Flight',
            description: newItem.value.description,
            searchQuery: '',
            estimatedCost: 0,
            _cat: 'flights',
            _idx: it.flights.length
        };
        it.flights.push(item);
    } else {
        const item = {
            name: newItem.value.name,
            type: newItem.value.type,
            day: newItem.value.day,
            time: newItem.value.time,
            city: newItem.value.city || 'Custom',
            description: newItem.value.description,
            coordinates: { lat: 0, lng: 0 }, // Placeholder
            estimatedCost: 0,
            _cat: newItem.value.type === 'Restaurant' ? 'restaurants' : newItem.value.type === 'Hotel' ? 'hotels' : 'itinerary',
            _idx: 0 // Calculated below
        };
        
        if(item.type === 'Restaurant') {
            item._idx = it.restaurants.length;
            it.restaurants.push(item);
        } else if (item.type === 'Hotel') {
            item._idx = it.hotels.length;
            it.hotels.push(item);
        } else {
            item._idx = it.itinerary.length;
            it.itinerary.push(item);
        }
    }

    await saveTripUpdate();
    showAddModal.value = false;
    // Reset form
    newItem.value = { category: 'itinerary', name: '', type: 'Attraction', description: '', from: '', to: '', day: '1', city: '', time: 'Anytime' };
};

const deleteItem = async (category: string, index: number) => {
    if(!confirm("Are you sure?")) return;
    const it = trip.value.itinerary;
    
    if(category === 'flights') it.flights.splice(index, 1);
    else if(category === 'hotels') it.hotels.splice(index, 1);
    else if(category === 'restaurants') it.restaurants.splice(index, 1);
    else it.itinerary.splice(index, 1);

    await saveTripUpdate();
};

const saveTripUpdate = async () => {
    try {
        await axios.put(`/api/trips/${trip.value.id}`, {
            itinerary: trip.value.itinerary
        });
    } catch(e) {
        alert("Failed to save changes");
        console.error(e);
    }
};

const sortedOverviewItems = computed(() => {
    if (!trip.value?.itinerary) return [];
    const it = trip.value.itinerary;

    // Combine ALL arrays
    const allItems = [
        ...it.flights,
        ...it.itinerary,
        ...it.hotels,
        ...it.restaurants
    ];

    // Sort
    return allItems.sort((a, b) => {
        const dayA = a.day ? Number(a.day) : (a.type === 'Flight' ? 0 : Infinity); 
        const dayB = b.day ? Number(b.day) : (b.type === 'Flight' ? 0 : Infinity);

        if (dayA !== dayB) return dayA - dayB;
        return 0;
    });
});

const totalCost = computed(() => {
    if(!trip.value?.itinerary) return 0;
    // Re-calculate from all sources
    const it = trip.value.itinerary;
    const all = [...it.flights, ...it.itinerary, ...it.hotels, ...it.restaurants];
    return all.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
});

onMounted(fetchTrip);
</script>