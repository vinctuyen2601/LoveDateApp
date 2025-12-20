import React from 'react';
import { useNotification } from '../store/NotificationContext';
import NotificationBanner from './NotificationBanner';

/**
 * Global NotificationBanner component that displays across all screens
 * Shows upcoming events notification or daily quote
 */
const GlobalNotificationBanner: React.FC = () => {
  const { message, icon, hasUpcomingEvents } = useNotification();

  // Always show the banner - either with upcoming events or daily quote
  return (
    <NotificationBanner
      message={message}
      icon={icon}
    />
  );
};

export default GlobalNotificationBanner;
