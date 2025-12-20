import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SyncStatus, SyncConflict, SyncContextValue } from '../types';
import { syncService } from '../services/sync.service';
import { contentSyncService } from '../services/contentSync.service';
import { notificationService } from '../services/notification.service';
import { databaseService } from '../services/database.service';
import { useAuth } from './AuthContext';
import { useEvents } from './EventsContext';

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { refreshEvents } = useEvents();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: undefined,
    lastSyncVersion: 0,
    pendingCount: 0,
    error: undefined,
  });

  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  useEffect(() => {
    // Setup sync listener
    const unsubscribe = syncService.addListener((status) => {
      setSyncStatus(prevStatus => ({
        ...prevStatus,
        ...status,
      }));

      // Handle conflicts
      if (status.conflicts && status.conflicts.length > 0) {
        setConflicts(status.conflicts);
      }

      // Refresh events after successful sync
      if (status.isSyncing === false && !status.error) {
        refreshEvents()
          .then(async () => {
            // Reschedule all notifications after sync to ensure they're up to date
            try {
              const events = await databaseService.getAllEvents();
              await notificationService.rescheduleAllNotifications(events);
              console.log('Notifications rescheduled after sync');
            } catch (error) {
              console.error('Error rescheduling notifications after sync:', error);
            }
          })
          .catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshEvents]);

  useEffect(() => {
    // Start auto-sync when authenticated
    if (isAuthenticated) {
      syncService.startAutoSync();
    } else {
      syncService.stopAutoSync();
    }

    return () => {
      syncService.stopAutoSync();
    };
  }, [isAuthenticated]);

  const sync = async (): Promise<void> => {
    try {
      // Sync events
      await syncService.forceSyncNow();

      // Sync content (articles & surveys)
      await contentSyncService.syncContent();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  };

  const resolveConflict = async (conflict: SyncConflict, keepLocal: boolean): Promise<void> => {
    try {
      await syncService.resolveConflict(conflict, keepLocal);

      // Remove resolved conflict
      setConflicts(prevConflicts =>
        prevConflicts.filter(c => c.clientEvent.id !== conflict.clientEvent.id)
      );

      // Refresh events
      await refreshEvents();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  };

  const value: SyncContextValue = {
    syncStatus: {
      ...syncStatus,
      conflicts,
    } as any,
    sync,
    resolveConflict,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
