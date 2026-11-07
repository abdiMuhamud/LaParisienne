// La Parisienne — menu, bag, checkout and reservations.
// Everything is handed off to the chosen branch's WhatsApp, the same flow as the 9ONE Café site.
import { MENU, BRANCHES, money, OPEN_FROM, OPEN_UNTIL } from "./data.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const layout = () => document.dispatchEvent(new Event("lp:layout"));
const branchById = (id) => BRANCHES.find((b) => b.id === id);
const fmtPhone = (p) => p.replace(/(\d{3})(\d{4})/, "$1 $2");
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const niceDate = (iso) => iso ? new Date(iso + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
const validPhone = (p) => p.replace(/[^\d]/g, "").length >= 7;
const openWA = (number, lines) => {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.filter((l) => l !== null && l !== undefined).join("\n"))}`;
  window.open(url, "_blank", "noopener");
  return url;
};
const slots = () => {
  const out = [];
  for (let h = OPEN_FROM; h < OPEN_UNTIL; h++) for (const m of [0, 30]) out.push(`${String(h).padStart(2, "0")}:${m ? "30" : "00"}`);
  return out;
};
// First slot at least an hour from now when the date is today.
const nextSlot = (iso) => {
  const all = slots();
  if (iso && iso !== today()) return all[0];
  const d = new Date(); const mins = d.getHours() * 60 + d.getMinutes() + 60;
  return all.find((s) => +s.slice(0, 2) * 60 + +s.slice(3) >= mins) || all[all.length - 1];
};

/* ------------------------------------------------------------ catalogue */
const ITEMS = new Map();
for (const cat of MENU) for (const [name, price, desc = ""] of cat.items) {
  ITEMS.set(name, { name, desc, cat: cat.id, catName: cat.name, prices: Array.isArray(price) ? price : [price], sizes: Array.isArray(price) ? cat.sizes : null });
}

/* ------------------------------------------------------------ state */
const state = {
  bag: store.get("lp.bag", []), // [{key, name, option, price, qty}]
  mode: store.get("lp.mode", "delivery"),
  branch: store.get("lp.branch", ""),
  details: store.get("lp.details", { when: "asap", pay: "Cash" }),
  note: "",
  location: null,
  step: "bag",
  sentUrl: "",
};
const save = () => { store.set("lp.bag", state.bag); store.set("lp.mode", state.mode); store.set("lp.branch", state.branch); };
const count = () => state.bag.reduce((a, l) => a + l.qty, 0);
const total = () => state.bag.reduce((a, l) => a + l.qty * l.price, 0);

/* ------------------------------------------------------------ menu render */
const tabs = $("[data-menu-tabs]");
const list = $("[data-menu-list]");
const search = $("[data-menu-search]");
let activeCat = "all";

tabs.innerHTML = [`<button role="tab" aria-selected="true" data-cat="all">Everything</button>`, ...MENU.map((c) => `<button role="tab" aria-selected="false" data-cat="${c.id}">${c.name}</button>`)].join("");

function renderMenu() {
  const q = search.value.trim().toLowerCase();
  const html = MENU.filter((c) => activeCat === "all" || c.id === activeCat).map((c) => {
    const items = c.items.filter(([n, , d = ""]) => !q || n.toLowerCase().includes(q) || d.toLowerCase().includes(q));
    if (!items.length) return "";
    return `<section class="mcat">
      <header class="mcat__head"><h3>${c.name}</h3><span>${c.tag}</span></header>
      <div class="mcat__grid">${items.map(([n, p, d = ""]) => `
        <div class="mitem">
          <div class="mitem__top"><span class="mitem__name">${esc(n)}</span><span class="mitem__dots"></span><span class="mitem__price">${Array.isArray(p) ? "from " + money(p[0]) : money(p)}</span></div>
          ${d ? `<span class="mitem__desc">${esc(d)}</span>` : ""}
          <button class="mitem__add" type="button" data-add="${esc(n)}" aria-label="Add ${esc(n)}">+</button>
        </div>`).join("")}</div>
    </section>`;
  }).join("");
  list.innerHTML = html || `<p class="menu__empty">Nothing matches “${esc(q)}” — try another word, or ask us on WhatsApp.</p>`;
  layout();
}
tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cat]");
  if (!b) return;
  activeCat = b.dataset.cat;
  $$("button", tabs).forEach((t) => t.setAttribute("aria-selected", t === b));
  renderMenu();
});
search.addEventListener("input", renderMenu);
renderMenu();

/* ------------------------------------------------------------ chrome: fab, drawer, options */
document.body.insertAdjacentHTML("beforeend", `
  <button class="bagfab" type="button" data-open-bag aria-label="Open your order" hidden>
    <span class="bagfab__count" data-fab-count>0</span>
    <span class="bagfab__label">Your order</span>
    <span class="bagfab__total" data-fab-total>${money(0)}</span>
  </button>
  <div class="scrim" hidden></div>
  <aside class="bag" role="dialog" aria-modal="true" aria-label="Your order" aria-hidden="true">
    <header class="bag__head">
      <i class="mlogo"></i>
      <button class="bag__close" type="button" aria-label="Close"><span></span><span></span></button>
    </header>
    <ol class="bag__steps" aria-hidden="true">
      <li data-s="bag"><i>1</i>Order</li><li data-s="details"><i>2</i>Details</li><li data-s="review"><i>3</i>Confirm</li>
    </ol>
    <div class="bag__body" data-lenis-prevent></div>
    <footer class="bag__foot"></footer>
  </aside>
  <div class="opt" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="opt__card">
      <p class="opt__cat"></p>
      <h3 class="opt__name"></h3>
      <p class="opt__desc"></p>
      <div class="opt__chips" role="radiogroup" aria-label="Size"></div>
      <div class="opt__row">
        <div class="qty"><button type="button" data-oq="-1" aria-label="Less">−</button><b>1</b><button type="button" data-oq="1" aria-label="More">+</button></div>
        <button class="btn btn--gold opt__add" type="button">Add</button>
      </div>
      <button class="opt__close" type="button" aria-label="Close"><span></span><span></span></button>
    </div>
  </div>
  <div class="toast" role="status" aria-live="polite"></div>
