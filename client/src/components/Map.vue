<template>
  <div class="relative w-full h-full group">
    <div id="map" class="w-full h-full z-0 bg-gray-100 dark:bg-neutral-900 transition-colors duration-300"></div>
    
    <!-- Map Style Toggle -->
    <button @click="toggleStyle" class="absolute bottom-8 left-8 z-10 w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center text-black dark:text-white hover:scale-110 transition" title="Toggle Satellite View">
        <i :class="['fa-solid', currentStyle === 'standard' ? 'fa-satellite' : 'fa-map']"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useTripStore } from '../stores/trip';

// *** IMPORTANT: REPLACE WITH YOUR MAPBOX ACCESS TOKEN ***
mapboxgl.accessToken = 'pk.eyJ1IjoibGxsbHUiLCJhIjoiY21pbzBuNTJuMDFvNzNkcHoxdnRzZDJkMCJ9.UMhJMI3DqyJX-M_FOtl0kA'; 
// ^ This is a dummy/invalid token. The map will likely not load tiles without a valid one.
// Please sign up at mapbox.com (free tier is generous) and paste your public token here.

const map = ref<mapboxgl.Map | null>(null);
const markers = ref<mapboxgl.Marker[]>([]);
const tripStore = useTripStore();
const observer = ref<MutationObserver | null>(null);
const currentStyle = ref<'standard' | 'satellite'>('satellite');

const resizeObserver = new ResizeObserver(() => {
  map.value?.resize();
});

const toggleStyle = () => {
    currentStyle.value = currentStyle.value === 'standard' ? 'satellite' : 'standard';
    updateMapTheme();
};

const updateMapTheme = () => {
  if (!map.value) return;
  
  if (currentStyle.value === 'satellite') {
      map.value.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
  } else {
      const isDark = document.documentElement.classList.contains('dark');
      map.value.setStyle(isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
  }
  
  // Re-apply atmosphere/fog after style change (style change clears it)
  map.value.once('style.load', () => {
      console.log("Map: Style loaded, restoring layers...");
      try {
        map.value!.setFog({
            'color': 'rgb(186, 210, 235)', // Lower atmosphere
            'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
            'horizon-blend': 0.02, // Atmosphere thickness
            'space-color': 'rgb(11, 11, 25)', // Background color
            'star-intensity': 0.6 
        });
        
        // Force a slight delay to ensure internal Mapbox state is ready for layers
        setTimeout(() => {
             renderMap(); 
        }, 50);
      } catch (e) {
          console.error("Map: Error restoring layers", e);
      }
  });
};

const renderMap = () => {
  const newData = tripStore.tripData;
  if (!map.value || !newData) return;

  // Clear existing
  markers.value.forEach(m => m.remove());
  markers.value = [];
  
  if (map.value.getLayer('route')) map.value.removeLayer('route');
  if (map.value.getSource('route')) map.value.removeSource('route');

  const pathCoords: [number, number][] = [];
  
  // Mapbox uses [lng, lat] order!
  const itemsToMap = newData.itinerary || []; 
  
  itemsToMap.forEach((item: any) => {
    if (item.coordinates && item.coordinates.lat !== 0 && item.coordinates.lng !== 0) {
      const lngLat: [number, number] = [item.coordinates.lng, item.coordinates.lat];
      pathCoords.push(lngLat);

      // Create Marker
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#ffffff' : '#171717';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<b>${item.name}</b><br>${item.description}`);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map.value!);
      
      markers.value.push(marker);
    }
  });

  // Draw Polyline
  if (pathCoords.length > 1) {
    map.value.addSource('route', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': pathCoords
            }
        }
    });
    
    map.value.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': document.documentElement.classList.contains('dark') ? '#ffffff' : '#171717',
            'line-width': 3,
            'line-dasharray': [2, 2]
        }
    });
  }

  // Fit Bounds (Fly To)
  if (pathCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      pathCoords.forEach(coord => bounds.extend(coord));
      map.value.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 2000 }); // Smooth fly animation
  }
};

onMounted(() => {
  const mapEl = document.getElementById('map');
  if (mapEl) resizeObserver.observe(mapEl);

  const isDark = document.documentElement.classList.contains('dark');
  let initialStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  
  if (currentStyle.value === 'satellite') {
      initialStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
  }

  map.value = new mapboxgl.Map({
    container: 'map',
    style: initialStyle,
    projection: 'globe', // 3D Globe!
    zoom: 1.5,
    center: [30, 15]
  } as any);

  map.value.on('style.load', () => {
    map.value!.setFog({
        'color': 'rgb(186, 210, 235)', // Lower atmosphere
        'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
        'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        'space-color': 'rgb(11, 11, 25)', // Background color
        'star-intensity': 0.6 // Background star brightness (default 0.35 at low zoooms )
    });
    
    // Initial Render if data exists
    if (tripStore.tripData) renderMap();
  });

  // Watch for theme changes to swap style
  observer.value = new MutationObserver(() => {
     updateMapTheme();
  });
  observer.value.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
  observer.value?.disconnect();
  resizeObserver.disconnect();
  map.value?.remove();
});

watch(() => tripStore.tripData, () => {
    if (map.value && map.value.isStyleLoaded()) renderMap();
}, { deep: true });
</script>

<style>
/* Fix for Mapbox markers/popups in dark mode if needed */
</style>