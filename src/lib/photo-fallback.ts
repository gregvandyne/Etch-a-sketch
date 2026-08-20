/**
 * Portfolio-photo fallbacks for page-level image slots. The migration fills
 * the galleries richly but leaves many page fields empty; these helpers let
 * a page borrow portfolio photographs for empty slots — never repeating one
 * on the page — while an image set in the Studio always wins.
 */
import type { GalleryCategory, PhotoSource } from "./types";

export const photoKey = (p?: PhotoSource | null) => p?.placeholder ?? p?.asset?._ref ?? "";

export const hasImage = (p?: PhotoSource | null): p is PhotoSource =>
  Boolean(p?.asset || p?.placeholder);

/** A picker over the category pools that never hands out the same
 *  photograph twice, and skips anything the page already shows. */
export function createPhotoPicker(
  pools: Record<GalleryCategory, PhotoSource[]>,
  alreadyUsed: (PhotoSource | undefined | null)[]
) {
  const used = new Set(alreadyUsed.filter(hasImage).map(photoKey));
  return (category: GalleryCategory): PhotoSource | undefined => {
    const photo = pools[category].find((p) => !used.has(photoKey(p)));
    if (photo) used.add(photoKey(photo));
    return photo;
  };
}
