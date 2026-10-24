"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Props = {
  heading: [first: string, second: string];
  buttonLabel: string;
  buttonHref: string;
  heroImg: { src: string; pos?: string; mobilePos?: string };
  images: { src: string; alt: string; pos?: string }[];
};

/**
 * Pinned scroll по модела на SIS Pitches, адаптиран за New Chance:
 * - sticky pin + пълноекранни плочки (и на телефон – не половинки)
 * - translateY в % (не px) – гладко на touch
 * - hero се вижда първи; после всяка плочка изплува отдолу
 * - всички Image са монтирани отначало (без remount mid-scroll)
 * Ref: https://www.sispitches.com/ .global-sportImageGrid
 */
export default function SportImageGrid({ heading, buttonLabel, buttonHref, heroImg, images }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin || images.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Браузърът сам движи плочките от скрола (.pin-grid в globals.css) – JS не трябва
    if (!reduceMotion && CSS.supports("animation-timeline: view()")) return;
    const n = images.length;
    let frame = 0;
    let vh = 0;
    let resizeTimer = 0;

    const apply = (scrub: number) => {
      // scrub 0…n — по един сегмент за всяка плочка
      tileRefs.current.forEach((tile, i) => {
        if (!tile) return;
        const t = Math.min(Math.max(scrub - i, 0), 1);
        tile.style.transform = `translate3d(0, ${(1 - t) * 100}%, 0)`;
      });
    };

    const measure = () => {
      vh = pin.clientHeight || window.innerHeight;
      // hero + n плочки → (n+1) екрана; scrollable = n × vh
      section.style.height = `${(reduceMotion ? 1 : n + 1) * vh}px`;
    };

    const update = () => {
      frame = 0;
      if (reduceMotion) {
        apply(n);
        return;
      }
      const top = section.getBoundingClientRect().top;
      const scrollable = Math.max(section.offsetHeight - vh, 1);
      const p = Math.min(Math.max(-top / scrollable, 0), 1);
      apply(p * n);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        update();
      }, 100);
    };

    measure();
    tileRefs.current.forEach((tile) => {
      if (!tile) return;
      tile.style.willChange = "transform";
      tile.style.transform = reduceMotion ? "translate3d(0,0,0)" : "translate3d(0,100%,0)";
    });
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      tileRefs.current.forEach((tile) => {
        if (tile) tile.style.willChange = "auto";
      });
    };
  }, [images.length]);

  return (
    <section
      ref={sectionRef}
      className="pin-grid relative"
      style={{ height: `${(images.length + 1) * 100}vh` }}
    >
      <div ref={pinRef} className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImg.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-(--pos-m) lg:object-(--pos)"
            style={
              {
                "--pos": heroImg.pos ?? "center",
                "--pos-m": heroImg.mobilePos ?? heroImg.pos ?? "center",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />

        {images.map((img, i) => (
          <div
            key={img.src}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className={`pin-grid__tile absolute top-0 h-screen w-full overflow-hidden will-change-transform lg:w-1/2 ${
              i % 2 === 0 ? "left-0" : "left-0 lg:left-1/2"
            }`}
            style={
              {
                zIndex: 10 + i,
                transform: "translate3d(0,100%,0)",
                "--from": `${(i / images.length) * 100}%`,
                "--to": `${((i + 1) / images.length) * 100}%`,
              } as React.CSSProperties
            }
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i < 2}
              loading={i < 2 ? "eager" : "lazy"}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: img.pos }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 mx-auto flex h-screen w-full flex-col items-center justify-center gap-8 px-6 text-center text-white xl:w-10/12">
          <h2
            className="heading-xl flex w-full justify-center gap-x-[0.25em] uppercase xl:text-[180px] xl:leading-[152px]"
            style={{ fontSize: "min(15vw, 180px)" }}
          >
            <span>{heading[0]}</span>
            <span>{heading[1]}</span>
          </h2>
          <a
            href={buttonHref}
            className="group pointer-events-auto inline-flex items-center gap-4 bg-evergreen py-1.5 pl-6 pr-1.5 text-sm font-semibold uppercase tracking-wider text-midnight shadow-lg shadow-black/20 transition-colors duration-300 hover:bg-white"
          >
            {buttonLabel}
            <span className="flex h-10 w-10 items-center justify-center bg-midnight text-evergreen transition-transform duration-300 group-hover:translate-x-1">
              <svg width="14" height="12" viewBox="0 0 11 10" fill="none" aria-hidden>
                <path stroke="currentColor" strokeWidth="1.5" d="M0 5h9.5M6 1l4 4-4 4" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
