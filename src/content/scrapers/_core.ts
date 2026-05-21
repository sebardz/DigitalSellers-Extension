import { MELI_HOSTS } from "@shared/config";

const MELI_ID_PATTERN = /(ML[A-Z]{1,3})-?(\d+)/i;

export function isMeliSite(): boolean {
  return MELI_HOSTS.some((h) => location.hostname.toLowerCase().endsWith(h));
}

export function canonicalUrl(): string {
  return location.href;
}

export function inferSiteIdFromOfficialId(id?: string | null): string | null {
  const match = id?.match(/^(ML[A-Z]{1,3})\d+$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function extractItemIdFromUrl(url: string): string | null {
  const filterMatch = url.match(/[?&]pdp_filters=[^&]*?item_id(?:%3A|:)?(ML[A-Z]{1,3}\d+)/i);
  if (filterMatch?.[1]) return filterMatch[1].toUpperCase();

  const directMatch = url.match(MELI_ID_PATTERN);
  if (!directMatch) return null;
  return `${directMatch[1].toUpperCase()}${directMatch[2]}`;
}

export function extractCatalogProductIdFromUrl(url: string): string | null {
  const match = url.match(/\/p\/(ML[A-Z]{1,3}\d+)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function isProductDetailPage(): boolean {
  if (!isMeliSite()) return false;
  const url = location.href;
  return !!extractItemIdFromUrl(url) || !!extractCatalogProductIdFromUrl(url);
}
