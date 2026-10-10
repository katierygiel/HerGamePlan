import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const out = process.argv[2] || "/tmp/shots";
import fs from "fs"; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const url = (as) => `http://localhost:4173/?as=${as}`;
async function page(as) { const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("PAGEERROR", as, e.message)); p.on("console", (m) => m.type() === "error" && console.log("CONSOLE", as, m.text())); await p.goto(url(as)); await p.waitForTimeout(1700); return p; }
const shot = async (p, n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${out}/${n}.png` }); };
const tab = (p, name) => p.getByRole("button", { name, exact: true }).first().click();

let p = await page("out"); await shot(p, "01-welcome");
await p.getByRole("button", { name: /Get started/ }).click(); await shot(p, "02-signup"); await p.close();

p = await page("new"); await shot(p, "03-onboarding-role"); await p.close();

p = await page("member"); await shot(p, "04-home");
await tab(p, "Goals"); await shot(p, "05-goals");
await p.getByRole("tab", { name: /Community/ }).click(); await shot(p, "06-goals-community");
await tab(p, "Tips"); await shot(p, "07-tips");
await tab(p, "Jobs"); await shot(p, "08-jobs");
await tab(p, "Connect"); await shot(p, "09-feed");
await p.getByRole("tab", { name: /Messages/ }).click(); await shot(p, "10-messages");
await p.getByRole("tab", { name: /Mentors/ }).click(); await shot(p, "11-mentors");
await tab(p, "Home"); await p.getByRole("button", { name: "My profile" }).click(); await shot(p, "12-profile");
await p.getByRole("button", { name: "Settings" }).click(); await shot(p, "13-settings");
await p.close();

p = await page("admin");
await p.getByRole("button", { name: "My profile" }).click(); await p.getByRole("button", { name: "Settings" }).click();
await p.getByRole("button", { name: /Admin dashboard/ }).click(); await p.waitForTimeout(500); await shot(p, "14-admin");
await b.close();