`);

const fab = $(".bagfab"), scrim = $(".scrim"), bag = $(".bag"), body = $(".bag__body"), foot = $(".bag__foot");
const opt = $(".opt"), toast = $(".toast");
let toastT;
const say = (msg) => { toast.textContent = msg; toast.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("show"), 2200); };

function syncCounters() {
  const n = count();
  $$("[data-bag-count]").forEach((el) => (el.textContent = n));
  $$(".nav__bag").forEach((el) => el.classList.toggle("has-items", n > 0));
  $("[data-fab-count]").textContent = n;
  $("[data-fab-total]").textContent = money(total());
  fab.hidden = n === 0 || bag.classList.contains("open");
}

function addToBag(name, option = "", qty = 1, price) {
  const it = ITEMS.get(name);
  if (!it) return;
  const p = price ?? it.prices[0];
  const key = name + "|" + option;
  const line = state.bag.find((l) => l.key === key);
  if (line) line.qty += qty; else state.bag.push({ key, name, option, price: p, qty });
  save(); syncCounters();
  $$(".nav__bag").forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
  say(`${qty} × ${name}${option ? " (" + option.split(" ·")[0] + ")" : ""} added`);
  if (bag.classList.contains("open")) renderStep();
}

/* options sheet (cake sizes) */
let optState = null;
function openOptions(name) {
  const it = ITEMS.get(name);
  optState = { name, idx: 0, qty: 1 };
  $(".opt__cat", opt).textContent = it.catName;
  $(".opt__name", opt).textContent = it.name;
  $(".opt__desc", opt).textContent = it.desc + " · Whole cakes are made to order — choose your pickup or delivery time at checkout.";
  renderOpt();
  opt.classList.add("open"); opt.setAttribute("aria-hidden", "false");
  window.lenis?.stop();
  setTimeout(() => $(".opt__chips button", opt)?.focus(), 50);
}
function renderOpt() {
  const it = ITEMS.get(optState.name);
  $(".opt__chips", opt).innerHTML = it.sizes.map((s, i) => `<button type="button" role="radio" aria-checked="${i === optState.idx}" data-oi="${i}"><b>${s.split(" · ")[0]}</b><span>${s.split(" · ")[1] || ""}</span><em>${money(it.prices[i])}</em></button>`).join("");
  $(".qty b", opt).textContent = optState.qty;
  $(".opt__add", opt).textContent = `Add · ${money(it.prices[optState.idx] * optState.qty)}`;
}
function closeOptions() { opt.classList.remove("open"); opt.setAttribute("aria-hidden", "true"); if (!bag.classList.contains("open")) window.lenis?.start(); }
opt.addEventListener("click", (e) => {
  if (e.target === opt || e.target.closest(".opt__close")) return closeOptions();
  const c = e.target.closest("[data-oi]"); if (c) { optState.idx = +c.dataset.oi; renderOpt(); }
  const q = e.target.closest("[data-oq]"); if (q) { optState.qty = Math.max(1, optState.qty + +q.dataset.oq); renderOpt(); }
  if (e.target.closest(".opt__add")) {
    const it = ITEMS.get(optState.name);
    addToBag(it.name, it.sizes[optState.idx], optState.qty, it.prices[optState.idx]);
    closeOptions();
  }
});

/* global add buttons */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    const name = add.dataset.add;
    if (ITEMS.get(name)?.sizes) return openOptions(name);
    addToBag(name);
    add.classList.add("added");
    setTimeout(() => add.classList.remove("added"), 900);
    return;
  }
  if (e.target.closest("[data-open-bag]")) openBag();
});

/* ------------------------------------------------------------ drawer */
function openBag() {
  if (state.step === "sent") state.step = "bag";
  bag.classList.add("open"); bag.setAttribute("aria-hidden", "false");
  scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add("show"));
  window.lenis?.stop(); document.documentElement.classList.add("bag-open");
  renderStep(); syncCounters();
}
function closeBag() {
  bag.classList.remove("open"); bag.setAttribute("aria-hidden", "true");
  scrim.classList.remove("show"); setTimeout(() => (scrim.hidden = true), 500);
  window.lenis?.start(); document.documentElement.classList.remove("bag-open");
  if (state.step === "sent") { state.step = "bag"; }
  syncCounters();
}
scrim.addEventListener("click", closeBag);
$(".bag__close").addEventListener("click", closeBag);
addEventListener("keydown", (e) => { if (e.key === "Escape") { if (opt.classList.contains("open")) closeOptions(); else if (bag.classList.contains("open")) closeBag(); } });

function setStep(s) { state.step = s; renderStep(); body.scrollTop = 0; }
function renderStep() {
  $$(".bag__steps li").forEach((li) => {
    const order = ["bag", "details", "review", "sent"];
    li.classList.toggle("on", li.dataset.s === state.step);
    li.classList.toggle("done", order.indexOf(li.dataset.s) < order.indexOf(state.step));
  });
  ({ bag: renderBagStep, details: renderDetails, review: renderReview, sent: renderSent })[state.step]();
}

function renderBagStep() {
  if (!state.bag.length) {
    body.innerHTML = `<div class="empty"><i class="empty__tower"></i><h3>Your order is empty</h3><p>Add pastries, cakes or dishes from the menu — they’ll appear here.</p></div>`;
    foot.innerHTML = `<a class="btn btn--gold btn--block" href="#menu" data-close>Browse the menu</a>`;
    $("[data-close]", foot).addEventListener("click", closeBag);
    return;
  }
  body.innerHTML = `
    <h3 class="bag__title">Your order</h3>
    <ul class="lines">${state.bag.map((l, i) => `
      <li class="line-item">
        <div class="line-item__info"><b>${esc(l.name)}</b>${l.option ? `<span>${esc(l.option)}</span>` : ""}<em>${money(l.price)}</em></div>
        <div class="qty qty--sm"><button type="button" data-lq="${i}" data-d="-1" aria-label="Less">−</button><b>${l.qty}</b><button type="button" data-lq="${i}" data-d="1" aria-label="More">+</button></div>
      </li>`).join("")}</ul>
    <label class="field field--note"><span class="field__label">Note for the kitchen <i>(optional)</i></span><textarea rows="2" data-note placeholder="No onions, extra sauce, candles on the cake…">${esc(state.note)}</textarea></label>`;
  foot.innerHTML = `<div class="sum"><span>Subtotal</span><b>${money(total())}</b></div><button class="btn btn--gold btn--block" type="button" data-next>Continue</button>`;
  $("[data-note]", body).addEventListener("input", (e) => (state.note = e.target.value));
  $("[data-next]", foot).addEventListener("click", () => setStep("details"));
}
body.addEventListener("click", (e) => {
  const q = e.target.closest("[data-lq]");
  if (!q) return;
  const l = state.bag[+q.dataset.lq];
  l.qty += +q.dataset.d;
  if (l.qty <= 0) state.bag.splice(+q.dataset.lq, 1);
  save(); syncCounters(); renderStep();
});

function renderDetails() {
  const d = state.details;
  const m = state.mode;
  body.innerHTML = `
    <h3 class="bag__title">How would you like it?</h3>
    <div class="modes" role="radiogroup">
      ${[["delivery", "Delivery", "We bring it to you"], ["pickup", "Pickup", "Collect at the branch"], ["dine", "Dine-in", "Ready at your table"]].map(([k, t, s]) => `<button type="button" role="radio" aria-checked="${m === k}" data-mode="${k}"><b>${t}</b><span>${s}</span></button>`).join("")}
    </div>
    <div class="field"><span class="field__label">${m === "delivery" ? "Nearest branch" : "Branch"}</span>
      <div class="chips">${BRANCHES.map((b) => `<button type="button" class="chip" aria-pressed="${state.branch === b.id}" data-branch="${b.id}">${b.name}</button>`).join("")}</div>
    </div>
    <div class="grid2">
      <label class="field"><span class="field__label">Name</span><input name="name" autocomplete="name" value="${esc(d.name)}" placeholder="Full name" /></label>
      <label class="field"><span class="field__label">Phone</span><input name="phone" type="tel" autocomplete="tel" value="${esc(d.phone)}" placeholder="7-digit number" /></label>
    </div>
    ${m === "delivery" ? `
      <label class="field"><span class="field__label">Area</span><input name="area" value="${esc(d.area)}" placeholder="e.g. Brusubi Phase 2, Kololi, Bijilo" /></label>
      <label class="field"><span class="field__label">Address &amp; landmark</span><input name="address" value="${esc(d.address)}" placeholder="Street, compound, nearby landmark" /></label>
      <button type="button" class="locbtn ${state.location ? "ok" : ""}" data-loc>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></svg>
        <span>${state.location ? "Location added ✓" : "Share my location (optional)"}</span>
      </button>` : ""}
    ${m === "dine" ? `<label class="field"><span class="field__label">Table number <i>(if seated)</i></span><input name="table" value="${esc(d.table)}" placeholder="e.g. 7" /></label>` : ""}
    <div class="field"><span class="field__label">When</span>
      <div class="chips">
        <button type="button" class="chip" aria-pressed="${d.when !== "later"}" data-when="asap">As soon as possible</button>
        <button type="button" class="chip" aria-pressed="${d.when === "later"}" data-when="later">Schedule for later</button>
      </div>
    </div>
    ${d.when === "later" ? `<div class="grid2">
      <label class="field"><span class="field__label">Date</span><input name="date" type="date" min="${today()}" value="${esc(d.date || today())}" /></label>
      <label class="field"><span class="field__label">Time</span><select name="time">${slots().map((s) => `<option ${(d.time || nextSlot(d.date)) === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
    </div>` : ""}
    ${m !== "dine" ? `<div class="field"><span class="field__label">Payment</span>
      <div class="chips">${["Cash", "Wave", "Afrimoney", "QMoney"].map((p) => `<button type="button" class="chip" aria-pressed="${(d.pay || "Cash") === p}" data-pay="${p}">${p}</button>`).join("")}</div>
    </div>` : ""}
    <p class="formerr" role="alert" hidden></p>`;
  foot.innerHTML = `<div class="sum"><span>Subtotal</span><b>${money(total())}</b></div>
    <div class="foot2"><button class="btn btn--ghost" type="button" data-back>Back</button><button class="btn btn--gold" type="button" data-next>Review order</button></div>`;

  $$("input, select", body).forEach((el) => el.addEventListener("input", () => { d[el.name] = el.value; store.set("lp.details", d); el.classList.remove("invalid"); }));
  $("[data-back]", foot).addEventListener("click", () => setStep("bag"));
  $("[data-next]", foot).addEventListener("click", () => {
    const err = $(".formerr", body);
    const bad = [];
    if (!state.branch) bad.push("choose a branch");
    if (!d.name?.trim()) { bad.push("add your name"); $('[name="name"]', body).classList.add("invalid"); }
    if (!validPhone(d.phone || "")) { bad.push("add a valid phone number"); $('[name="phone"]', body).classList.add("invalid"); }
    if (state.mode === "delivery" && !d.area?.trim() && !state.location) { bad.push("tell us your area or share your location"); $('[name="area"]', body).classList.add("invalid"); }
    if (d.when === "later" && !d.date) d.date = today();
    if (d.when === "later" && !d.time) d.time = nextSlot(d.date);
    if (bad.length) { err.hidden = false; err.textContent = "Please " + bad.join(", ") + "."; return; }
    setStep("review");
  });
}
body.addEventListener("click", (e) => {
  const d = state.details;
  const t = e.target.closest("[data-mode],[data-branch],[data-when],[data-pay],[data-loc]");
  if (!t || state.step !== "details") return;
  if (t.dataset.mode) state.mode = t.dataset.mode;
  if (t.dataset.branch) state.branch = t.dataset.branch;
  if (t.dataset.when) d.when = t.dataset.when;
  if (t.dataset.pay) d.pay = t.dataset.pay;
  if (t.hasAttribute("data-loc")) {
    if (!navigator.geolocation) return say("Location isn’t available on this device");
    t.querySelector("span").textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(
      (p) => { state.location = { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }; renderStep(); },
      () => { t.querySelector("span").textContent = "Couldn’t get location — add your area instead"; },
      { enableHighAccuracy: true, timeout: 12000 }
    );
    return;
  }
  save(); store.set("lp.details", d); renderStep();
});

const modeLabel = { delivery: "🛵 Delivery", pickup: "🛍️ Pickup", dine: "🍽️ Dine-in" };
const whenText = (d) => d.when === "later" ? `${niceDate(d.date)} at ${d.time}` : "As soon as possible";

function renderReview() {
  const d = state.details, b = branchById(state.branch);
  body.innerHTML = `
    <h3 class="bag__title">Check & send</h3>
    <div class="review">
      <div class="review__row"><span>${modeLabel[state.mode]}</span><b>La Parisienne ${b.name}</b></div>
      <div class="review__row"><span>Name</span><b>${esc(d.name)} · ${esc(d.phone)}</b></div>
      ${state.mode === "delivery" ? `<div class="review__row"><span>Deliver to</span><b>${esc([d.area, d.address].filter(Boolean).join(", ") || "Shared location")}</b></div>` : ""}
      ${state.mode === "dine" && d.table ? `<div class="review__row"><span>Table</span><b>${esc(d.table)}</b></div>` : ""}
      <div class="review__row"><span>When</span><b>${whenText(d)}</b></div>
      ${state.mode !== "dine" ? `<div class="review__row"><span>Payment</span><b>${esc(d.pay || "Cash")}</b></div>` : ""}
    </div>
    <ul class="lines lines--review">${state.bag.map((l) => `<li><span>${l.qty} × ${esc(l.name)}${l.option ? ` <i>(${esc(l.option.split(" ·")[0])})</i>` : ""}</span><b>${money(l.qty * l.price)}</b></li>`).join("")}</ul>
    ${state.note ? `<p class="review__note">📝 ${esc(state.note)}</p>` : ""}
    <p class="rsmall">${state.mode === "delivery" ? "Any delivery fee is confirmed by our team before your order goes out. " : ""}Tapping <b>Send order</b> opens WhatsApp to La Parisienne ${b.name} with your order ready — just press send.</p>`;
  foot.innerHTML = `<div class="sum sum--total"><span>Total</span><b>${money(total())}${state.mode === "delivery" ? "<small> + delivery</small>" : ""}</b></div>
    <div class="foot2"><button class="btn btn--ghost" type="button" data-back>Back</button><button class="btn btn--wa" type="button" data-send><svg><use href="#ico-wa"/></svg> Send order</button></div>`;
  $("[data-back]", foot).addEventListener("click", () => setStep("details"));
  $("[data-send]", foot).addEventListener("click", sendOrder);
}

let orderNo = "";
function sendOrder() {
  const d = state.details, b = branchById(state.branch);
  orderNo = "LP" + Math.floor(1000 + Math.random() * 9000);
  const lines = [
    `🥐 *La Parisienne ${b.name} — New order #${orderNo}*`,
    ``,
    `*${modeLabel[state.mode]}*`,
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
  ];
  if (state.mode === "delivery") {
    if (d.area) lines.push(`Area: ${d.area}`);
    if (d.address) lines.push(`Address: ${d.address}`);
    if (state.location) lines.push(`Location: https://maps.google.com/?q=${state.location.lat},${state.location.lng}`);
  }
  if (state.mode === "dine" && d.table) lines.push(`Table: ${d.table}`);
  lines.push(`When: ${whenText(d)}`);
  if (state.mode !== "dine") lines.push(`Payment: ${d.pay || "Cash"}`);
  lines.push(``, `*Order*`, ...state.bag.map((l) => `${l.qty} × ${l.name}${l.option ? ` (${l.option})` : ""} — ${money(l.qty * l.price)}`));
  if (state.note) lines.push(``, `📝 ${state.note}`);
  lines.push(`--------------------`, `*Total: ${money(total())}*${state.mode === "delivery" ? " + delivery" : ""}`);
  state.sentUrl = openWA(b.whatsapp, lines);
  state.step = "sent";
  renderStep();
}

function renderSent() {
  const b = branchById(state.branch);
  const first = (state.details.name || "").split(" ")[0];
  body.innerHTML = `
    <div class="sent">
      <div class="sent__mark"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
      <h3>Merci${first ? ", " + esc(first) : ""}!</h3>
      <p>Order <b>#${orderNo}</b> is ready in WhatsApp — press <b>send</b> there and La Parisienne ${b.name} will confirm it and the timing right away.</p>
      <a class="btn btn--ghost btn--block" href="${state.sentUrl}" target="_blank" rel="noopener"><svg><use href="#ico-wa"/></svg> WhatsApp didn’t open? Tap here</a>
      <a class="sent__call" href="tel:+220${b.phone}">Or call ${b.name} · ${fmtPhone(b.phone)}</a>
    </div>`;
  foot.innerHTML = `<button class="btn btn--gold btn--block" type="button" data-new>Start a new order</button>`;
  $("[data-new]", foot).addEventListener("click", () => { state.bag = []; state.note = ""; save(); syncCounters(); closeBag(); });
}

syncCounters();

/* ------------------------------------------------------------ reservations & cake pre-orders */
const rSeg = $(".seg");
const forms = { table: $('[data-form="table"]'), cake: $('[data-form="cake"]') };
const rBranch = { table: "", cake: "" };

$$("[data-rtab]").forEach((b) => b.addEventListener("click", () => {
  const t = b.dataset.rtab;
  rSeg.dataset.active = t;
  $$("[data-rtab]").forEach((x) => x.setAttribute("aria-selected", x === b));
  Object.entries(forms).forEach(([k, f]) => (f.hidden = k !== t));
  layout();
}));

$$("[data-branch-chips]").forEach((wrap) => {
  const k = wrap.dataset.branchChips;
  wrap.innerHTML = BRANCHES.map((b) => `<button type="button" class="chip" aria-pressed="false" data-rb="${b.id}">${b.name}</button>`).join("");
  wrap.addEventListener("click", (e) => {
    const c = e.target.closest("[data-rb]"); if (!c) return;
    rBranch[k] = c.dataset.rb;
    $$(".chip", wrap).forEach((x) => x.setAttribute("aria-pressed", x === c));
  });
});

$$("[data-slots]").forEach((s) => {
  const def = s.closest('[data-form="cake"]') ? "12:00" : "19:00";
  s.innerHTML = slots().map((t) => `<option ${t === def ? "selected" : ""}>${t}</option>`).join("");
});
$$('.rform input[type="date"]').forEach((i) => { i.min = today(); i.value = today(); });
// Cakes need notice — default the cake date to two days out.
{ const d = new Date(); d.setDate(d.getDate() + 2); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); $('[data-form="cake"] [name="date"]').value = d.toISOString().slice(0, 10); }

