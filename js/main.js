// La Parisienne — intro, smooth scroll and scroll choreography.
import "./order.js";
import { SHOWCASE, BRANCHES, MENU, money } from "./data.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined";
const root = document.documentElement;

/* ------------------------------------------------------------ content */
const priceOf = (name) => {
  for (const c of MENU) for (const [n, p] of c.items) if (n === name) return Array.isArray(p) ? `from ${money(p[0])}` : money(p);
  return "";
};
$("[data-showcase]").innerHTML = SHOWCASE.map((s, i) => `
  <article class="vcard">
    <img src="${s.img}" alt="${s.name}" loading="lazy" style="${s.zoom ? `--z:${s.zoom};--o:${s.origin}` : ""}" />
    <span class="vcard__no">${String(i + 1).padStart(2, "0")} / ${String(SHOWCASE.length).padStart(2, "0")}</span>
    <div class="vcard__body">
      <h3 class="vcard__name">${s.name}</h3>
      <p class="vcard__note">${s.note}</p>
      <div class="vcard__row">
        <span class="vcard__price">${priceOf(s.item)}</span>
        <button class="vcard__add" type="button" data-add="${s.item}">Add <span aria-hidden="true">+</span></button>
      </div>
    </div>
  </article>`).join("");

$("[data-branches]").innerHTML = BRANCHES.map((b, i) => `
  <article class="bcard" data-fade>
    <i class="bcard__tower" aria-hidden="true"></i>
    <span class="bcard__no">0${i + 1}</span>
    <h3>${b.name}</h3>
    <p class="bcard__area">${b.area}, The Gambia</p>
    <a class="bcard__phone" href="tel:+220${b.phone}"><small>Call or WhatsApp</small>${b.phone.replace(/(\d{3})(\d{4})/, "$1 $2")}</a>
    <div class="bcard__btns">
      <a class="btn btn--wa" href="https://wa.me/${b.whatsapp}?text=${encodeURIComponent(`Bonjour La Parisienne ${b.name}! `)}" target="_blank" rel="noopener"><svg><use href="#ico-wa"/></svg>WhatsApp</a>
      <a class="btn btn--ghost" href="${b.map}" target="_blank" rel="noopener">Directions</a>
    </div>
  </article>`).join("");

$("[data-year]").textContent = new Date().getFullYear();

