export function useDebounce(timeout: number) {
  let timer: number
  return (fn: () => unknown) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(fn, timeout) as any as number
  }
}
