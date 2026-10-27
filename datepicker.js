/* Repair Desk — انتخاب‌گر تاریخ شمسی (بدون وابستگی، آفلاین)
   هر ورودی با کلاس .jalali-date یک آیکون تقویم می‌گیرد و با کلیک/فوکوس یک تقویم شمسی باز می‌شود.
   مقدار نهایی به‌شکل 1405/08/04 در ورودی نوشته می‌شود (تایپ دستی هم همچنان ممکن است). */
(() => {
"use strict";
const div = (a, b) => ~~(a / b), mod = (a, b) => a - ~~(a / b) * b;
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function jalCal(jy) {
  const bl = BREAKS.length, gy = jy + 621; let leapJ = -14, jp = BREAKS[0], jm, jump = 0, n, i;
  if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error("سال نامعتبر");
  for (i = 1; i < bl; i++) { jm = BREAKS[i]; jump = jm - jp; if (jy < jm) break; leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
  n = jy - jp; leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150, march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4); if (leap === -1) leap = 4;
  return { leap, gy, march };
}
const g2d = (gy, gm, gd) => { let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408; return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752; };
function d2g(jdn) { let j = 4 * jdn + 139361631; j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908; const i = div(mod(j, 1461), 4) * 5 + 308, gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1; return { gy: div(j, 1461) - 100100 + div(8 - gm, 6), gm, gd }; }
const j2d = (jy, jm, jd) => { const r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; };
function d2j(jdn) {
  const gy = d2g(jdn).gy; let jy = gy - 621; const r = jalCal(jy), jdn1f = g2d(gy, 3, r.march); let k = jdn - jdn1f;
  if (k >= 0) { if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }; k -= 186; }
  else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}
const monthLen = (y, m) => m <= 6 ? 31 : m <= 11 ? 30 : (jalCal(y).leap === 0 ? 30 : 29);
const weekday = (y, m, d) => { const g = d2g(j2d(y, m, d)); return (new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay() + 1) % 7; }; /* 0 = شنبه */
const todayJ = () => { const n = new Date(), j = d2j(g2d(n.getFullYear(), n.getMonth() + 1, n.getDate())); return { y: j.jy, m: j.jm, d: j.jd }; };
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WD = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const fa = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const pad = n => String(n).padStart(2, "0");
const ascii = s => String(s || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
function parse(v) {
  const m = ascii(v).trim().replace(/[.\-]/g, "/").match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/); if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3]; if (y < 1300 || y > 1600 || mo < 1 || mo > 12 || d < 1 || d > monthLen(y, mo)) return null; return { y, m: mo, d };
}
const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3.2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>';
const CHEV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

