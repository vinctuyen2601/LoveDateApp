import { apiService } from './api.service';
import type {
  UserConnection,
  SharedEvent,
  ConnectionWithQuota,
  MyLimits,
  ConnectionSearchResult,
  QRData,
} from '../types/connections';

// ── Connections ────────────────────────────────────────────────────────────────

export const getMyConnections = (): Promise<UserConnection[]> =>
  apiService.get('/connections');

export const getPendingRequests = (): Promise<UserConnection[]> =>
  apiService.get('/connections/requests');

export const getConnectionsWithQuota = (): Promise<ConnectionWithQuota[]> =>
  apiService.get('/connections/with-quota');

export const getMyLimits = (): Promise<MyLimits> =>
  apiService.get('/connections/limits');

export const sendConnectionRequest = (targetUserId: string): Promise<UserConnection> =>
  apiService.post('/connections/request', { targetUserId });

export const acceptConnection = (connectionId: string): Promise<UserConnection> =>
  apiService.patch(`/connections/${connectionId}/accept`, {});

export const declineConnection = (connectionId: string): Promise<UserConnection> =>
  apiService.patch(`/connections/${connectionId}/decline`, {});

export const removeConnection = (connectionId: string): Promise<void> =>
  apiService.delete(`/connections/${connectionId}`);

// ── Search & QR ───────────────────────────────────────────────────────────────

export const searchByEmail = (email: string): Promise<ConnectionSearchResult> =>
  apiService.post('/connections/search', { email });

export const getMyQRData = (): Promise<QRData> =>
  apiService.get('/connections/qr-data');

export const resolveQR = (userId: string): Promise<ConnectionSearchResult> =>
  apiService.post('/connections/qr-resolve', { userId });

// ── Shared Events ─────────────────────────────────────────────────────────────

export const getSharedInbox = (): Promise<SharedEvent[]> =>
  apiService.get('/connections/shared-inbox');

export const getSharedOutbox = (): Promise<SharedEvent[]> =>
  apiService.get('/connections/shared-outbox');

export const shareEvent = (
  eventId: string,
  recipientIds: string[],
): Promise<SharedEvent[]> =>
  apiService.post('/connections/share-event', { eventId, recipientIds });

export const acceptSharedEvent = (sharedEventId: string): Promise<SharedEvent> =>
  apiService.patch(`/connections/shared-events/${sharedEventId}/accept`, {});

export const declineSharedEvent = (sharedEventId: string): Promise<SharedEvent> =>
  apiService.patch(`/connections/shared-events/${sharedEventId}/decline`, {});

export const getSharedEventInfo = (sharedEventId: string): Promise<{ hasPlan: boolean; sharerName: string } | null> =>
  apiService.get(`/connections/shared-events/${sharedEventId}/info`);
