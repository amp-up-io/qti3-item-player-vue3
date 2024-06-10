<template>
  <div class="qti-response-if">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'If' clause of the 'If..Then..Else' for the response processing functionality.
 * A responseIf part consists of an expression which must have an effective baseType of boolean and single
 * cardinality. It also contains a set of sub-rules. If the expression is true then the sub-rules are
 * processed, otherwise they are skipped (including if the expression is NULL) and the following
 * responseElseIf or responseElse parts (if any) are considered instead.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseIf',

  data () {
    return {
      expression: null,
      responseRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * Validate the child nodes:
     * expression (1)
     * responseRule (*)
     */
    validateChildren () {
      let countExpression = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            if (countExpression === 0) {
                countExpression = 1
            } else {
              throw new QtiValidationException('Multiple Expression nodes: "' + slot.type.name + '"')
            }
          }
          // Detect * Response Rules after the Expression
          else if (qtiProcessing.isResponseRuleNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            if (countExpression === 0) {
              throw new QtiValidationException('Response Rules must follow an Expression node: "' + slot.type.name + '"')
            }
          } else {
            throw new QtiValidationException('Node is not an Expression or a Response Rule: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpression === 0) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
    },

    /**
     * Iterate through the child nodes:
     * expression (1)
     * responseRule (*)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      let firstRule = true
      children.forEach((rule) => {
        const node = rule.component.proxy
        if (firstRule) {
          firstRule = false
          this.expression = node
        } else {
          this.responseRules.push(node)
        }
      })
    },

    evaluate () {
      try {
        if (this.expression.evaluate()) {
          this.responseRules.forEach((rule) => {
            rule.evaluate()
          })
          return true
        }
        return false
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
