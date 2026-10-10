/* abdullahanxie hub interactions: every scroll and click does something.
   Ink cursor, click bursts, pencil scroll line, pins that drop in, self-drawing doodles, parallax,
   scroll-speed marquee, draggable polaroids, 3D tilt, magnetic buttons, lightbox, flip notes,
   hover film previews and click-to-load YouTube. Respects prefers-reduced-motion. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const COLORS = ["#c4553a", "#e3a62f", "#7f9170", "#7fa7c4", "#e9b4a6", "#6b4e71"];

  /* ---------- YouTube: click to load the player ---------- */
  $$("a.yt[data-yt]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&rel=0`;
    f.title = a.getAttribute("aria-label") || "YouTube video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
    a.replaceWith(f);
  }));

  /* ---------- pencil line that draws as you scroll ---------- */
  const pencil = document.createElement("div");
  pencil.className = "pencil";
  pencil.innerHTML = '<svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6 C 120 1, 240 11, 360 6 S 600 1, 720 6 S 900 11, 1000 5" pathLength="1"/></svg>';
  document.body.appendChild(pencil);
  const pencilPath = pencil.querySelector("path");

  /* ---------- pins drop in, doodles draw themselves ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  $$(".pin, .polaroid, .stat, .linkpins a, .note, .board-head, .doodle, .notebook, .player").forEach((el, i) => {
    el.classList.add("reveal"); el.style.setProperty("--d", `${(i % 6) * 70}ms`);
    if (reduce) el.classList.add("in"); else io.observe(el);
  });

  /* ---------- numbers count up when scrolled into view ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = performance.now();
    if (reduce) { el.textContent = pre + to + suf; return; }
    (function tick(t) { const k = clamp((t - t0) / 1400, 0, 1), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
      el.textContent = pre + v + suf; if (k < 1) requestAnimationFrame(tick); })(t0);
  }), { threshold: .6 });
  $$("[data-count]").forEach(el => cio.observe(el));

  /* ---------- scroll: pencil progress, parallax, marquee speed, velocity skew ---------- */
  const para = $$("[data-speed]");
  const marquees = $$(".marquee-track");
  let lastY = scrollY, vel = 0, mx = 0;
  function onFrame() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    vel += ((y - lastY) - vel) * .18; lastY = y;
    pencilPath.style.strokeDashoffset = 1 - clamp(y / Math.max(1, max), 0, 1);
    if (y >= max - 4) $$(".reveal:not(.in)").forEach(el => { el.classList.add("in"); io.unobserve(el); });
    if (!reduce) {
      para.forEach(el => {
        const r = el.getBoundingClientRect(), c = r.top + r.height / 2 - innerHeight / 2;
        el.style.translate = `0 ${(-c * (+el.dataset.speed)).toFixed(1)}px`;
      });
      mx -= 0.6 + Math.abs(vel) * 0.35;
      marquees.forEach(t => { const w = t.scrollWidth / 2; t.style.transform = `translateX(${(mx % w).toFixed(1)}px)`; });
      document.documentElement.style.setProperty("--skew", `${clamp(vel * -.06, -3, 3).toFixed(2)}deg`);
    }
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  /* ---------- ink cursor ---------- */
  if (fine && !reduce) {
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cur-dot"; ring.className = "cur-ring"; ring.innerHTML = "<span></span>";
    document.body.append(dot, ring); document.documentElement.classList.add("has-cursor");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
    (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    const label = ring.querySelector("span");
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("[data-cursor], a, button, summary, .pin, .polaroid, .note");
      ring.classList.toggle("big", !!t);
      label.textContent = t ? (t.dataset.cursor || (t.matches(".polaroid[data-drag]") ? "drag" : t.matches("a.yt") ? "play" : t.matches(".note") ? "flip" : t.matches("[data-lightbox]") ? "view" : t.matches("a") ? "open" : "")) : "";
    });
    addEventListener("pointerdown", () => ring.classList.add("press"));
    addEventListener("pointerup", () => ring.classList.remove("press"));
  }

  /* ---------- every click: a burst of paper scraps and ink ---------- */
  if (!reduce) addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("i"); s.className = "scrap";
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 70;
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      s.style.background = COLORS[i % COLORS.length];
      s.style.setProperty("--tx", `${Math.cos(a) * d}px`); s.style.setProperty("--ty", `${Math.sin(a) * d + 30}px`);
      s.style.setProperty("--r", `${(Math.random() - .5) * 540}deg`);
      if (i % 3 === 0) s.classList.add("round");
      document.body.appendChild(s); setTimeout(() => s.remove(), 900);
    }
  }, { passive: true });

  /* ---------- draggable, throwable polaroids ---------- */
  $$(".polaroid[data-drag]").forEach(el => {
    let sx, sy, ox = 0, oy = 0, vx = 0, vy = 0, lx, ly, dragging = false, moved = false, rot = parseFloat(el.dataset.rot || 0), raf;
    let z = 10;
    const apply = () => { el.style.translate = `${ox}px ${oy}px`; el.style.rotate = `${rot}deg`; };
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      dragging = true; moved = false; cancelAnimationFrame(raf);
      sx = e.clientX - ox; sy = e.clientY - oy; lx = e.clientX; ly = e.clientY;
      el.setPointerCapture(e.pointerId); el.classList.add("dragging");
      el.style.zIndex = String(window.__z = (window.__z || 20) + 1);
    });
    el.addEventListener("pointermove", e => {
      if (!dragging) return;
      vx = e.clientX - lx; vy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      ox = e.clientX - sx; oy = e.clientY - sy; if (Math.abs(vx) + Math.abs(vy) > 2) moved = true;
      rot = clamp(rot + vx * .15, -18, 18); apply();
    });
    const end = () => {
      if (!dragging) return; dragging = false; el.classList.remove("dragging");
      (function glide() { vx *= .92; vy *= .92; ox += vx; oy += vy; rot *= .97; apply(); if (Math.abs(vx) + Math.abs(vy) > .3) raf = requestAnimationFrame(glide); })();
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    el.addEventListener("dragstart", e => e.preventDefault());
  });

  /* ---------- 3D tilt with glare on pins ---------- */
  if (fine && !reduce) $$(".pin, .linkpins a, .stat").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`); el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${((px + .5) * 100).toFixed(1)}%`); el.style.setProperty("--gy", `${((py + .5) * 100).toFixed(1)}%`);
      el.classList.add("tilting");
    });
    el.addEventListener("pointerleave", () => { el.classList.remove("tilting"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$(".btn, .nav a, .ytplay").forEach(el => {
    el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); el.style.translate = `${((e.clientX - r.left - r.width / 2) * .25).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .35).toFixed(1)}px`; });
    el.addEventListener("pointerleave", () => { el.style.translate = "0 0"; });
  });

  /* ---------- sticky notes flip ---------- */
  $$(".note[data-back]").forEach(n => {
    const front = n.innerHTML;
    n.setAttribute("role", "button"); n.tabIndex = 0;
    const flip = () => { n.classList.toggle("flipped"); n.innerHTML = n.classList.contains("flipped") ? n.dataset.back : front; };
    n.addEventListener("click", flip); n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });

  /* ---------- film pins preview on hover ---------- */
  if (fine) $$(".pin[data-loop]").forEach(p => {
    const box = p.querySelector(".img"); let v;
    p.addEventListener("pointerenter", () => {
      if (!v) { v = document.createElement("video"); v.src = p.dataset.loop; v.muted = true; v.loop = true; v.playsInline = true; v.className = "loop"; box.appendChild(v); }
      v.play().then(() => p.classList.add("playing")).catch(() => {});
    });
    p.addEventListener("pointerleave", () => { if (v) { v.pause(); p.classList.remove("playing"); } });
  });

  /* ---------- lightbox for photos ---------- */
  const shots = $$("[data-lightbox]");
  if (shots.length) {
    const lb = document.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button class="lb-x" aria-label="Close">×</button><button class="lb-prev" aria-label="Previous">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    const img = lb.querySelector("img"), cap = lb.querySelector("figcaption"); let at = 0;
    const show = i => { at = (i + shots.length) % shots.length; const s = shots[at]; const im = s.querySelector("img");
      img.src = s.dataset.lightbox || im.src; img.alt = im.alt; cap.textContent = s.dataset.caption || im.alt; };
    shots.forEach((s, i) => s.addEventListener("click", e => { e.preventDefault(); show(i); lb.classList.add("open"); }));
    lb.addEventListener("click", e => { if (e.target === lb || e.target.matches(".lb-x")) lb.classList.remove("open"); });
    lb.querySelector(".lb-prev").addEventListener("click", e => { e.stopPropagation(); show(at - 1); });
    lb.querySelector(".lb-next").addEventListener("click", e => { e.stopPropagation(); show(at + 1); });
    addEventListener("keydown", e => { if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open"); if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
  }
})();
