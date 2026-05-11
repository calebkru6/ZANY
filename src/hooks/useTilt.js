// ════════════════════════════════════════════════════════════════════
// hooks/useTilt.js — Pointer-tracked 3D card tilt with shine output.
// Returns a ref to attach to the element you want tilted, plus shine
// coords (0..1) that can be used to position a gloss overlay.
// Tilt animates only while pointer is over the element; resets on leave.
// Disabled gracefully on coarse-pointer devices via reduced motion if needed.
// ════════════════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";

function useTilt(maxTilt = 14, scale = 1.05) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let pending = null;

    const apply = () => {
      raf = 0;
      if (!pending) return;
      const { rx, ry, sx, sy } = pending;
      el.style.setProperty("--tilt-x", rx + "deg");
      el.style.setProperty("--tilt-y", ry + "deg");
      el.style.setProperty("--shine-x", (sx * 100) + "%");
      el.style.setProperty("--shine-y", (sy * 100) + "%");
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    };

    const onMove = e => {
      const r = el.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width;
      const sy = (e.clientY - r.top)  / r.height;
      const rx = -(sy - 0.5) * 2 * maxTilt;
      const ry =  (sx - 0.5) * 2 * maxTilt;
      pending = { rx, ry, sx, sy };
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      pending = null;
      el.style.transform = "";
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--shine-x", "50%");
      el.style.setProperty("--shine-y", "50%");
    };

    el.addEventListener("pointermove",   onMove);
    el.addEventListener("pointerleave",  onLeave);
    el.addEventListener("pointercancel", onLeave);

    return () => {
      el.removeEventListener("pointermove",   onMove);
      el.removeEventListener("pointerleave",  onLeave);
      el.removeEventListener("pointercancel", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxTilt, scale]);

  return ref;
}

export default useTilt;
