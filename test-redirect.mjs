// Tests the actual <script> from index.html by executing it in a VM
// with mocked navigator/location/document for various user agents.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function redirectFor(ua, { touch = false } = {}) {
  let target = null;
  const ctx = {
    navigator: { userAgent: ua },
    location: { replace: (url) => { target = url; } },
    document: touch ? { ontouchend: () => {} } : {},
  };
  vm.runInNewContext(script, ctx);
  return target;
}

const cases = [
  ["Android phone",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36",
    {}, "play.google.com"],
  ["iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
    {}, "apps.apple.com"],
  ["iPad (reports as Mac, has touch)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
    { touch: true }, "apps.apple.com"],
  ["Windows desktop (fallback)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    {}, "play.google.com"],
  ["Real Mac desktop, no touch (fallback)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
    {}, "play.google.com"],
  ["Empty user agent (fallback, must not crash)",
    "", {}, "play.google.com"],
];

let failed = 0;
for (const [name, ua, opts, expectHost] of cases) {
  const target = redirectFor(ua, opts);
  const ok = target && target.includes(expectHost);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} -> ${target}`);
  if (!ok) failed++;
}
console.log(failed === 0 ? "\nAll tests passed" : `\n${failed} test(s) FAILED`);
process.exit(failed === 0 ? 0 : 1);
