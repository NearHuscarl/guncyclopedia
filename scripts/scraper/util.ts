import { chromium, devices } from "playwright";

export const INFINITY = 9999999; // JSON-serializable infinite value

export async function goToPage(url: string) {
  const browser = await chromium.launch({
    // headless: true,
  });
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "info") {
      console.log("[browser]", msg.text());
    }
  });

  await context.route("**.jpg", (route) => route.abort());
  await page.goto(url, { waitUntil: "domcontentloaded" });

  return { browser, context, page };
}

export function unwrapParentheses(text: string): string {
  return text.replace(/\((.*)\)/, "$1");
}
