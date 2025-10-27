import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

class EventService {
  constructor() {
    this.storageKey = 'smart_event_planner_events';
    this.useBackend = false;
  }

  async checkBackendConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, { timeout: 1000 });
      this.useBackend = true;
      return true;
    } catch (error) {
      this.useBackend = false;
      return false;
    }
  }

  async getAllEvents() {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.get(`${API_BASE_URL}/events`);
        return response.data.data || [];
      } else {
        const eventsJson = localStorage.getItem(this.storageKey);
        return eventsJson ? JSON.parse(eventsJson) : [];
      }
    } catch (error) {
      console.error('Error loading events:', error);
      const eventsJson = localStorage.getItem(this.storageKey);
      return eventsJson ? JSON.parse(eventsJson) : [];
    }
  }

  async getEventById(id) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.get(`${API_BASE_URL}/events/${id}`);
        return response.data.data;
      } else {
        const events = await this.getAllEvents();
        return events.find(event => event.id === id);
      }
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  async createEvent(eventData) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.post(`${API_BASE_URL}/events`, eventData);
        const newEvent = response.data.data;

        const events = await this.getAllEvents();
        events.unshift(newEvent);
        localStorage.setItem(this.storageKey, JSON.stringify(events));

        return newEvent;
      } else {
        const events = await this.getAllEvents();
        const newEvent = {
          id: Date.now().toString(),
          ...eventData,
          ai_generated_content: eventData.ai_generated_content || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        events.unshift(newEvent);
        localStorage.setItem(this.storageKey, JSON.stringify(events));

        return newEvent;
      }
    } catch (error) {
      console.error('Error creating event:', error);

      const events = await this.getAllEvents();
      const newEvent = {
        id: Date.now().toString(),
        ...eventData,
        ai_generated_content: eventData.ai_generated_content || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      events.unshift(newEvent);
      localStorage.setItem(this.storageKey, JSON.stringify(events));

      return newEvent;
    }
  }

  async updateEvent(id, updates) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.put(`${API_BASE_URL}/events/${id}`, updates);
        const updatedEvent = response.data.data;

        const events = await this.getAllEvents();
        const index = events.findIndex(event => event.id === id);
        if (index !== -1) {
          events[index] = updatedEvent;
          localStorage.setItem(this.storageKey, JSON.stringify(events));
        }

        return updatedEvent;
      } else {
        const events = await this.getAllEvents();
        const index = events.findIndex(event => event.id === id);

        if (index === -1) {
          throw new Error('Event not found');
        }

        events[index] = {
          ...events[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(events));
        return events[index];
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        await axios.delete(`${API_BASE_URL}/events/${id}`);
      }

      const events = await this.getAllEvents();
      const filteredEvents = events.filter(event => event.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredEvents));
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEventWithPreferences(userId = 1) {
    try {
      await this.checkBackendConnection();

      if (this.useBackend) {
        const response = await axios.get(`${API_BASE_URL}/events/with-preferences`, {
          params: { user_id: userId }
        });
        return response.data.data;
      } else {
        const events = await this.getAllEvents();
        const preferencesCache = localStorage.getItem('event_preferences_cache');
        const preference = preferencesCache ? JSON.parse(preferencesCache) : null;

        return {
          event: events.length > 0 ? events[0] : null,
          preference
        };
      }
    } catch (error) {
      console.error('Error fetching event with preferences:', error);
      return { event: null, preference: null };
    }
  }
}

export const eventService = new EventService();
