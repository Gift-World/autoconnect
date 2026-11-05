import { useRef, type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export type FloatingCard = {
  eyebrow: string;
  title: string;
  body: string;
  color: string;
  to: LinkProps["to"];
};

/**
 * A pinned full-bleed photo with cards that slide up and stack on top of
 * each other as the visitor scrolls.
 */
export function FloatingStack({
  image,
  imageAlt,
  heading,
  cards,
}: {
  image: string;
  imageAlt: string;
  heading: ReactNode;
  cards: FloatingCard[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} className="relative px-3 sm:px-5" style={{ height: reduce ? "auto" : `${100 + cards.length * 55}vh` }}>
      <div className={reduce ? "py-6" : "sticky top-16 h-[calc(100svh-4rem)] py-3 sm:top-[4.5rem] sm:h-[calc(100svh-4.5rem)] sm:py-5"}>
        <div className="relative h-full overflow-hidden rounded-[28px] bg-ac-ink sm:rounded-[36px]">
          <img src={image} alt={imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,15,14,.82),rgba(10,15,14,.2)_55%,rgba(10,15,14,.45))]" />
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 lg:right-auto">
            <h2 className="font-brand text-5xl text-white sm:text-7xl lg:text-8xl">{heading}</h2>
          </div>
          <div className="absolute right-4 top-4 w-[calc(100%-2rem)] sm:right-8 sm:top-8 sm:w-[420px]">
            <div className="relative">
              {cards.map((card, index) => (
                <Card
                  key={card.title}
                  card={card}
                  index={index}
                  total={cards.length}
                  progress={scrollYProgress}
                  still={!!reduce}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  card,
  index,
  total,
  progress,
  still,
}: {
  card: FloatingCard;
  index: number;
  total: number;
  progress: MotionValue<number>;
  still: boolean;
}) {
  const start = index / (total + 0.5);
  const end = start + 0.8 / (total + 0.5);
  const y = useTransform(progress, [start, end], [index === 0 ? 0 : 900, index * 16]);

  return (
    <motion.div
      style={
        still
          ? { position: "relative", marginTop: index ? 12 : 0, backgroundColor: card.color }
          : { y, position: index ? "absolute" : "relative", inset: index ? "0 0 auto 0" : undefined, zIndex: index, backgroundColor: card.color }
      }
      className="rounded-2xl p-5 text-ac-ink shadow-[0_18px_40px_rgba(0,0,0,.25)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="brand-kicker text-ac-ink/60">{card.eyebrow}</span>
        <span className="font-brand text-sm text-ac-ink/40">{String(index + 1).padStart(2, "0")}.</span>
      </div>
      <h3 className="mt-3 text-xl font-extrabold tracking-tight">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ac-ink/75">{card.body}</p>
      <Link to={card.to} className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline">
        Learn more <ArrowUpRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
