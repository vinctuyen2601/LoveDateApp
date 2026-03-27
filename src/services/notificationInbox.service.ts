import { apiService } from './api.service';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string; // ISO string
}

export async function getInbox(): Promise<AppNotification[]> {
  try {
    const res = await apiService.get('/notifications/inbox');
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function markAsRead(id: string): Promise<void> {
  try {
    await apiService.patch(`/notifications/inbox/${id}/read`);
  } catch {
    // fail silently
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await apiService.patch('/notifications/inbox/read-all');
  } catch {
    // fail silently
  }
}

export async function clearInbox(): Promise<void> {
  try {
    await apiService.delete('/notifications/inbox');
  } catch {
    // fail silently
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const items = await getInbox();
    return items.filter((n) => !n.isRead).length;
  } catch {
    return 0;
  }
}
