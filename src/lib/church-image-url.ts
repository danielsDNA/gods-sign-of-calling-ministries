export function churchImageUrl(value: string): string {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/')
    ? value
    : `/airo-assets/images/${value}`;
}
