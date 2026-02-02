import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Event, EventFormData, EventsContextValue } from '../types';
import * as DB from '../services/database.service';
import { notificationEnhancedService } from '../services/notificationEnhanced.service';
import * as ChecklistService from '../services/checklist.service';
import * as StreakService from '../services/streak.service';
import { useAchievement } from './AchievementContext';

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

interface EventsProviderProps {
  children: ReactNode;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const db = useSQLiteContext(); // 🎉 Use SQLite context instead of singleton
  const { showAchievements } = useAchievement();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize enhanced notification service with database
    notificationEnhancedService.init(db).catch(err => {
      console.error('Failed to initialize notification service:', err);
    });

    // Load events when database is ready
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allEvents = await DB.getAllEvents(db);
      setEvents(allEvents);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      const allEvents = await DB.getAllEvents(db);
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
      const now = new Date();
      const newEvent: Omit<Event, 'createdAt' | 'updatedAt'> = {
        id: localId,
        title: formData.title,
        eventDate: formData.eventDate.toISOString(),
        isLunarCalendar: formData.isLunarCalendar,
        tags: formData.tags,
        reminderSettings: {
          remindDaysBefore: formData.remindDaysBefore,
          reminderTime: formData.reminderTime || { hour: now.getHours(), minute: now.getMinutes() }, // Default to current time
        },
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        isDeleted: false,
        localId,
        serverId: undefined,
        version: Date.now(),
        needsSync: true,
      };

      // Save to database using functional approach
      const savedEvent = await DB.createEvent(db, newEvent);

      // Auto-generate checklist for new event
      try {
        await ChecklistService.generateChecklistForEvent(
          db,
          savedEvent.id,
          savedEvent.title,
          savedEvent.tags
        );
        console.log('✅ Auto-generated checklist for new event');
      } catch (error) {
        console.error('⚠️ Error generating checklist:', error);
        // Don't fail event creation if checklist generation fails
      }

      // Schedule notifications with enhanced service
      try {
        const result = await notificationEnhancedService.scheduleEventNotifications(savedEvent);
        if (result.totalFailed > 0) {
          console.warn(`⚠️ ${result.totalFailed} notifications failed to schedule for "${savedEvent.title}"`);
        }
      } catch (error) {
        console.error('⚠️ Error scheduling notifications:', error);
        // Don't fail event creation if notification scheduling fails
        // Notifications can be rescheduled later
      }

      // Track event creation for gamification
      try {
        const newAchievements = await StreakService.trackEventCreated(db, 'default-user');
        if (newAchievements.length > 0) {
          showAchievements(newAchievements);
        }
      } catch (error) {
        console.error('⚠️ Error tracking event creation:', error);
        // Don't fail event creation if tracking fails
      }

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
      if (formData.eventDate !== undefined) updates.eventDate = formData.eventDate.toISOString();
      if (formData.isLunarCalendar !== undefined) updates.isLunarCalendar = formData.isLunarCalendar;
      if (formData.tags !== undefined) updates.tags = formData.tags;
      if (formData.remindDaysBefore !== undefined || formData.reminderTime !== undefined) {
        // Get existing event to preserve other reminder settings
        const existingEvent = events.find(e => e.id === id);
        updates.reminderSettings = {
          remindDaysBefore: formData.remindDaysBefore ?? existingEvent?.reminderSettings?.remindDaysBefore ?? [],
          reminderTime: formData.reminderTime ?? existingEvent?.reminderSettings?.reminderTime,
        };
      }
      if (formData.isRecurring !== undefined) updates.isRecurring = formData.isRecurring;
      if (formData.recurrencePattern !== undefined) updates.recurrencePattern = formData.recurrencePattern;

      // Update in database using functional approach
      const updatedEvent = await DB.updateEvent(db, id, updates);

      // Update notifications with enhanced service
      try {
        const result = await notificationEnhancedService.scheduleEventNotifications(updatedEvent);
        if (result.totalFailed > 0) {
          console.warn(`⚠️ ${result.totalFailed} notifications failed to schedule for "${updatedEvent.title}"`);
        }
      } catch (error) {
        console.error('⚠️ Error updating notifications:', error);
        // Don't fail event update if notification update fails
      }

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
      // Soft delete in database using functional approach
      await DB.deleteEvent(db, id);

      // Cancel notifications with enhanced service (also marks as cancelled in logs)
      try {
        await notificationEnhancedService.cancelEventNotifications(id);
      } catch (error) {
        console.error('⚠️ Error canceling notifications:', error);
        // Don't fail event deletion if notification cancellation fails
        // User can still manually clear notifications from system settings
      }

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

  const getEventsByTag = useCallback((tag: string): Event[] => {
    return events.filter(event => event.tags.includes(tag));
  }, [events]);

  const searchEvents = useCallback((query: string): Event[] => {
    const lowerQuery = query.toLowerCase();
    return events.filter(event =>
      event.title.toLowerCase().includes(lowerQuery)
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
    getEventsByTag,
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
