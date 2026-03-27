import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Event, EventFormData, EventNote, EventsContextValue } from '../types';
import * as DB from '../services/database.service';
import { scheduleUpcomingNotifications } from '../services/notificationScheduler.service';
import { cancelEventPush, restoreEventPush } from '../services/pushNotification.service';

const RESCHEDULE_DEBOUNCE_MS = 2000;
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

  const rescheduleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const refreshEvents = useCallback(async () => {
    try {
      const allEvents = await DB.getAllEvents(db);
      setEvents(allEvents);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh events:', err);
      setError(err.message || 'Failed to refresh events');
      throw err;
    }
  }, [db]);

  const refreshAndReschedule = useCallback(async () => {
    const freshEvents = await DB.getAllEvents(db);
    setEvents(freshEvents);
    setError(null);

    if (rescheduleTimerRef.current) {
      clearTimeout(rescheduleTimerRef.current);
    }

    rescheduleTimerRef.current = setTimeout(async () => {
      try {
        await scheduleUpcomingNotifications(freshEvents);
      } catch (err) {
        console.error('⚠️ Error rescheduling notifications:', err);
      }
    }, RESCHEDULE_DEBOUNCE_MS);
  }, [db]);

  const addEvent = useCallback(async (formData: EventFormData): Promise<Event> => {
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
        isNotificationEnabled: true,
        localId,
        serverId: undefined,
        version: Date.now(),
        needsSync: true,
      };

      const savedEvent = await DB.createEvent(db, newEvent);

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

      try {
        const newAchievements = await StreakService.trackEventCreated(db, 'default-user');
        if (newAchievements.length > 0) {
          showAchievements(newAchievements);
        }
      } catch (error) {
        console.error('⚠️ Error tracking event creation:', error);
      }

      await refreshAndReschedule();

      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Event add sync failed:', err));
      });

      return savedEvent;
    } catch (err: any) {
      console.error('Failed to add event:', err);
      setError(err.message || 'Failed to add event');
      throw err;
    }
  }, [db, showAchievements, refreshAndReschedule]);

  const updateEvent = useCallback(async (id: string, formData: Partial<EventFormData>): Promise<Event> => {
    try {
      const updates: Partial<Event> = {};

      if (formData.title !== undefined) updates.title = formData.title;
      if (formData.eventDate !== undefined) updates.eventDate = formData.eventDate.toISOString();
      if (formData.isLunarCalendar !== undefined) updates.isLunarCalendar = formData.isLunarCalendar;
      if (formData.tags !== undefined) updates.tags = formData.tags;
      if (formData.remindDaysBefore !== undefined || formData.reminderTime !== undefined) {
        const existingEvent = await DB.getEventById(db, id);
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

      await refreshAndReschedule();

      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Event update sync failed:', err));
      });

      return updatedEvent;
    } catch (err: any) {
      console.error('Failed to update event:', err);
      setError(err.message || 'Failed to update event');
      throw err;
    }
  }, [db, refreshAndReschedule]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const event = events.find(e => e.id === id);
      const isServerPushEvent = event?.recurrencePattern?.type === 'weekly' || event?.recurrencePattern?.type === 'monthly';
      await DB.deleteEvent(db, id);
      await refreshAndReschedule();
      if (isServerPushEvent) {
        cancelEventPush(id).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      setError(err.message || 'Failed to delete event');
      throw err;
    }
  }, [db, events, refreshAndReschedule]);

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

  const toggleEventNotification = useCallback(async (id: string): Promise<void> => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) return;

      const isServerPushEvent = event.recurrencePattern?.type === 'weekly' || event.recurrencePattern?.type === 'monthly';
      const willDisable = event.isNotificationEnabled;

      const updates: Partial<Event> = {
        isNotificationEnabled: !event.isNotificationEnabled,
        needsSync: true,
        version: Date.now(),
      };

      await DB.updateEvent(db, id, updates);
      await refreshAndReschedule();

      if (isServerPushEvent) {
        if (willDisable) {
          cancelEventPush(id).catch(() => {});
        } else {
          restoreEventPush(id).catch(() => {});
        }
      }

      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Toggle notification sync failed:', err));
      });
    } catch (err: any) {
      console.error('Failed to toggle notification:', err);
      setError(err.message || 'Failed to toggle notification');
      throw err;
    }
  }, [db, events, refreshAndReschedule]);

  const upsertEventNote = useCallback(async (eventId: string, noteData: Partial<EventNote>): Promise<Event> => {
    try {
      const existing = events.find(e => e.id === eventId);
      if (!existing) throw new Error('Event not found');
      const currentYear = new Date().getFullYear();
      const year = noteData.year ?? currentYear;
      const notes = existing.notes ? [...existing.notes] : [];
      const idx = notes.findIndex(n => n.year === year);
      if (idx >= 0) {
        notes[idx] = { ...notes[idx], ...noteData, year };
      } else {
        notes.push({ year, ...noteData } as EventNote);
      }
      const updated = await DB.updateEvent(db, eventId, { notes, needsSync: true, version: Date.now() });
      await refreshAndReschedule();
      authService.isAnonymous().then(isAnon => {
        if (!isAnon) syncService.sync().catch(err => console.warn('Note sync failed:', err));
      });
      return updated;
    } catch (err: any) {
      console.error('Failed to upsert event note:', err);
      throw err;
    }
  }, [db, events, refreshAndReschedule]);

  const clearUserData = useCallback(async () => {
    try {
      await db.execAsync('DELETE FROM events');
    } catch (e) {
      console.warn('clearUserData: failed to delete events', e);
    }
    try {
      await db.execAsync('DELETE FROM sync_metadata');
    } catch (e) {
      console.warn('clearUserData: failed to delete sync_metadata', e);
    }
    setEvents([]);
  }, [db]);

  const value = useMemo<EventsContextValue>(() => ({
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
    toggleEventNotification,
    upsertEventNote,
    clearUserData,
  }), [
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
    toggleEventNotification,
    upsertEventNote,
    clearUserData,
  ]);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = (): EventsContextValue => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
