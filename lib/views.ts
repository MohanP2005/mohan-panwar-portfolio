// Key‑value storage interface
export type KV = {
	/** Retrieve a stored string or null */
	getItem(key: string): string | null;
	/** Store a string value */
	setItem(key: string, value: string): void;
};

/**
 * Returns true the first time a slug is viewed.
 * Subsequent calls return false unless the storage throws.
 */
export function shouldCountView(storage: KV, slug: string): boolean {
	const key = `viewed:${slug}`;
	try {
		const existing = storage.getItem(key);
		if (existing !== null) return false;
	} catch {
		// If reading fails, treat as not viewed
		return true;
	}
	try {
		storage.setItem(key, "1");
	} catch {
		/* ignore write errors */
	}
	return true;
}

/**
 * Retrieves a persistent client id or generates a new one.
 * If storage errors, a fresh id is still returned.
 */
export function getClientId(storage: KV, makeId: () => string): string {
	const key = "mp_client_id";
	let stored: string | null = null;
	try {
		stored = storage.getItem(key);
	} catch {
		/* ignore read errors */
	}
	if (stored !== null && stored !== "") return stored;

	const id = makeId();
	try {
		storage.setItem(key, id);
	} catch {
		/* ignore write errors */
	}
	return id;
}

/**
 * Formats a view count.
 * 1 → "1 VIEW", otherwise e.g. "2,345 VIEWS".
 */
export function formatViews(n: number): string {
	return n === 1 ? "1 VIEW" : `${n.toLocaleString("en-US")} VIEWS`;
}

/**
 * Builds a clean redirect URL: origin + pathname, no query/hash,
 * guaranteed to end with a trailing slash.
 */
export function authRedirectUrl(href: string): string {
	const url = new URL(href);
	let base = `${url.origin}${url.pathname}`;
	if (!base.endsWith("/")) base += "/";
	return base;
}
