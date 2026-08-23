/** Textos chicos que no dependen de plata ni de chanchitos. */

export function pluralize(count: number, one: string, many: string) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

/** "Juli está acá" / "Juli y Tomi están acá" / "Juli y 2 más están acá" */
export function friendLine(names: string[]) {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} está acá`;
  if (names.length === 2) return `${names[0]} y ${names[1]} están acá`;
  return `${names[0]} y ${names.length - 1} más están acá`;
}
