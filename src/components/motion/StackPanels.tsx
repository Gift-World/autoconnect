import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export type StackPanel = {
  id: string;
  label: string;
  color: string;
  content: ReactNode;
};

/**
 * Full-height coloured panels that pin under the navbar and stack over each
 * other while scrolling, each shrinking slightly as the next one arrives.
 */
export function StackPanels({ panels }: { panels: StackPanel[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <div ref={ref} className="relative px-3 sm:px-5">
      {panels.map((panel, index) => (
        <Panel
          key={panel.id}
          panel={panel}
          index={index}
          panels={panels}
          progress={scrollYProgress}
          still={!!reduce}
        />
      ))}
    </div>
  );
}

function Panel({
  panel,
  index,
  panels,
  progress,
  still,
}: {
  panel: StackPanel;
  index: number;
  panels: StackPanel[];
  progress: MotionValue<number>;
  still: boolean;
}) {
  const total = panels.length;
  const targetScale = 1 - (total - 1 - index) * 0.035;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <section
      aria-labelledby={`${panel.id}-label`}
      className="sticky top-16 flex h-[calc(100svh-4rem)] items-center py-3 sm:top-[4.5rem] sm:h-[calc(100svh-4.5rem)] sm:py-5"
    >
      <motion.div
        style={{ scale: still ? 1 : scale, backgroundColor: panel.color }}
        className="relative h-full w-full origin-top overflow-hidden rounded-[28px] text-ac-ink shadow-[0_-18px_50px_rgba(0,0,0,.18)] sm:rounded-[36px]"
      >
        <div className="flex h-full flex-col p-6 sm:p-10 lg:p-14">
          <div className="flex-1 min-h-0">{panel.content}</div>
          <ol className="mt-5 flex items-center gap-2" aria-label="Story steps">
            {panels.map((step, stepIndex) => {
              const current = stepIndex === index;
              return (
                <li key={step.id} className="flex items-center gap-2">
                  <span
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border text-[11px] font-bold",
                      current ? "border-ac-ink" : "border-ac-ink/25 text-ac-ink/40",
                    )}
                  >
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  {current && (
                    <span id={`${panel.id}-label`} className="text-sm font-semibold">
                      {step.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}
