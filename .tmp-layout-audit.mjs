import { writeFileSync } from "node:fs";

const paths = [
  "/",
  "/analyze",
  "/fact-checks/fact-contract-confirmed",
  "/receipts/receipt-contract",
  "/predictions",
  "/predictions/prediction-completed",
  "/influencers/stock-king",
];
const widths = [320, 390, 768, 1024];
const tabs = await fetch("http://127.0.0.1:9225/json").then((response) => response.json());
const tab = tabs.find((candidate) => candidate.type === "page" && candidate.url.includes("3017"));
if (!tab) throw new Error("StockTrace Chrome tab not found");

const socket = new WebSocket(tab.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;

function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(message.error.message));
  else task.resolve(message.result);
});

await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
await send("Page.enable");

for (const width of widths) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 768 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: width < 768 ? 844 : 900,
  });

  for (const path of paths) {
    await send("Page.navigate", { url: `http://127.0.0.1:3017${path}` });
    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        title: document.title,
        innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        h1Count: document.querySelectorAll("h1").length,
        mainCount: document.querySelectorAll("main").length,
      })`,
      returnByValue: true,
    });
    const metrics = JSON.parse(result.result.value);
    console.log(JSON.stringify({ width, path, ...metrics }));

    if (width === 390) {
      const screenshot = await send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      const slug = path === "/" ? "home" : path.split("/").filter(Boolean).at(-1);
      writeFileSync(
        `C:/Users/이의진/AppData/Local/Temp/stocktrace-${slug}-390.png`,
        screenshot.data,
        "base64",
      );
    }
  }
}

socket.close();
