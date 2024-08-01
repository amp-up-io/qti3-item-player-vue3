<template v-slot:prompt>
  <div class="qti-prompt">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'QtiPrompt'
}
</script>

<style>
div.qti-prompt {
  display: block;
  width: 100%;
  margin: 0 0 .5rem 0;
}

.qti3-player-writing-mode-vertical-rl div.qti-prompt {
  display: block;
  height: 100%;
  margin: 0 0 8px 0;
}
</style>
