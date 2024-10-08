<template>
  <div class="qti-template-processing">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Template processing consists of one or more templateRules that are followed by the cloning engine or
 * delivery system in order to assign values to the template variables. Template processing is identical in
 * form to responseProcessing except that the purpose is to assign values to template variables,
 * not outcome variables.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateProcessing',

  emits: [
    'templateProcessingReady'
  ],

  data () {
    return {
      templateRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * @description If a qti-template-constraint is 'false' (including if the expression is NULL),
     * the template variables are set to their default values and templateProcessing is restarted;
     */
    resetTemplateProcessing () {
      // Reset template variables
      store.resetTemplateVariables()
      // Restart the processing
      this.evaluate()
    },

    /**
     * Validate the child nodes:
     * qti-set-template-value
     * qti-exit-template
     * qti-template-condition
     * qti-set-default-value
     * qti-set-correct-response
     * qti-template-constraint
     */
     validateChildren () {
      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          if (!qtiProcessing.isTemplateRuleNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid Template Rule: "' + slot.type.name + '"')
          }
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * qti-set-template-value
     * qti-exit-template
     * qti-template-condition
     * qti-set-default-value
     * qti-set-correct-response
     * qti-template-constraint
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
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          console.log('[' + err.name + '] ' + err.message)
        } else if (err.name === 'QtiTemplateConstraintException') {
          this.resetTemplateProcessing()
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
    try {
      // Validate the Template Rules
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
        // Process all Response Rules in this RP.
        this.processChildren()

        // Notify item we have a template processing node.
        this.$parent.$emit('templateProcessingReady', { templateProcessing: this })
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
