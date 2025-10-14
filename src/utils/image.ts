export function getImageUrl(name: string, ext: string): string {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}