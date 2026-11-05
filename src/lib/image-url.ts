/**
 * Ask image hosts for a right-sized copy instead of the full original.
 * Car photos are often 3–6 MB originals; cards only need ~1/10 of that.
 * Unknown hosts are returned unchanged.
 */

// Wikimedia serves a fixed set of thumbnail widths; other widths are throttled.
const WIKIMEDIA_STEPS = [330, 500, 960, 1280, 1920];

export function sizedImage(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);

    if (u.hostname === "upload.wikimedia.org") {
      const step = WIKIMEDIA_STEPS.find((w) => w >= width) ?? 1920;
      const path = u.pathname;
      if (path.includes("/thumb/")) {
        return `${u.origin}${path.replace(/\/(\d+)px-([^/]+)$/, `/${step}px-$2`)}`;
      }
      const match = path.match(/^\/wikipedia\/([^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/);
      if (match && !/\.(svg|tiff?|gif)$/i.test(match[4])) {
        const [, project, a, ab, file] = match;
        return `${u.origin}/wikipedia/${project}/thumb/${a}/${ab}/${file}/${step}px-${file}`;
      }
      return url;
    }

    if (u.hostname === "images.unsplash.com") {
      u.searchParams.set("w", String(width));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      if (!u.searchParams.has("q")) u.searchParams.set("q", "75");
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}