const stepper = $(".stepper");
stepper.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]"); if (!b) return;
  const inp = $("input", stepper);
  inp.value = Math.min(40, Math.max(1, +inp.value + +b.dataset.step));
});

// Cake selector built from the whole-cakes menu
const cakeCat = MENU.find((c) => c.id === "cakes");
const cakeSel = $("[data-cake-select]"), sizeSel = $("[data-size-select]"), est = $("[data-cake-est]");
cakeSel.innerHTML = cakeCat.items.map(([n]) => `<option>${n}</option>`).join("") + `<option value="custom">Custom design (describe in theme)</option>`;
sizeSel.innerHTML = cakeCat.sizes.map((s, i) => `<option value="${i}">${s}</option>`).join("");
const updateEst = () => {
  const it = ITEMS.get(cakeSel.value);
  est.textContent = it ? `Guide price: ${money(it.prices[+sizeSel.value])} — final price confirmed on WhatsApp.` : "Custom designs are quoted on WhatsApp after we see your idea.";
};
cakeSel.addEventListener("change", updateEst); sizeSel.addEventListener("change", updateEst); updateEst();

function failForm(form, msg, fields = []) {
  const err = $(".rform__err", form);
  err.hidden = false; err.textContent = msg;
  fields.forEach((n) => form.elements[n]?.classList.add("invalid"));
}
$$(".rform").forEach((f) => f.addEventListener("input", (e) => { e.target.classList?.remove("invalid"); $(".rform__err", f).hidden = true; }));

