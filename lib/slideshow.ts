export type AboutPhoto = {
  kind?: "image" | "video";
  src: string;
  alt: string;
  caption: string;
  poster?: string;
};

export function wrapIndex(index: number, delta: number, length: number): number {
  if (length <= 0) { return 0; }
  const sum = index + delta;
  return ((sum % length) + length) % length;
}

/**
 * Parses a raw JSON string into an array of {@link AboutPhoto}.
 *
 * The function follows strict validation rules:
 * - `null`, `undefined`, or an empty/whitespace‑only string returns `null`.
 * - If JSON parsing fails or the parsed value is not an array, `null` is returned.
 * - Each entry must be a non‑null object containing **string** `src`, `alt`, and `caption`.
 *   Empty strings are allowed; only the type check matters.
 * - For valid entries:
 *   - `kind` is added only when it is exactly `"image"` or `"video"`.
 *   - `poster` is added only when it is a string.
 *   - No other properties are copied.
 *
 * The resulting array may be empty.
 */
export function parsePhotos(raw: string | undefined): AboutPhoto[] | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const photos: AboutPhoto[] = [];

  for (const entry of parsed) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      !Array.isArray(entry)
    ) {
      const obj = entry as Record<string, unknown>;

      const src = typeof obj.src === "string" ? obj.src : undefined;
      const alt = typeof obj.alt === "string" ? obj.alt : undefined;
      const caption = typeof obj.caption === "string" ? obj.caption : undefined;

      if (src !== undefined && alt !== undefined && caption !== undefined) {
        const photo: AboutPhoto = { src, alt, caption };

        if (obj.kind === "image" || obj.kind === "video") {
          photo.kind = obj.kind;
        }

        if (typeof obj.poster === "string") {
          photo.poster = obj.poster;
        }

        photos.push(photo);
      }
    }
  }

  return photos;
}