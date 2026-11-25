const GOOGLE_DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

/**
 * Extracts a clean Google Drive file ID from common Drive/Googleusercontent URL formats:
 * - https://drive.google.com/file/d/<ID>/view?usp=sharing
 * - https://drive.google.com/open?id=<ID>
 * - https://drive.google.com/uc?export=download&id=<ID> (including malformed trailing ?v=3)
 * - https://drive.google.com/thumbnail?id=<ID>&sz=w1000
 * - https://lh3.googleusercontent.com/d/<ID>=w1000
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  if (host === 'drive.google.com' || host === 'docs.google.com') {
    // 1. /file/d/<ID>/... or /d/<ID>/...
    const pathMatch = parsed.pathname.match(/\/(?:file\/)?d\/([^/]+)/i);
    if (pathMatch?.[1]) {
      const candidate = pathMatch[1].split(/[?#=]/)[0];
      if (GOOGLE_DRIVE_ID_RE.test(candidate)) {
        return candidate;
      }
    }

    // 2. ?id=<ID> (strip any accidentally appended ?v=3 inside the id param value)
    const idParam = parsed.searchParams.get('id');
    if (idParam) {
      const candidate = idParam.split(/[?#]/)[0];
      if (GOOGLE_DRIVE_ID_RE.test(candidate)) {
        return candidate;
      }
    }
  }

  if (host.endsWith('googleusercontent.com')) {
    const pathMatch = parsed.pathname.match(/\/d\/([^/=]+)/i);
    if (pathMatch?.[1]) {
      const candidate = pathMatch[1].split(/[?#=]/)[0];
      if (GOOGLE_DRIVE_ID_RE.test(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Converts Google Drive sharing/download URLs into a reliable direct image endpoint
 * and cleans up accidental duplicate `?` query separators in HTTP(S) URLs.
 */
export function normalizeImageUrl(rawUrl: string, width = 1000): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    const safeWidth = Math.max(200, Math.min(2400, Math.round(width)));
    return `https://lh3.googleusercontent.com/d/${driveId}=w${safeWidth}`;
  }

  // Fix accidentally concatenated query strings like `url?a=1?v=2` -> `url?a=1&v=2`
  if (/^https?:\/\//i.test(trimmed)) {
    const firstQueryIdx = trimmed.indexOf('?');
    if (firstQueryIdx !== -1) {
      const base = trimmed.slice(0, firstQueryIdx + 1);
      const rest = trimmed.slice(firstQueryIdx + 1).replace(/\?/g, '&');
      return `${base}${rest}`;
    }
  }

  return trimmed;
}

/**
 * Produces an ordered, deduplicated list of image URLs to try sequentially on load errors.
 * For Google Drive assets, tries `lh3.googleusercontent.com` first, then `drive.google.com/thumbnail`,
 * and finally the optional local fallback asset.
 */
export function resolveImageCandidates(rawUrl: string, fallbackUrl?: string): string[] {
  const candidates: string[] = [];
  const pushUnique = (url: string | undefined) => {
    const clean = (url || '').trim();
    if (clean && !candidates.includes(clean)) {
      candidates.push(clean);
    }
  };

  const trimmed = (rawUrl || '').trim();
  const driveId = extractGoogleDriveFileId(trimmed);

  if (driveId) {
    pushUnique(`https://lh3.googleusercontent.com/d/${driveId}=w1000`);
    pushUnique(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
  } else if (trimmed) {
    pushUnique(normalizeImageUrl(trimmed));
  }

  if (fallbackUrl) {
    pushUnique(normalizeImageUrl(fallbackUrl));
  }

  return candidates;
}
