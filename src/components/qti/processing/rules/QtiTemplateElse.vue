<template>
  <div class="qti-template-else">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'Else' clause of the 'If..Then..Else' for the template processing
 * functionality. If the expression given in a templateIf or templateElseIf evaluates
 * to 'true' then the sub-rules contained within it are followed and any following
 * templateElseIf or responseElse parts are ignored for this template condition. If the
 * expression given in a templateIf or templateElseIf does not evaluate to 'true' then
 * consideration passes to the next responseElseIf or, if there are no more templateElseIf
 * parts then the sub-rules of the templateElse are followed (if specified).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateElse',

  data () {
    return {
      templateRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * Validate the child nodes:
     * templateRule (*)
     */
     validateChildren () {
      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Expression nodes not permitted: "' + slot.type.name + '"')
          }
          // Detect * Template Rules
          if (!qtiProcessing.isTemplateRuleNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid Template Rule node: "' + slot.type.name + '"')
          }
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * templateRule (*)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      children.forEach((rule) => {
        if (rule.component === null) return
        this.templateRules.push(rule.component.proxy)
      })
    },

    evaluate () {
      try {
        this.templateRules.forEach((rule) => {
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
