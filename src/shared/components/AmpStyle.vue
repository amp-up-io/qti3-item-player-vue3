<script>
import { h } from 'vue'
export default {
  name: 'AmpStyle',

  render() {
    return h('style', {}, this.$slots.default())
  }
}
</script>
