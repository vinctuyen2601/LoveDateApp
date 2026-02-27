import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Event, EventFormData, EventsContextValue } from '../types';
import * as DB from '../services/database.service';
import { scheduleUpcomingNotifications } from '../services/notificationScheduler.service';
import * as ChecklistService from '../services/checklist.service';
import * as StreakService from '../services/streak.service';
import { useAchievement } from './AchievementContext';
import { syncService } from '../services/sync.service';
import { authService } from '../services/auth.service';

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

interface EventsProviderProps {
  children: ReactNode;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const db = useSQLiteContext();
  const { showAchievements } = useAchievement();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  /**
   * Lấy danh sách events mới nhất từ DB và schedule lại tất cả notifications.
   * Gọi sau mỗi thao tác CRUD để đảm bảo notifications luôn nhất quán.
   */
  const refreshAndReschedule = async () => {
    const freshEvents = await DB.getAllEvents(db);
    setEvents(freshEvents);
    setError(null);
    await scheduleUpcomingNotifications(freshEvents).catch((err) => {
      console.error('⚠️ Error rescheduling notifications:', err);
    });
  };

  const addEvent = async (formData: EventFormData): Promise<Event> => {
    try {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newEvent: Omit<Event, 'createdAt' | 'updatedAt'> = {
        id: localId,
        title: formData.title,
        eventDate: formData.eventDate.toISOString(),
        isLunarCalendar: formData.isLunarCalendar,
        tags: formData.tags,
        reminderSettings: {
          remindDaysBefore: formData.remindDaysBefore,
          reminderTime: formData.reminderTime || { hour: 9, minute: 0 },
        },
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        isDeleted: false,
        localId,
        serverId: undefined,
        version: Date.now(),
        needsSync: true,
      };

      const savedEvent = await DB.createEvent(db, newEvent);

      // Auto-generate checklist
      try {
        await ChecklistService.generateChecklistForEvent(
          db,
          savedEvent.id,
          savedEvent.title,
          savedEvent.tags
        );
      } catch (error) {
        console.error('⚠️ Error generating checklist:', error);
      }

      // Gamification tracking
      try {
        const newAchievements = await StreakService.trackEventCreated(db, 'default-user');
        if (newAchievements.length > 0) {
          showAchievements(newAchievements);
        }
      } catch (error) {
        console.error('⚠️ Error tracking event creation:', error);
      }

      // Refresh state + reschedule all notifications for updated event list
      await refreshAndReschedule();

      // Sync lên server nếu đã đăng nhập (background)
      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Event add sync failed:', err));
      });

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
        const existingEvent = events.find(e => e.id === id);
        updates.reminderSettings = {
          remindDaysBefore: formData.remindDaysBefore ?? existingEvent?.reminderSettings?.remindDaysBefore ?? [],
          reminderTime: formData.reminderTime ?? existingEvent?.reminderSettings?.reminderTime,
        };
      }
      if (formData.isRecurring !== undefined) updates.isRecurring = formData.isRecurring;
      if (formData.recurrencePattern !== undefined) updates.recurrencePattern = formData.recurrencePattern;
      updates.needsSync = true;
      updates.version = Date.now();

      const updatedEvent = await DB.updateEvent(db, id, updates);

      // Refresh state + reschedule all notifications for updated event list
      await refreshAndReschedule();

      // Sync lên server nếu đã đăng nhập (background)
      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Event update sync failed:', err));
      });

      return updatedEvent;
    } catch (err: any) {
      console.error('Failed to update event:', err);
      setError(err.message || 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string): Promise<void> => {
    try {
      await DB.deleteEvent(db, id);

      // Refresh state + reschedule (deleted event filtered out automatically)
      await refreshAndReschedule();
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
