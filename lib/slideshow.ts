export type AboutPhoto = { src: string; alt: string; caption: string };

export function wrapIndex(index: number, delta: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  const sum = index + delta;
  return ((sum % length) + length) % length;
}

export function parsePhotos(raw: string | undefined): AboutPhoto[] | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const photos: AboutPhoto[] = [];

  for (const entry of parsed) {
    if (typeof entry === "object" && entry !== null && "src" in entry && "alt" in entry && "caption" in entry) {
      const obj = entry as Record<string, unknown>;
      if (
        typeof obj["src"] === "string" &&
        typeof obj["alt"] === "string" &&
        typeof obj["caption"] === "string"
      ) {
        photos.push({ src: obj["src"], alt: obj["alt"], caption: obj["caption"] });
      }
    }
  }

  return photos;
}