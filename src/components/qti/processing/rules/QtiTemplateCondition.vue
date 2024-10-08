<template>
  <div class="qti-template-condition">
    <slot></slot>
  </div>
</template>

<script>
/*
 * If the expression given in a templateIf or templateElseIf evaluates to true then the sub-rules contained
 * within it are followed and any following templateElseIf or templateElse parts are ignored for this template
 * condition. If the expression given in a templateIf or templateElseIf does not evaluate to true then consideration passes
 * to the next templateElseIf or, if there are no more templateElseIf parts then the sub-rules of the templateElse
 * are followed (if specified).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiTemplateCondition',

  data () {
    return {
      templateRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * Validate the child nodes:
     * qti-template-if (1)
     * qti-template-else-if (*)
     * qti-template-else (0..1)
     */
    validateChildren () {
      // Must have at least 1
      let countTemplateIf = 0
      // Must not have more than 1
      let countTemplateElse = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have 1 qti-template-if node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // detect the slot type from the component tag
          switch (slot.type.name) {
            case 'QtiTemplateIf':
              if (countTemplateIf === 0) {
                countTemplateIf = 1
              } else {
                throw new QtiValidationException('Only 1 qti-template-if node permitted')
              }
              break

            case 'QtiTemplateElse':
              if (countTemplateIf === 0) {
                throw new QtiValidationException('qti-template-else node not permitted before qti-template-if')
              }
              if (countTemplateElse === 0) {
                countTemplateElse = 1
              } else {
                throw new QtiValidationException('More than one qti-template-else node')
              }
              break

            case 'QtiTemplateElseIf':
              if (countTemplateIf === 0) {
                throw new QtiValidationException('qti-template-else-if node not permitted before qti-template-if')
              }
              if (countTemplateElse === 1) {
                throw new QtiValidationException('qti-template-else-if node not permitted after qti-template-else')
              }
              break

            default:
              throw new QtiValidationException('Invalid Child Node: "' + slot.type.name + '"')
          }
        }
      })

      if (countTemplateIf === 0) {
        throw new QtiValidationException('Must have 1 qti-template-if node')
      }
    },

    /**
     * Iterate through the child nodes:
     * qti-template-if (1)
     * qti-template-else-if (*)
     * qti-template-else (0..1)
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
        this.templateRules.every(rule => {
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
