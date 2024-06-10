<template>
  <div class="qti-response-else">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'Else' clause of the 'If..Then..Else' for the response processing
 * functionality. If the expression given in a responseIf or responseElseIf evaluates
 * to 'true' then the sub-rules contained within it are followed and any following
 * responseElseIf or responseElse parts are ignored for this response condition. If the
 * expression given in a responseIf or responseElseIf does not evaluate to 'true' then
 * consideration passes to the next responseElseIf or, if there are no more responseElseIf
 * parts then the sub-rules of the responseElse are followed (if specified).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseElse',

  data () {
    return {
      responseRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * Validate the child nodes:
     * responseRule (*)
     */
    validateChildren () {
      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Expression nodes not permitted: "' + slot.type.name + '"')
          }
          // Detect * Response Rules
          if (!qtiProcessing.isResponseRuleNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid Response Rule node: "' + slot.type.name + '"')
          }
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * responseRule (*)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      children.forEach((rule) => {
        if (rule.component === null) return
        this.responseRules.push(rule.component.proxy)
      })
    },

    evaluate () {
      try {
        this.responseRules.forEach((rule) => {
          rule.evaluate()
        })
        return true
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          throw new QtiExitProcessingException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
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
    if (this.isQtiValid) {
      try {
        this.processChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
