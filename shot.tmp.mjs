// Real-wall-clock screenshots of the splash via the DevTools Protocol.
// virtual-time-budget freezes motion's delayed animations, so we drive a real
// headless Chrome and capture at genuine elapsed times.
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const URL = "http://localhost:3000";
const REDUCE = process.env.REDUCE === "1";
const PREFIX = REDUCE ? "reduce" : "rt";
const SHOTS = (process.env.SHOTS || "1500,1850,2150,2500")
  .split(",")
  .map(Number); // ms after navigation

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-color-profile=srgb",
  "--no-first-run",
  "--user-data-dir=/tmp/savor-chrome-profile",
  "about:blank",
]);
chrome.on("error", (e) => console.error("chrome spawn error", e));

let ws;
let msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => pending.set(id, res));
}

try {
  // wait for the debugger endpoint
  let wsUrl;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/json/version`);
      const j = await r.json();
      wsUrl = j.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
    await sleep(250);
  }
  if (!wsUrl) throw new Error("no devtools endpoint");

  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };

  // new page target
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  // sessioned send
  const ssend = (method, params = {}) => {
    const id = ++msgId;
    ws.send(JSON.stringify({ id, sessionId, method, params }));
    return new Promise((res) => pending.set(id, res));
  };

  await ssend("Page.enable");
  await ssend("Emulation.setDeviceMetricsOverride", {
    width: 430,
    height: 920,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await ssend("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-motion",
        value: REDUCE ? "reduce" : "no-preference",
      },
    ],
  });

  await ssend("Page.navigate", { url: URL });
  const start = Date.now();
  for (const t of SHOTS) {
    const wait = t - (Date.now() - start);
    if (wait > 0) await sleep(wait);
    const { data } = await ssend("Page.captureScreenshot", {
      format: "png",
    });
    fs.writeFileSync(
      `/tmp/savorprev/shot/${PREFIX}_${t}.png`,
      Buffer.from(data, "base64"),
    );
    console.log("captured", PREFIX, t, "ms");
  }
} catch (e) {
  console.error("ERR", e);
} finally {
  try { ws?.close(); } catch {}
  chrome.kill("SIGKILL");
  await sleep(300);
  process.exit(0);
}