forms.table.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = forms.table, v = Object.fromEntries(new FormData(f));
  const bad = [];
  if (!rBranch.table) bad.push("choose a branch");
  if (!v.date) bad.push("pick a date");
  if (!v.name.trim()) bad.push("add your name");
  if (!validPhone(v.phone)) bad.push("add a valid phone number");
  if (bad.length) return failForm(f, "Please " + bad.join(", ") + ".", [!v.name.trim() && "name", !validPhone(v.phone) && "phone"].filter(Boolean));
  const b = branchById(rBranch.table);
  openWA(b.whatsapp, [
    `🍽️ *La Parisienne ${b.name} — Table reservation*`,
    ``,
    `Date: ${niceDate(v.date)}`,
    `Time: ${v.time}`,
    `Guests: ${v.guests}`,
    v.occasion ? `Occasion: ${v.occasion}` : null,
    `Name: ${v.name.trim()}`,
    `Phone: ${v.phone}`,
    v.notes.trim() ? `Notes: ${v.notes.trim()}` : null,
    ``,
    `Please confirm my table. Merci!`,
  ]);
  say("Opening WhatsApp…");
});

forms.cake.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = forms.cake, v = Object.fromEntries(new FormData(f));
  const bad = [];
  if (!rBranch.cake) bad.push("choose where to collect");
  if (!v.date) bad.push("pick a date");
  if (!v.name.trim()) bad.push("add your name");
  if (!validPhone(v.phone)) bad.push("add a valid phone number");
  if (v.cake === "custom" && !v.theme.trim()) bad.push("describe your custom design");
  if (bad.length) return failForm(f, "Please " + bad.join(", ") + ".", [!v.name.trim() && "name", !validPhone(v.phone) && "phone", v.cake === "custom" && !v.theme.trim() && "theme"].filter(Boolean));
  const b = branchById(rBranch.cake);
  const it = ITEMS.get(v.cake);
  const size = cakeCat.sizes[+v.size];
  openWA(b.whatsapp, [
    `🎂 *La Parisienne ${b.name} — Cake pre-order*`,
    ``,
    `Cake: ${it ? it.name : "Custom design"}`,
    `Size: ${size}${it ? ` (guide ${money(it.prices[+v.size])})` : ""}`,
    `Needed: ${niceDate(v.date)} at ${v.time}`,
    v.message.trim() ? `Message on cake: "${v.message.trim()}"` : null,
    v.theme.trim() ? `Colours / theme: ${v.theme.trim()}` : null,
    `Name: ${v.name.trim()}`,
    `Phone: ${v.phone}`,
    ``,
    `Please confirm availability and price. Merci!`,
  ]);
  say("Opening WhatsApp…");
});
