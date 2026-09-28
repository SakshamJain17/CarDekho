import {test,expect} from "@playwright/test";

test("real intro plays, pauses, resumes, opens its film player and pauses offscreen",async({page})=>{
  await page.goto("/performance/");
  const video=page.locator(".performance-hero-video");
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(0);
  await expect(video).toHaveJSProperty("muted",true);
  await page.getByRole("button",{name:"Pause homepage video"}).click();
  await expect(video).toHaveJSProperty("paused",true);
  await page.getByRole("button",{name:"Play homepage video"}).click();
  await expect(video).toHaveJSProperty("paused",false);
  await page.getByRole("button",{name:"WATCH THE INTRO"}).click();
  const dialog=page.getByRole("dialog",{name:"THE ROAD. THE CAR. THE STORY."});
  await expect(dialog).toBeVisible();
  await expect(video).toHaveJSProperty("paused",true);
  await expect(dialog.locator("video")).toHaveJSProperty("controls",true);
  await page.screenshot({path:"test-results/performance-intro-film.png"});
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.locator("#data").scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty("paused",true);
});

test("reduced-motion loads a real poster without downloading the intro",async({page})=>{
  const media=[];
  page.on("request",request=>{if(request.url().includes("driving-intro.mp4"))media.push(request.url());});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/performance/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".performance-hero-video")).not.toHaveAttribute("src",/mp4/);
  await expect(page.locator(".performance-hero-image")).toHaveJSProperty("naturalWidth",1920);
  expect(media).toEqual([]);
  await page.getByRole("button",{name:"Play homepage video"}).click();
  await expect.poll(()=>page.locator(".performance-hero-video").evaluate(v=>v.currentTime)).toBeGreaterThan(0);
});

test("video failure keeps the real-photo fallback and Python predictor working",async({page})=>{
  await page.route("**/driving-intro.mp4",route=>route.abort());
  await page.goto("/performance/");
  await expect(page.locator(".performance-video-controls")).toContainText("VIDEO UNAVAILABLE");
  await expect(page.locator(".performance-hero-image")).toBeVisible();
  await expect(page.locator(".performance-hero-video")).not.toHaveClass(/has-frame/);
  await page.getByRole("button",{name:"CALCULATE VALUE"}).click();
  await expect(page.locator(".ai-prediction-comparison>div")).toHaveCount(3);
  await expect(page.locator(".ai-valuation-panel>img")).toHaveAttribute("src",/driving-intro-poster/);
});
