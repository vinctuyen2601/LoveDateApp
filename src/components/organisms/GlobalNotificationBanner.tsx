import React from 'react';
import { useNotification } from '@contexts/NotificationContext';
import NotificationBanner from '@components/molecules/NotificationBanner';

/**
 * Global NotificationBanner component that displays across all screens
 * Shows upcoming events notification or daily quote
 */
const GlobalNotificationBanner: React.FC = () => {
  const { message, image } = useNotification();

  // Always show the banner - either with upcoming events or daily quote
  return (
    <NotificationBanner
      message={message}
      image={image}
    />
  );
};

export default GlobalNotificationBanner;
