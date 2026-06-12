import { useImageFallback } from '../hooks/useImageFallback';

export default function FallbackImg({ images = [], alt = '', className = '', fallback = null }) {
  const { src, onError } = useImageFallback(images);
  if (!src) return fallback;
  return <img src={src} alt={alt} className={className} onError={onError} />;
}
