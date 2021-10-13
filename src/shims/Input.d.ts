declare module 'primevue/inputtext' {
  import Vue from 'vue'
  interface InputTextProps extends Vue.InputHTMLAttributes {
    modelValue?: string
  }

  class InputText {
    $props: InputTextProps
    $emit(eventName: 'update:modelValue', value: string): this
  }

  export default InputText
}
