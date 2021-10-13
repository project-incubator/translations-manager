declare module 'primevue/button' {
  interface ButtonProps {
    style?: any
    class?: string
    label?: string
    icon?: string
    iconPos?: string
    badge?: string
    badgeClass?: string
    loading?: boolean
    loadingIcon?: string

    // event
    onClick?: () => any
    disabled?: boolean
  }

  class Button {
    $props: ButtonProps
  }

  export default Button
}
