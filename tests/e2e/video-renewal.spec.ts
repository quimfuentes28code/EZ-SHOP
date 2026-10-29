import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { BUSINESS_MEDIA_BUCKET } from "../../src/lib/business-media";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL } from "./helpers/supabase";

const clip = readFileSync(resolve("tests/fixtures/signed-video.webm"));

for (const playing of [false, true]) {
  test(`renovar el vídeo firmado conserva ${playing ? "la reproducción en Cliente" : "la pausa en Empresa"}`, async ({ page }) => {
    await page.clock.install();
    const path = `${MOCK_ORGANIZATION_ID}/video-prueba.webm`;
    await installSupabaseMock(page, { tables: {
      business_posts: [{
        id: "55555555-5555-4555-8555-555555555555",
        organization_id: MOCK_ORGANIZATION_ID,
        body: "Vídeo sintético para verificar la renovación",
        media_url: `storage://${BUSINESS_MEDIA_BUCKET}/${path}`,
        media_kind: "video", published: true, created_at: "2026-01-01T12:00:00Z",
      }],
    }});
    let revision = 0;
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
    await page.route(`${MOCK_SUPABASE_URL}/storage/v1/**`, async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() === "OPTIONS") {
        await route.fulfill({ status: 204, headers }); return;
      }
      if (request.method() === "POST" && url.pathname === `/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}`) {
        const { paths } = request.postDataJSON() as { paths: string[] };
        revision++;
        await route.fulfill({ json: paths.map(item => ({
          path: item, error: null,
          signedURL: `/object/sign/${BUSINESS_MEDIA_BUCKET}/${item}?token=renewal-${revision}`,
        })), headers });
        return;
      }
      if (request.method() === "GET" && url.pathname.startsWith(`/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}/`)) {
        const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers().range || "");
        const start = range ? Number(range[1]) : 0;
        const end = range?.[2] ? Math.min(Number(range[2]), clip.length - 1) : clip.length - 1;
        await route.fulfill({
          status: range ? 206 : 200,
          body: clip.subarray(start, end + 1), contentType: "video/webm",
          headers: {
            ...headers, "Accept-Ranges": "bytes", "Content-Length": String(end - start + 1),
            ...(range ? { "Content-Range": `bytes ${start}-${end}/${clip.length}` } : {}),
          },
        }); return;
      }
      await route.fallback();
    });
    if (playing) {
      await page.goto("/cliente");
      await page.getByRole("button", { name: "Ver perfil", exact: true }).click();
    } else {
      await page.goto("/empresa");
      await page.getByRole("navigation", { name: "Módulos disponibles" })
        .getByRole("button", { name: "Perfil público", exact: true }).click();
    }
    const video = page.locator("video").first();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
    await video.evaluate(async (element: HTMLVideoElement, startPlaying) => {
      element.currentTime = 1;
      element.playbackRate = 0.75;
      element.volume = 0.3;
      element.muted = true;
      element.loop = true;
      if (startPlaying) await element.play();
      else element.pause();
    }, playing);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.seeking)).toBe(false);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.9);
    const previous = await video.getAttribute("src");
    await page.clock.fastForward(45_050);
    await expect(video).not.toHaveAttribute("src", previous!);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState >= 1 && !element.seeking)).toBe(true);
    const state = await video.evaluate((element: HTMLVideoElement) => ({
      time: element.currentTime, paused: element.paused, rate: element.playbackRate,
      volume: element.volume, muted: element.muted,
    }));
    expect(state.time).toBeGreaterThan(0.9);
    expect(state.paused).toBe(!playing);
    expect(state.rate).toBe(0.75);
    expect(state.volume).toBeCloseTo(0.3);
    expect(state.muted).toBe(true);
    expect(revision).toBeGreaterThanOrEqual(2);
  });
}
