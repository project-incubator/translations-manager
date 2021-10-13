export function timeout(fn: () => unknown, duration: number) {
  return new Promise((r) => {
    setTimeout(async () => {
      await fn()
      r(undefined)
    }, duration)
  })
}
