import { useEffect, useRef, useState } from "react";

export function useImageLazyLoad() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
      },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
