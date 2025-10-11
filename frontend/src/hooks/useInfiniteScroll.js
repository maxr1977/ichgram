import { useEffect, useRef } from 'react';

const useInfiniteScroll = ({ disabled, onIntersect, rootMargin = '200px' }) => {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    const node = sentinelRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect?.();
          }
        });
      },
      { root: null, rootMargin, threshold: 0.1 },
    );

    observer.observe(node);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [disabled, onIntersect, rootMargin]);

  return sentinelRef;
};

export default useInfiniteScroll;
