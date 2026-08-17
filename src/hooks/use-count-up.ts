import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `end` once the element scrolls into view.
 * Returns [ref, value].
 */
export function useCountUp(end: number, duration = 1600) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") {
      setValue(end);
      return;
    }
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.round(eased * end));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [end, duration]);

  return [ref, value] as const;
}
