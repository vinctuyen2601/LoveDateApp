import { useState, useEffect } from 'react';

/**
 * Hook for staggered section rendering.
 * Returns true when the section should be visible.
 * First sections render immediately, later sections delay progressively.
 */
export const useLazySection = (
  sectionIndex: number,
  baseDelay: number = 100
): boolean => {
  const [isVisible, setIsVisible] = useState(sectionIndex <= 2);

  useEffect(() => {
    if (sectionIndex <= 2) return;
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (sectionIndex - 2) * baseDelay);
    return () => clearTimeout(timer);
  }, [sectionIndex, baseDelay]);

  return isVisible;
};
