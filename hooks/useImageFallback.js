import { useState, useCallback } from 'react';

/**
 * Cycles through an images array on load failure.
 * Returns the current src (null when all images exhausted) and an onError handler.
 */
export function useImageFallback(images = []) {
  const valid = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  const onError = useCallback(() => {
    setIndex(i => i + 1);
  }, []);

  const src = index < valid.length ? valid[index] : null;

  return { src, onError };
}
