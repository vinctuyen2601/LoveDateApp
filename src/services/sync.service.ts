import NetInfo from '@react-native-community/netinfo';
import { Event, SyncPayload, SyncResponse, SyncConflict, SyncError } from '../types';
import { databaseService } from './database.service';
import { apiService } from './api.service';
import { contentSyncService } from './contentSync.service';
import { SYNC_INTERVAL } from '../constants/config';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: any) => void> = [];

  /**
   * Start auto-sync
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      return;
    }

    // Initial sync
    this.sync();

    // Setup interval
    this.syncInterval = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL);

    console.log('Auto-sync started');
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Perform sync
   */
  async sync(): Promise<void> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      this.notifyListeners({ isSyncing: true, error: null });

      // Check internet connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection, skipping sync');
        this.notifyListeners({
          isSyncing: false,
          error: 'No internet connection',
        });
        return;
      }

      // Get events that need sync
      const eventsNeedingSync = await databaseService.getEventsNeedingSync();

      if (eventsNeedingSync.length === 0) {
        console.log('No events to sync');
        this.notifyListeners({ isSyncing: false, error: null });
        return;
      }

      console.log(`Syncing ${eventsNeedingSync.length} events...`);

      // Get last sync version
      const lastSyncVersionStr = await databaseService.getSyncMetadata('lastSyncVersion');
      const lastSyncVersion = lastSyncVersionStr ? parseInt(lastSyncVersionStr) : 0;

      // Prepare sync payload
      const payload: SyncPayload = {
        events: eventsNeedingSync,
        lastSyncVersion,
      };

      // Send to server
      const response = await apiService.post<SyncResponse>('/sync', payload);

      // Process response
      await this.processSyncResponse(response);

      // Save new sync version
      await databaseService.setSyncMetadata(
        'lastSyncVersion',
        response.lastSyncVersion.toString()
      );
      await databaseService.setSyncMetadata(
        'lastSyncAt',
        new Date().toISOString()
      );

      console.log('Sync completed successfully');

      // Also sync content (articles & surveys) in background
      try {
        await contentSyncService.syncContent();
      } catch (contentError) {
        console.error('Content sync failed during auto-sync:', contentError);
        // Don't throw - content sync failure shouldn't fail the whole sync
      }

      this.notifyListeners({
        isSyncing: false,
        error: null,
        lastSyncAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      this.notifyListeners({
        isSyncing: false,
        error: error.message || 'Sync failed',
      });
      throw new SyncError('Sync failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process sync response from server
   */
  private async processSyncResponse(response: SyncResponse): Promise<void> {
    // 1. Process successfully synced events
    for (const processed of response.processedEvents) {
      await databaseService.markEventSynced(processed.localId, processed.serverId);
    }

    // 2. Process server changes (new or updated events from server)
    for (const serverEvent of response.serverChanges) {
      const localEvent = await databaseService.getEventById(serverEvent.id);

      if (!localEvent) {
        // New event from server - insert
        await databaseService.createEvent({
          ...serverEvent,
          needsSync: false,
        });
      } else {
        // Existing event - update if server version is newer
        if (serverEvent.version > localEvent.version) {
          await databaseService.updateEvent(serverEvent.id, {
            ...serverEvent,
            needsSync: false,
          });
        }
      }
    }

    // 3. Handle conflicts (will be handled by UI)
    if (response.conflicts.length > 0) {
      console.log(`Found ${response.conflicts.length} conflicts`);
      this.notifyListeners({
        conflicts: response.conflicts,
      });
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflict: SyncConflict, keepLocal: boolean): Promise<void> {
    try {
      const eventToKeep = keepLocal ? conflict.clientEvent : conflict.serverEvent;

      if (keepLocal) {
        // Force push local version to server
        await apiService.post('/events/force-update', {
          event: conflict.clientEvent,
        });

        // Mark as synced
        await databaseService.updateEvent(conflict.clientEvent.id, {
          needsSync: false,
        });
      } else {
        // Update local with server version
        await databaseService.updateEvent(conflict.serverEvent.id, {
          ...conflict.serverEvent,
          needsSync: false,
        });
      }

      console.log(`Conflict resolved: kept ${keepLocal ? 'local' : 'server'} version`);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw new SyncError('Failed to resolve conflict', error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSyncAt: string | null;
    pendingCount: number;
  }> {
    const eventsNeedingSync = await databaseService.getEventsNeedingSync();
    const lastSyncAt = await databaseService.getSyncMetadata('lastSyncAt');

    return {
      isSyncing: this.isSyncing,
      lastSyncAt,
      pendingCount: eventsNeedingSync.length,
    };
  }

  /**
   * Check if online
   */
  async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected || false;
  }

  /**
   * Add sync status listener
   */
  addListener(listener: (status: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(status: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<void> {
    console.log('Force syncing now...');
    await this.sync();
  }
}

// Export singleton instance
export const syncService = new SyncService();
