<script>
export default {
  name: 'EventListener',

  emits: [
    'templateProcessingReady',
    'itemBodyReady'
  ],

  setup(props, context) {
    return () => context.slots.default?.() ?? null
  }
}
</script>
