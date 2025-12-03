import { defineStore } from 'pinia';
import axios from 'axios';

export const useTripStore = defineStore('trip', {
  state: () => ({
    destinations: [] as string[],
    mustVisit: [] as string[],
    originCity: '',
    days: 3,
    budget: 'Moderate',
    tripData: null as any,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    addDestination(dest: string) {
      if (!this.destinations.includes(dest)) this.destinations.push(dest);
    },
    removeDestination(index: number) {
      this.destinations.splice(index, 1);
    },
    addMustVisit(item: string) {
      if (!this.mustVisit.includes(item)) this.mustVisit.push(item);
    },
    removeMustVisit(index: number) {
      this.mustVisit.splice(index, 1);
    },
    async generateTrip() {
      this.loading = true;
      this.error = null;
      this.tripData = null;
      try {
        const res = await axios.post('/api/plan', {
          originCity: this.originCity,
          destinations: this.destinations,
          days: this.days,
          budget: this.budget,
          mustVisit: this.mustVisit
        });
        this.tripData = res.data;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Failed to generate trip';
      } finally {
        this.loading = false;
      }
    },
    async saveTrip() {
       if (!this.tripData) return;
       try {
         await axios.post('/api/trips', {
             destinations: this.destinations.join(', '),
             startDate: null, // Could add date picker later
             duration: this.days,
             budget: this.budget,
             itinerary: this.tripData // Save the FULL object (flights, costs, itinerary)
         });
         alert('Trip saved!');
       } catch (e) {
         alert('Failed to save trip');
       }
    }
  }
});
