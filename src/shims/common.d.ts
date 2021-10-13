import Vue from 'vue'
declare namespace JSX {
  export interface IntrinsicAttributes extends Vue.InsHTMLAttributes {
    'v-tooltip'?: string
  }
}
