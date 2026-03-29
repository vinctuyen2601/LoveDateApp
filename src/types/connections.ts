// ── Connection types ──────────────────────────────────────────────────────────

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';
export type SharedEventStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectionUser {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}

export interface UserConnection {
  id: string;
  requester: ConnectionUser;
  receiver: ConnectionUser;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionWithQuota {
  connection: UserConnection;
  partner: ConnectionUser;
  canReceive: boolean;     // true nếu partner còn lượt nhận shared events
}

export interface MyLimits {
  connectionsUsed: number;
  connectionsMax: number;
  sharedOutUsed: number;
  sharedOutMax: number;
  sharedInUsed: number;
  sharedInMax: number;
}

export interface ConnectionSearchResult {
  user: ConnectionUser;
  connectionStatus: ConnectionStatus | null; // null nếu chưa kết nối
  connectionId: string | null;
}

export interface QRData {
  userId: string;
  displayName?: string;
}

// ── Shared Event types ────────────────────────────────────────────────────────

export interface SharedEventSnapshot {
  title: string;
  eventDate: string;
  isLunarCalendar: boolean;
  tags: string[];
  isRecurring: boolean;
  recurrencePattern?: { type: string; [key: string]: any };
  notes?: any[];
}

export interface SharedEvent {
  id: string;
  sharer: ConnectionUser;
  recipient: ConnectionUser;
  originalEventId: string | null;
  eventSnapshot: SharedEventSnapshot;
  status: SharedEventStatus;
  createdAt: string;
  updatedAt: string;
}
