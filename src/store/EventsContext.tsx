import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Event, EventFormData, EventsContextValue, EventCategory } from '../types';
import { databaseService } from '../services/database.service';
import { notificationService } from '../services/notification.service';
import { DateUtils } from '../utils/date.utils';

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

interface EventsProviderProps {
  children: ReactNode;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database and load events
    initializeAndLoadEvents();
  }, []);

  const initializeAndLoadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database
      await databaseService.init();

      // Load events
      await refreshEvents();
    } catch (err: any) {
      console.error('Failed to initialize events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      const allEvents = await databaseService.getAllEvents();
      setEvents(allEvents);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh events:', err);
      setError(err.message || 'Failed to refresh events');
      throw err;
    }
  };

  const addEvent = async (formData: EventFormData): Promise<Event> => {
    try {
      // Generate local ID
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create event object
      const newEvent: Omit<Event, 'createdAt' | 'updatedAt'> = {
        id: localId,
        title: formData.title,
        description: formData.description,
        eventDate: formData.eventDate.toISOString(),
        isLunarCalendar: formData.isLunarCalendar,
        category: formData.category,
        relationshipType: formData.relationshipType,
        reminderSettings: {
          remindDaysBefore: formData.remindDaysBefore,
          reminderTime: formData.reminderTime,
        },
        giftIdeas: formData.giftIdeas,
        notes: [],
        isRecurring: formData.isRecurring,
        isDeleted: false,
        localId,
        serverId: undefined,
        version: Date.now(),
        needsSync: true,
      };

      // Save to database
      const savedEvent = await databaseService.createEvent(newEvent);

      // Schedule notifications
      await notificationService.scheduleEventNotifications(savedEvent);

      // Refresh events list
      await refreshEvents();

      return savedEvent;
    } catch (err: any) {
      console.error('Failed to add event:', err);
      setError(err.message || 'Failed to add event');
      throw err;
    }
  };

  const updateEvent = async (id: string, formData: Partial<EventFormData>): Promise<Event> => {
    try {
      const updates: Partial<Event> = {};

      if (formData.title !== undefined) updates.title = formData.title;
      if (formData.description !== undefined) updates.description = formData.description;
      if (formData.eventDate !== undefined) updates.eventDate = formData.eventDate.toISOString();
      if (formData.isLunarCalendar !== undefined) updates.isLunarCalendar = formData.isLunarCalendar;
      if (formData.category !== undefined) updates.category = formData.category;
      if (formData.relationshipType !== undefined) updates.relationshipType = formData.relationshipType;
      if (formData.remindDaysBefore !== undefined || formData.reminderTime !== undefined) {
        // Get existing event to preserve other reminder settings
        const existingEvent = events.find(e => e.id === id);
        updates.reminderSettings = {
          remindDaysBefore: formData.remindDaysBefore ?? existingEvent?.reminderSettings?.remindDaysBefore ?? [],
          reminderTime: formData.reminderTime ?? existingEvent?.reminderSettings?.reminderTime,
        };
      }
      if (formData.giftIdeas !== undefined) updates.giftIdeas = formData.giftIdeas;
      if (formData.isRecurring !== undefined) updates.isRecurring = formData.isRecurring;

      // Update in database
      const updatedEvent = await databaseService.updateEvent(id, updates);

      // Update notifications
      await notificationService.updateEventNotifications(updatedEvent);

      // Refresh events list
      await refreshEvents();

      return updatedEvent;
    } catch (err: any) {
      console.error('Failed to update event:', err);
      setError(err.message || 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string): Promise<void> => {
    try {
      // Soft delete in database
      await databaseService.deleteEvent(id);

      // Cancel notifications
      await notificationService.cancelEventNotifications(id);

      // Refresh events list
      await refreshEvents();
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      setError(err.message || 'Failed to delete event');
      throw err;
    }
  };

  const getEventById = useCallback((id: string): Event | undefined => {
    return events.find(event => event.id === id);
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 30): Event[] => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate >= now && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events]);

  const getEventsByCategory = useCallback((category: EventCategory): Event[] => {
    return events.filter(event => event.category === category);
  }, [events]);

  const searchEvents = useCallback((query: string): Event[] => {
    const lowerQuery = query.toLowerCase();
    return events.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      (event.description && event.description.toLowerCase().includes(lowerQuery))
    );
  }, [events]);

  const value: EventsContextValue = {
    events,
    isLoading,
    error,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getUpcomingEvents,
    getEventsByCategory,
    searchEvents,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = (): EventsContextValue => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
