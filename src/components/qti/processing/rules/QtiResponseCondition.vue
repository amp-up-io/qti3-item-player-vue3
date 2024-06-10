<template>
  <div class="qti-response-condition">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This enables the 'If..Then..Else' rules to be defined for the response processing.
 * If the expression given in a responseIf or responseElseIf evaluates to 'true' then
 * the sub-rules contained within it are followed and any following responseElseIf or
 * responseElse parts are ignored for this response condition. If the expression given
 * in a responseIf or responseElseIf does not evaluate to 'true' then consideration
 * passes to the next responseElseIf or, if there are no more responseElseIf parts
 * then the sub-rules of the responseElse are followed (if specified).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiResponseCondition',

  data () {
    return {
      responseRules: [],
      isQtiValid: true
    }
  },

  methods: {
    
    /**
     * Validate the child nodes:
     * qti-response-if (1)
     * qti-response-else-if (*)
     * qti-response-else (0..1)
     */
    validateChildren () {
      // Must have at least 1
      let countResponseIf = 0
      // Must not have more than 1
      let countResponseElse = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have 1 qti-response-if node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // detect the slot type from the component tag
          switch (slot.type.name) {
            case 'QtiResponseIf':
              if (countResponseIf === 0) {
                countResponseIf = 1
              } else {
                throw new QtiValidationException('Only 1 qti-response-if node permitted')
              }
              break

            case 'QtiResponseElse':
              if (countResponseIf === 0) {
                throw new QtiValidationException('qti-response-else node not permitted before qti-response-if')
              }
              if (countResponseElse === 0) {
                countResponseElse = 1
              } else {
                throw new QtiValidationException('More than one qti-response-else node')
              }
              break

            case 'QtiResponseElseIf':
              if (countResponseIf === 0) {
                throw new QtiValidationException('qti-response-else-if node not permitted before qti-response-if')
              }
              if (countResponseElse === 1) {
                throw new QtiValidationException('qti-response-else-if node not permitted after qti-response-else')
              }
              break

            default:
              throw new QtiValidationException('Invalid Child Node: "' + slot.type.name + '"')
          }
        }
      })

      if (countResponseIf === 0) {
        throw new QtiValidationException('Must have 1 qti-response-if node')
      }
    },

    /**
     * Iterate through the child nodes:
     * qti-response-if (1)
     * qti-response-else-if (*)
     * qti-response-else (0..1)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children
      children.forEach((rule) => {
        this.responseRules.push(rule.component.proxy)
      })
    },

    evaluate () {
      try {
        this.responseRules.every(rule => {
          if (rule.evaluate()) {
            return false
          }
          return true
        })
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
