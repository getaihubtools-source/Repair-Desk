/* AIhub Repair Desk — ماژول مجوز (بررسی آفلاین با امضای ECDSA P-256)
   توجه: خط زیر را ابزار «Keygen» هنگام ساخت نسخه فروش جایگزین می‌کند. مقدار خالی = نسخه توسعه بدون محدودیت. */
(() => {
"use strict";
const LICENSE_PUBKEY = "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"ZqvzNIBir3IXDC2ZRCq1IrEkIBKRql1DHOx52FZ5p08\",\"y\":\"-GhJ1wHAH_0fafRKSeO0mhWXI5m41ZnO2gF9WPMvw8I\"}";
const TRIAL_LIMIT = 10;
const LS_MADE = "rd_made", LS_DEV = "rd_dev", LS_LIC = "rd_lic", LS_SEEN = "rd_seen", PREFIX = "AHRD1";
const ECDSA = { name: "ECDSA", namedCurve: "P-256" };
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const state = { enabled: !!LICENSE_PUBKEY, device: "", licensed: false, expired: false, info: null, trialLimit: TRIAL_LIMIT };
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const readRec = () => { try { return JSON.parse(lsGet(LS_LIC)); } catch (e) { return null; } };
const unb64u = t => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return Uint8Array.from(atob(t), c => c.charCodeAt(0)); };
const isoDate = ms => new Date(ms).toISOString().slice(0, 10);
/* ساعت امن‌تر: اگر ساعت دستگاه به عقب برگردد، آخرین زمان دیده‌شده ملاک است */
function nowMs() { const eff = Math.max(Date.now(), Number(lsGet(LS_SEEN)) || 0); lsSet(LS_SEEN, String(eff)); return eff; }
function getDevice() {
  let d = lsGet(LS_DEV);
  if (!/^[A-HJ-KM-NP-Z2-9]{8}$/.test(d || "")) { const r = crypto.getRandomValues(new Uint8Array(8)); d = Array.from(r, b => ALPHA[b % ALPHA.length]).join(""); lsSet(LS_DEV, d); }
  return d;
}
async function verify(code) {
  const m = String(code || "").trim().match(new RegExp("^" + PREFIX + "\\.([A-Za-z0-9_-]+)\\.([A-Za-z0-9_-]+)$"));
  if (!m) return { ok: false, reason: "قالب کد درست نیست؛ کد را کامل کپی کنید." };
  try {
    const body = unb64u(m[1]), sig = unb64u(m[2]);
    const pk = await crypto.subtle.importKey("jwk", JSON.parse(LICENSE_PUBKEY), ECDSA, false, ["verify"]);
    if (!(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pk, sig, body))) return { ok: false, reason: "امضای کد معتبر نیست." };
    const p = JSON.parse(new TextDecoder().decode(body));
    if (p.v !== 2 || p.dv !== state.device) return { ok: false, reason: "این کد برای دستگاه دیگری صادر شده است." };
    return { ok: true, p };
  } catch (e) { return { ok: false, reason: "بررسی کد ناموفق بود." }; }
}
function apply(p, at) {
  const eff = nowMs(); let valid = true, expires = "";
  if (p.x) { expires = p.x; valid = isoDate(eff) <= p.x; }
  else if (p.d) { const end = at + p.d * 864e5; expires = isoDate(end); valid = eff < end; }
  state.licensed = valid; state.expired = !valid; state.info = { buyer: p.n, expires, perm: !p.x && !p.d };
}
async function load() {
  state.device = getDevice();
  if (!state.enabled) { state.licensed = true; state.info = { buyer: "نسخه توسعه (بدون محدودیت)", perm: true, dev: true }; return state; }
  const rec = readRec();
  if (rec && rec.code) { const r = await verify(rec.code); if (r.ok) apply(r.p, rec.at); }
  return state;
}
async function activate(code) {
  if (!state.enabled) return { ok: false, reason: "این نسخه، نسخه توسعه است و نیازی به مجوز ندارد." };
  const r = await verify(code); if (!r.ok) return r;
  const p = r.p, eff = nowMs();
  if (p.b && isoDate(eff) > p.b) return { ok: false, reason: "مهلت فعال‌سازی این کد گذشته است؛ کد جدید بگیرید." };
  if (p.x && isoDate(eff) > p.x) return { ok: false, reason: "این کد منقضی شده است." };
  const prev = readRec(), c = String(code).trim(), at = prev && prev.code === c ? prev.at : eff;
  lsSet(LS_LIC, JSON.stringify({ code: c, at })); apply(p, at); return { ok: true };
}
/* سهمیه‌ی آزمایشی «تعداد پرونده‌های ساخته‌شده» است، نه «موجود»: حذف پرونده سهمیه را برنمی‌گرداند */
const used = jobs => { const a = Array.isArray(jobs) ? jobs : [], seq = a.reduce((m, j) => Math.max(m, Number(j.receiptSeq) || 0), 0); return Math.max(a.length, seq, Number(lsGet(LS_MADE)) || 0); };
const noteCreated = jobs => lsSet(LS_MADE, String(used(jobs) + 1));
const canAddJob = jobs => !state.enabled || state.licensed || used(jobs) < TRIAL_LIMIT;
window.RDLicense = { load, activate, canAddJob, used, noteCreated, state, trialLimit: TRIAL_LIMIT };
})();