let cur = null;
function close() { if (!cur) return; cur.el.remove(); if (cur.bd) cur.bd.remove(); document.removeEventListener("pointerdown", onOutside, true); document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); cur = null; }
function onOutside(e) { if (!cur) return; if (cur.el.contains(e.target) || cur.input.parentNode.contains(e.target)) return; close(); }
function onKey(e) { if (e.key === "Escape" && cur) { e.preventDefault(); e.stopPropagation(); const i = cur.input; close(); i._skip = true; i.focus({ preventScroll: true }); setTimeout(() => { i._skip = false; }, 50); } }
function place() {
  if (!cur) return; const pop = cur.el;
  if (innerWidth <= 700) { pop.classList.add("sheet"); pop.style.left = pop.style.top = ""; return; }
  pop.classList.remove("sheet");
  const r = cur.input.getBoundingClientRect(), w = pop.offsetWidth || 300, h = pop.offsetHeight || 350;
  const left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8); let top = r.bottom + 6;
  if (top + h > innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
  pop.style.left = left + "px"; pop.style.top = Math.max(8, top) + "px";
}
function paint() {
  const { y, m } = cur.view, t = todayJ(), sel = cur.sel, first = weekday(y, m, 1), len = monthLen(y, m);
  const y0 = Math.min(t.y, y) - 25, y1 = Math.max(t.y, y) + 10; let yo = "";
  for (let i = y0; i <= y1; i++) yo += `<option value="${i}"${i === y ? " selected" : ""}>${fa(i)}</option>`;
  const mo = MONTHS.map((n, i) => `<option value="${i + 1}"${i + 1 === m ? " selected" : ""}>${n}</option>`).join("");
  let cells = "";
  for (let i = 0; i < first; i++) cells += "<i></i>";
  for (let d = 1; d <= len; d++) {
    const cls = ["rdp-day"]; if ((first + d - 1) % 7 === 6) cls.push("fri"); if (t.y === y && t.m === m && t.d === d) cls.push("today"); if (sel && sel.y === y && sel.m === m && sel.d === d) cls.push("sel");
    cells += `<button type="button" class="${cls.join(" ")}" data-d="${d}" aria-label="${fa(d)} ${MONTHS[m - 1]} ${fa(y)}"${sel && sel.y === y && sel.m === m && sel.d === d ? ' aria-pressed="true"' : ""}>${fa(d)}</button>`;
  }
  cur.el.innerHTML = `<div class="rdp-grab" aria-hidden="true"></div>
  <div class="rdp-head"><button type="button" class="rdp-nav" data-act="prev" aria-label="ماه قبل">${CHEV("M9 6l6 6-6 6")}</button>
    <div class="rdp-sel"><select data-act="month" aria-label="ماه">${mo}</select><select data-act="year" aria-label="سال">${yo}</select></div>
    <button type="button" class="rdp-nav" data-act="next" aria-label="ماه بعد">${CHEV("M15 6l-6 6 6 6")}</button></div>
  <div class="rdp-wd">${WD.map((w, i) => `<span${i === 6 ? ' class="fri"' : ""}>${w}</span>`).join("")}</div>
  <div class="rdp-grid">${cells}</div>
  <div class="rdp-foot"><button type="button" class="rdp-link" data-act="today">امروز</button>${cur.clearable ? '<button type="button" class="rdp-link rdp-clear" data-act="clear">پاک‌کردن</button>' : ""}<button type="button" class="rdp-link rdp-done" data-act="close">بستن</button></div>`;
  place();
}
function commit(v) { const i = cur.input; i.value = v; i.setCustomValidity && i.setCustomValidity(""); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }
function onClick(e) {
  const b = e.target.closest("button"); if (!b || !cur) return;
  if (b.dataset.d) { const s = { y: cur.view.y, m: cur.view.m, d: +b.dataset.d }; commit(`${s.y}/${pad(s.m)}/${pad(s.d)}`); const i = cur.input; close(); i._skip = true; i.focus({ preventScroll: true }); setTimeout(() => { i._skip = false; }, 50); return; }
  const a = b.dataset.act;
  if (a === "prev") { cur.view.m--; if (cur.view.m < 1) { cur.view.m = 12; cur.view.y--; } paint(); }
  else if (a === "next") { cur.view.m++; if (cur.view.m > 12) { cur.view.m = 1; cur.view.y++; } paint(); }
  else if (a === "today") { const t = todayJ(); commit(`${t.y}/${pad(t.m)}/${pad(t.d)}`); const i = cur.input; close(); i._skip = true; i.focus({ preventScroll: true }); setTimeout(() => { i._skip = false; }, 50); }
  else if (a === "clear") { commit(""); close(); }
  else if (a === "close") close();
}
function onChange(e) { const s = e.target.closest("select"); if (!s || !cur) return; if (s.dataset.act === "month") cur.view.m = +s.value; else if (s.dataset.act === "year") cur.view.y = +s.value; const d = Math.min(cur.view.d || 1, monthLen(cur.view.y, cur.view.m)); void d; paint(); }
function open(input) {
  if (cur && cur.input === input) return; close();
  const sel = parse(input.value), base = sel || todayJ(), host = input.closest("dialog[open]") || document.body;
  const el = document.createElement("div"); el.className = "rdp"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "انتخاب تاریخ شمسی"); el.dir = "rtl";
  let bd = null; if (innerWidth <= 700) { bd = document.createElement("div"); bd.className = "rdp-backdrop"; bd.addEventListener("click", close); host.appendChild(bd); }
  host.appendChild(el);
  cur = { input, el, bd, sel, view: { y: base.y, m: base.m }, clearable: !input.required };
  el.addEventListener("click", onClick); el.addEventListener("change", onChange);
  document.addEventListener("pointerdown", onOutside, true); document.addEventListener("keydown", onKey, true); window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
  paint();
}
function attach(el) {
  if (el.dataset.rdp) return; el.dataset.rdp = "1";
  const w = document.createElement("span"); w.className = "date-field"; el.parentNode.insertBefore(w, el); w.appendChild(el);
  const b = document.createElement("button"); b.type = "button"; b.className = "date-btn"; b.setAttribute("aria-label", "انتخاب تاریخ"); b.innerHTML = ICON; w.appendChild(b);
  el.setAttribute("autocomplete", "off"); if (window.matchMedia && matchMedia("(pointer:coarse)").matches) el.setAttribute("inputmode", "none");
  b.addEventListener("click", () => { if (cur && cur.input === el) close(); else open(el); });
  el.addEventListener("focus", () => { if (el._skip) { el._skip = false; return; } open(el); }); el.addEventListener("click", () => open(el));
  el.addEventListener("input", () => { if (cur && cur.input === el) { const p = parse(el.value); if (p) { cur.sel = p; cur.view = { y: p.y, m: p.m }; paint(); } } });
}
window.RDDate = { attach, close, parse, todayJ, toJalali: (gy, gm, gd) => { const j = d2j(g2d(gy, gm, gd)); return { y: j.jy, m: j.jm, d: j.jd }; }, toGregorian: (y, m, d) => d2g(j2d(y, m, d)), monthLen, MONTHS };
})();
