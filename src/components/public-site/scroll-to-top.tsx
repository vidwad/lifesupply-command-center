"use client";

/**
 * Back-to-top control, bottom right, in the manner of the LLD Recovery
 * Academy site: absent near the top of the page, present once the visitor
 * has read down, one press returns to the top and puts keyboard focus on
 * the main landmark so the next Tab lands in the page, not in the footer.
 *
 * The scroll listener is passive and coalesced onto animation frames, like
 * use-scroll-direction.ts. The control is rendered only while it is needed,
 * so it never sits in the tab order invisibly. Smooth scrolling and the
 * entrance are switched off under reduced motion.
 */
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 480;

export function ScrollToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setShown(window.scrollY > SHOW_AFTER_PX);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!shown) return null;

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const main = document.getElementById("lsh-main");
    if (main instanceof HTMLElement) main.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className="lsh-primary-action lsh-scroll-top fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center shadow-lg transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:bottom-8 lg:right-8"
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
