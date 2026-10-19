/* Neon paint burst, the look of the Hanxie visual tests: paint strokes and laser lines radiating from a centre and drifting
   outward. Used as an ambient background: <canvas class="burst" data-seed="7" data-cx=".5" data-cy=".5"></canvas>.
   Runs only while on screen; a single still frame when the visitor prefers reduced motion. */
(() => {
  const PAL = ["#ff2fd0", "#29e6ff", "#ffe14d", "#4dff7a", "#ff3b3b", "#ffffff", "#8a5cff", "#ff8a1f"];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

  function setup(cv) {
    const r = rng(+(cv.dataset.seed || 7)), N = +(cv.dataset.n || 1300), g = cv.getContext("2d");
    const S = Array.from({ length: N }, () => {
      const fine = r() < .45;                              // thin long streaks + fat paint strokes, like the video
      return { a: r() * Math.PI * 2, d: r(), v: .03 + r() * .08, len: fine ? .08 + r() * .3 : .05 + r() * r() * .2,
        w: fine ? .35 + r() * .6 : 1.4 + r() * r() * 11, c: PAL[Math.floor(r() * r() * PAL.length)], al: .55 + r() * .45,
        curve: (r() - .5) * .04, dot: !fine && r() < .1 };
    });
    const L = Array.from({ length: 34 }, () => ({ a: r() * Math.PI * 2, o: (r() - .5) * .5, c: PAL[Math.floor(r() * PAL.length)], al: .15 + r() * .35, sp: (r() - .5) * .04 }));
    let W = 0, H = 0;
    const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = Math.round(cv.clientWidth * dpr); H = cv.height = Math.round(cv.clientHeight * dpr); };
    size(); addEventListener("resize", size);
    function draw(t) {
      const cx = W * +(cv.dataset.cx || .5), cy = H * +(cv.dataset.cy || .5), R = Math.hypot(W, H) * .62, rot = t * .012;
      g.globalCompositeOperation = "source-over"; g.fillStyle = "#060608"; g.fillRect(0, 0, W, H);
      const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * .16); core.addColorStop(0, "rgba(0,0,0,.95)"); core.addColorStop(1, "rgba(0,0,0,0)");
      g.globalCompositeOperation = "lighter";
      for (const l of L) {                                   // laser lines crossing the frame
        const a = l.a + rot * 2 + t * l.sp, ox = Math.cos(a + 1.57) * l.o * W, oy = Math.sin(a + 1.57) * l.o * H;
        g.strokeStyle = l.c; g.globalAlpha = l.al * (.6 + .4 * Math.sin(t * 1.3 + l.a * 5)); g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx + ox - Math.cos(a) * R * 1.4, cy + oy - Math.sin(a) * R * 1.4); g.lineTo(cx + ox + Math.cos(a) * R * 1.4, cy + oy + Math.sin(a) * R * 1.4); g.stroke();
      }
      for (const s of S) {                                   // paint strokes flying outward
        const d = (s.d + t * s.v) % 1, rr = .04 + d * d * 1.05, a = s.a + rot;
        const r0 = rr * R, r1 = (rr + s.len * (.4 + d)) * R, w = s.w * (.35 + d * 1.6) * (W / 1100);
        const ca = Math.cos(a), sa = Math.sin(a), na = a + s.curve;
        g.globalAlpha = s.al * Math.min(1, d * 6) * (1 - Math.max(0, d - .85) / .15);
        g.fillStyle = s.c;
        if (s.dot) { g.beginPath(); g.arc(cx + ca * r1, cy + sa * r1, w * 1.4, 0, 7); g.fill(); continue; }
        g.beginPath();                                       // tapered teardrop stroke
        g.moveTo(cx + ca * r0, cy + sa * r0);
        g.quadraticCurveTo(cx + Math.cos(na) * (r0 + r1) / 2 - sa * w, cy + Math.sin(na) * (r0 + r1) / 2 + ca * w, cx + ca * r1, cy + sa * r1);
        g.quadraticCurveTo(cx + Math.cos(na) * (r0 + r1) / 2 + sa * w, cy + Math.sin(na) * (r0 + r1) / 2 - ca * w, cx + ca * r0, cy + sa * r0);
        g.fill();
      }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = core; g.fillRect(0, 0, W, H);
    }
    let on = false, t0 = performance.now(), raf = 0;
    let last = 0;                                            // ~30 fps is plenty for an ambient background
    const loop = now => { if (now - last > 32) { last = now; draw((now - t0) / 1000); } if (on) raf = requestAnimationFrame(loop); };
    if (still) { draw(4); return; }
    new IntersectionObserver(es => es.forEach(e => { on = e.isIntersecting; if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } }), { rootMargin: "100px" }).observe(cv);
    draw(4);
  }
  const go = () => document.querySelectorAll("canvas.burst").forEach(setup);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
  // art videos: tap the frame to switch the sound on/off
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-sound]"); if (!b) return;
    const v = b.parentElement.querySelector("video"); v.muted = !v.muted; if (!v.muted) { v.currentTime = 0; v.play(); }
    b.textContent = v.muted ? "SOUND ON" : "SOUND OFF";
  });
})();
