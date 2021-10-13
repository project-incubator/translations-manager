export function arrayToSymmetricalRecord(
  arr: string[]
): Record<string, string> {
  const result = Object.create(null)
  arr.forEach((v) => (result[v] = v))
  return result
}

export function objectMap<
  T extends object,
  NK extends string | number | symbol,
  NV
>(
  o: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => { key: NK; value: NV }
): Record<NK | string, NV> {
  const result = Object.create(null)
  Object.keys(o).forEach((ok) => {
    const { key, value } = fn(ok as keyof T, o[ok as keyof T])
    result[key] = value
  })
  return result
}

export function objectMapToArray<T extends object, R>(
  o: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => R
) {
  const result: R[] = []
  Object.keys(o).forEach((ok) => {
    result.push(fn(ok as keyof T, o[ok as keyof T]))
  })
  return result
}

export function arrayMapToObject<T>(
  o: T[],
  fn: (value: T) => { key: string | number | symbol; value: any }
) {
  const result = Object.create(null)
  o.forEach((item) => {
    const { key, value } = fn(item)
    result[key] = value
  })
  return result
}

export function objectForeach<T extends object>(
  o: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => unknown
) {
  Object.keys(o).forEach((ok) => {
    fn(ok as keyof T, o[ok as keyof T])
  })
}
