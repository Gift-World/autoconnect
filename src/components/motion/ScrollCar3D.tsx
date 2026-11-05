import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { LucideIcon } from "lucide-react";

export type CarCallout = { title: string; body: string; Icon: LucideIcon };
export type ShowcaseImage = { src: string; alt: string };

/**
 * A pinned stage where car photography tilts in 3D perspective and crossfades
 * as the visitor scrolls, while each evidence callout lights up in sequence.
 */
export function ScrollCar3D({
  kicker,
  title,
  callouts,
  images,
}: {
  kicker: string;
  title: string;
  callouts: CarCallout[];
  images: ShowcaseImage[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-18, 0, 14]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 2, 8]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.86, 1, 0.94]);

  return (
    <section ref={ref} className="relative bg-ac-ink text-white" style={{ height: reduce ? "auto" : "320vh" }}>
      <div
        className={
          reduce
            ? "py-20"
            : "sticky top-16 flex h-[calc(100svh-4rem)] items-center overflow-hidden sm:top-[4.5rem] sm:h-[calc(100svh-4.5rem)]"
        }
      >
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
          <div>
            <p className="brand-kicker text-ac-accent">{kicker}</p>
            <h2 className="font-brand mt-3 max-w-2xl text-3xl sm:text-5xl lg:text-6xl">{title}</h2>
            <div className="relative mx-auto mt-5 max-w-[min(100%,62svh)] [perspective:1400px] lg:mt-8 lg:max-w-none">
              <div className="absolute inset-x-[10%] -bottom-4 h-16 rounded-[50%] bg-ac-accent/20 blur-3xl" aria-hidden />
              <motion.div
                style={reduce ? undefined : { rotateY, rotateX, scale }}
                className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,.5)] [transform-style:preserve-3d]"
              >
                {images.map((image, index) => (
                  <Slide
                    key={image.src}
                    image={image}
                    index={index}
                    total={images.length}
                    progress={scrollYProgress}
                    still={!!reduce}
                  />
                ))}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,15,14,.55))]" aria-hidden />
              </motion.div>
            </div>
          </div>
          <ol className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
            {callouts.map((callout, index) => (
              <Callout
                key={callout.title}
                callout={callout}
                progress={scrollYProgress}
                range={[index / callouts.length, (index + 0.6) / callouts.length]}
                still={!!reduce}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Slide({
  image,
  index,
  total,
  progress,
  still,
}: {
  image: ShowcaseImage;
  index: number;
  total: number;
  progress: MotionValue<number>;
  still: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const fade = 0.06;
  const opacity = useTransform(
    progress,
    index === 0 ? [end - fade, end] : [start - fade, start, end - fade, end],
    index === 0 ? [1, 0] : index === total - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const imageScale = useTransform(progress, [start, end], [1.12, 1]);
  return (
    <motion.img
      src={image.src}
      alt={image.alt}
      loading="lazy"
      style={still ? { opacity: index === 0 ? 1 : 0 } : { opacity, scale: imageScale }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Callout({
  callout,
  progress,
  range,
  still,
}: {
  callout: CarCallout;
  progress: MotionValue<number>;
  range: [number, number];
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);
  const x = useTransform(progress, range, [24, 0]);
  const { Icon } = callout;
  return (
    <motion.li
      style={still ? undefined : { opacity, x }}
      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3 backdrop-blur sm:gap-4 lg:p-5"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ac-accent text-ac-ink lg:h-10 lg:w-10">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-bold">{callout.title}</span>
        <span className="mt-1 hidden text-sm leading-6 text-white/65 lg:block">{callout.body}</span>
      </span>
    </motion.li>
  );
}
