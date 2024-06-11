<template>
  <div class="qti-exit-response">
  </div>
</template>

<script>
/*
 * The Exit Response rule terminates Response Processing immediately (for this invocation).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

export default {
  name: 'QtiExitResponse',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    evaluate () {
      throw new QtiExitProcessingException('qti-exit-response')
    }
  },

  created () {
    try {
      this.validateChildren()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
  }
}
</script>
