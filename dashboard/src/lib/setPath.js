export function updateAtPath(source, path, value) {
  const root = structuredClone(source);
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (cursor[key] === undefined || cursor[key] === null) {
      cursor[key] = typeof parts[index + 1] === "number" ? [] : {};
    }
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return root;
}

export function deleteAtPath(source, path) {
  const root = structuredClone(source);
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor?.[parts[index]];
    if (cursor === undefined || cursor === null) return root;
  }
  if (cursor && typeof cursor === "object") delete cursor[parts[parts.length - 1]];
  return root;
}

export function getAtPath(source, path) {
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let cursor = source;
  for (const key of parts) {
    if (cursor === undefined || cursor === null) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}
