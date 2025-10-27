// Ruex64 Domain Test — client checks
const $ = (sel) => document.querySelector(sel);

function set(id, val) { $(id).textContent = val ?? "—"; }

function parseTrace(txt) {
  const out = {};
  txt.split("\n").forEach((line) => {
    const i = line.indexOf("=");
    if (i > -1) out[line.slice(0, i)] = line.slice(i + 1);
  });
  return out;
}

async function checkCache() {
  try {
    const res = await fetch("./styles.css", { method: "GET" });
    const cache = res.headers.get("cf-cache-status") || "n/a";
    return cache;
  } catch (e) {
    return "error";
  }
}

async function runTests() {
  $("#run").disabled = true;
  set("#status", "Testing…");

  // Basics
  set("#host", window.location.hostname || "n/a");
  set("#protocol", window.location.protocol.replace(":", ""));

  // CF trace
  let trace = null, cfOK = false;
  try {
    const res = await fetch("/cdn-cgi/trace", { cache: "no-store" });
    if (res.ok) {
      const txt = await res.text();
      trace = parseTrace(txt);
      cfOK = !!(trace && (trace.colo || trace.ray));
    }
  } catch (e) { /* ignore */ }

  set("#cf", cfOK ? "Yes" : "No");
  set("#colo", trace?.colo || "—");
  set("#tls", trace?.tls || "—");
  set("#httpver", trace?.http || trace?.h || "—");
  set("#ip", trace?.ip || "—");
  set("#ray", trace?.ray ? trace.ray.slice(-12) : "—");

  // Cache header check
  const cache = await checkCache();
  set("#cache", cache);

  // Compose status
  const ok = document.readyState === "complete" && window.location.hostname && (window.isSecureContext || window.location.protocol === "https:") ;
  set("#status", ok ? "✅ Live" : "⚠️ Check DNS/SSL");

  $("#run").disabled = false;

  // Keep a report object for copy
  window.__ruex64Report = {
    time: new Date().toISOString(),
    host: window.location.hostname,
    protocol: window.location.protocol.replace(":", ""),
    cloudflare: cfOK,
    colo: trace?.colo || null,
    tls: trace?.tls || null,
    http: trace?.http || trace?.h || null,
    ip: trace?.ip || null,
    ray: trace?.ray || null,
    cache_status_for_styles_css: cache,
    user_agent: navigator.userAgent,
  };
}

function copyReport() {
  const text = JSON.stringify(window.__ruex64Report || {}, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    const btn = $("#copy");
    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = old), 1200);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("#origin-url").textContent = window.location.origin;
  $("#yr").textContent = new Date().getFullYear();
  $("#run").addEventListener("click", runTests);
  $("#copy").addEventListener("click", copyReport);
  runTests();
});
