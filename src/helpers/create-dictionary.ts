export function createDictionary<Key extends string, Value>(entries: [Key, Value][]): { [K in Key]?: Value } {
  const map = Object.create(null) as { [K in Key]?: Value };
  for (const [key, value] of entries) {
    map[key] = value;
  }
  return map;
}
