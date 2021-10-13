import { computed, ref } from 'vue'

export function getRegexp(pattern: string): RegExp {
  return new RegExp(String.raw({ raw: pattern }))
}

export function useRegexp(defaultValue?: string) {
  const literal = ref(defaultValue || '')
  const regexp = computed(() => getRegexp(literal.value))
  return {
    literal,
    regexp,
  }
}