// Split hero word into characters (both layers must match exactly).
$$(".hero__word").forEach((w) => {
  const span = w.querySelector("span");
  const txt = span.textContent;
  span.innerHTML = [...txt].map((c) => w.classList.contains("hero__word--back") ? `<span class="chw"><span class="ch">${c}</span></span>` : `<span class="ch">${c}</span>`).join("");
});
// Split headings into lines at <br>.
$$(".reveal-lines").forEach((h) => {
  h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="line"><span>${l.trim()}</span></span>`).join("");
});

// Stage width var keeps the front/back hero layers pixel-aligned (scrollbars included).
const hero = $(".hero");
const setStage = () => hero.style.setProperty("--sw", hero.clientWidth + "px");
setStage();
addEventListener("resize", setStage);

/* ------------------------------------------------------------ nav */
const nav = $(".nav");
const burger = $(".nav__burger");
const mnav = $(".mnav");
const toggleMenu = (open) => {
  burger.setAttribute("aria-expanded", open);
  mnav.classList.toggle("is-open", open);
  mnav.setAttribute("aria-hidden", !open);
  open ? lenis?.stop() : lenis?.start();
};
burger.addEventListener("click", () => toggleMenu(burger.getAttribute("aria-expanded") !== "true"));
$$(".mnav a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

let lastY = 0;
const onScroll = (y) => {
  nav.classList.toggle("is-scrolled", y > 40);
  const hide = y > innerHeight * 0.9 && y > lastY + 2 && !mnav.classList.contains("is-open");
  if (y < lastY - 2 || y < innerHeight * 0.9) nav.classList.remove("is-hidden");
  else if (hide) nav.classList.add("is-hidden");
  lastY = y;
};

/* ------------------------------------------------------------ smooth scroll */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  window.lenis = lenis;
  lenis.on("scroll", ({ scroll }) => onScroll(scroll));
} else {
  addEventListener("scroll", () => onScroll(scrollY), { passive: true });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  const el = id === "#top" ? document.body : $(id);
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(id === "#top" ? 0 : el, { offset: id === "#menu" ? -40 : 0, duration: 1.6 });
  else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
});

/* ------------------------------------------------------------ motion */
if (!hasGsap) {
  $(".intro")?.remove();
} else {
  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;
  if (lenis) {
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- hero entrance (runs after intro) ---------- */
  const heroIn = () => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(".hero__arch", { clipPath: "inset(48% 0% 48% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" }, 0)
      .fromTo(".hero__archimg img", { scale: 1.45 }, { scale: 1.06, duration: 2.2 }, 0.1)
      .fromTo(".hero__word--back .ch", { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.06 }, 0.45)
      .fromTo(".hero__word--front .ch", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.06 }, 0.45)
      .fromTo(".hero__kicker span", { yPercent: 110 }, { yPercent: 0, duration: 1.1 }, 0.8)
      .fromTo(".hero__menu", { opacity: 0 }, { opacity: 1, duration: 1 }, 1.2)
      .fromTo([".hero__copy", ".hero__stats", ".ring", ".nav"], { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 1.0);
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, from = +(el.dataset.from || 0), suf = el.dataset.suffix || "";
      const o = { v: from };
      tl.to(o, { v: end, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v) + suf) }, 1.1);
    });
    return tl;
  };

  /* ---------- intro: the logo spins in and assembles ---------- */
  const intro = $(".intro");
  const runIntro = () => {
    root.classList.add("is-loading");
    lenis?.stop();
    gsap.set(".nav", { opacity: 0 });
    gsap.set([".hero__word .ch", ".hero__kicker span"], { yPercent: 110 });
    gsap.set(".hero__arch", { clipPath: "inset(48% 0% 48% 0%)" });
    gsap.set([".hero__copy", ".hero__stats", ".ring"], { opacity: 0 });

    const word = ".lplogo__word", tower = ".lplogo__tower", left = ".lplogo__left", right = ".lplogo__right";
    const fills = [".lplogo__l", ".lplogo__banner"];
    gsap.set(word, { xPercent: 15.4 });
    gsap.set(tower, { rotationY: -900, scale: 2.3, opacity: 0, filter: "blur(12px)" });
    gsap.set(left, { clipPath: "inset(0% 0% 0% 32%)" });
    gsap.set(right, { clipPath: "inset(0% 58.7% 0% 0%)" });
    gsap.set(".lplogo__banner", { clipPath: "inset(0% 50% 0% 50%)" });

    const done = () => { if (!intro.isConnected) return; intro.remove(); root.classList.remove("is-loading"); lenis?.start(); ST.refresh(); };
    const tl = gsap.timeline();
    tl.to(".intro__glow", { opacity: 1, scale: 1.1, duration: 2.4, ease: "sine.out" }, 0)
      .to(tower, { opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" }, 0.1)
      .to(tower, { rotationY: 0, duration: 2.2, ease: "expo.out" }, 0.1)
      .to(tower, { scale: 1, duration: 2.0, ease: "power3.inOut" }, 0.1)
      .to(word, { xPercent: 0, duration: 1.25, ease: "expo.inOut" }, 1.2)
      .to([left, right], { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut" }, 1.3)
      .to(".lplogo__banner", { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.out" }, 1.95)
      .to(fills, { backgroundPosition: "0% 0", duration: 1.6, ease: "power2.inOut" }, 1.9)
      .to(".intro__since span", { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power3.out" }, 2.2)
      .addLabel("exit", 3.5)
      .to(".intro__stage", { scale: 0.9, opacity: 0, filter: "blur(6px)", duration: 0.75, ease: "power3.in" }, "exit")
      .to(".intro__skip", { opacity: 0, duration: 0.3 }, "exit")
      .to(".intro__glow", { opacity: 0, duration: 0.6 }, "exit")
      .to(".intro__panel--top", { yPercent: -100, duration: 1.15, ease: "expo.inOut" }, "exit+=0.45")
      .to(".intro__panel--bottom", { yPercent: 100, duration: 1.15, ease: "expo.inOut" }, "exit+=0.45")
      .add(heroIn(), "exit+=0.75")
      .call(done, null, "exit+=1.65");
    gsap.set(".intro__since span", { y: 12 });
    $(".intro__skip").addEventListener("click", () => { if (tl.time() < tl.labels.exit) tl.seek("exit"); });
  };

  if (reduced) { intro.remove(); }
  else runIntro();

  /* ---------- hero parallax: arch drifts, letters stay layered ---------- */
  gsap.to(hero, {
    "--py": "150px", "--wy": "50px", ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero__archimg img", { scale: 1.22, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".ring svg", { rotate: "+=280", ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 } });

  /* ---------- headings ---------- */
  $$(".reveal-lines").forEach((h) => {
    gsap.from(h.querySelectorAll(".line > span"), {
      yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: h, start: "top 85%" },
    });
  });
  const fadeIn = (sel, opts = {}) => $$(sel).forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: "expo.out", ...opts, scrollTrigger: { trigger: el, start: "top 88%" } }));
  fadeIn(".vitrine__lede, .story__copy > p:not(.eyebrow), .menu__lede, .reserve__fine, .eyebrow");
  gsap.from(".story__points li", { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".story__points", start: "top 85%" } });
  gsap.from(".bcard", { y: 60, opacity: 0, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".visit__grid", start: "top 82%" } });
  gsap.from(".seg, .rform:not([hidden])", { y: 30, opacity: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".reserve__panel", start: "top 70%" } });

  /* ---------- story: layered parallax ---------- */
  gsap.fromTo(".story__year span:first-child", { xPercent: -12 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: ".story", scrub: true } });
  gsap.fromTo(".story__year span:last-child", { xPercent: 12 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: ".story", scrub: true } });
  $$(".story__img img, .reserve__media img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: img.parentElement, scrub: true } });
  });
  gsap.fromTo(".story__img--a", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".story__media", start: "top 75%" } });
  gsap.fromTo(".story__img--b", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".story__media", start: "top 60%" } });

  /* ---------- vitrine: pinned horizontal glide on desktop ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const rail = $(".vitrine__rail");
    const pin = $(".vitrine__pin");
    const amount = () => Math.max(0, rail.scrollWidth - pin.clientWidth);
    const tween = gsap.to(rail, {
      x: () => -amount(), ease: "none",
      scrollTrigger: {
        trigger: pin, pin: true, scrub: 1, start: "top top", end: () => "+=" + amount(), invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(".vitrine__progress i", { scaleX: self.progress }),
      },
    });
    $$(".vcard").forEach((card) => {
      gsap.fromTo(card.querySelector("img"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
    gsap.from(".vcard", { x: 160, opacity: 0, rotateY: -14, duration: 1.4, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: pin, start: "top 70%" } });
  });

  /* ---------- active nav link ---------- */
  const links = $$(".nav__pill a");
  ["#top", "#vitrine", "#menu", "#reserve", "#visit"].forEach((id) => {
    const el = id === "#top" ? hero : $(id);
    ST.create({
      trigger: el, start: "top 45%", end: "bottom 45%",
      onToggle: (s) => s.isActive && links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id)),
    });
  });

  // Menu re-renders change page height; keep triggers accurate.
  document.addEventListener("lp:layout", () => ST.refresh());
  addEventListener("load", () => ST.refresh());
}
