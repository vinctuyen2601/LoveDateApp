import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Achievement } from '../types';
import AchievementPopup from '../components/AchievementPopup';

interface AchievementContextType {
  showAchievements: (achievements: Achievement[]) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queuedAchievements, setQueuedAchievements] = useState<Achievement[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const showAchievements = (achievements: Achievement[]) => {
    if (achievements.length === 0) return;

    // If popup is already showing, queue the new achievements
    if (isVisible) {
      setQueuedAchievements((prev) => [...prev, ...achievements]);
      return;
    }

    // Show the first achievement
    setCurrentAchievement(achievements[0]);
    setIsVisible(true);

    // Queue the rest
    if (achievements.length > 1) {
      setQueuedAchievements(achievements.slice(1));
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentAchievement(null);

    // After a short delay, show the next achievement in queue
    setTimeout(() => {
      if (queuedAchievements.length > 0) {
        const [next, ...rest] = queuedAchievements;
        setCurrentAchievement(next);
        setQueuedAchievements(rest);
        setIsVisible(true);
      }
    }, 500);
  };

  return (
    <AchievementContext.Provider value={{ showAchievements }}>
      {children}
      <AchievementPopup
        achievement={currentAchievement}
        visible={isVisible}
        onClose={handleClose}
      />
    </AchievementContext.Provider>
  );
};

export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within AchievementProvider');
  }
  return context;
};
