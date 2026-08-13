import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Helper function to get animation classes
export const getAnimClass = (isVisible: boolean, direction: 'up' | 'left' | 'right' | 'scale' = 'up', delay = 0) => {
  const base = 'anim-hidden';
  const dirClass = `anim-${direction}`;
  const delayClass = delay > 0 ? `delay-${delay}` : '';

  if (isVisible) {
    return `anim-visible ${delayClass}`;
  }
  return `${base} ${dirClass} ${delayClass}`;
};
