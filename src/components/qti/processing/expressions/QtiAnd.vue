<template>
  <div class="qti-and">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the logic 'and' operation across one or more other operators. The and operator takes one
 * or more sub-expressions each with a base-type of boolean and single cardinality. The result is a single
 * boolean which is true if all sub-expressions are true and false if any of them are false.
 * If one or more sub-expressions are NULL and all others are true then the operator also 
 * results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiAnd',

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expressions: [],
      isQtiValid: true
    }
  },

  methods: {

    getValue () {
      return this.value
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return qtiProcessing.isNullValue(this.value)
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    /**
     * Validate the child nodes:
     * expressions (1-n)
     */
    validateChildren: function () {
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have at least one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpressions === 0) {
        throw new QtiValidationException('Must have at least one Expression node')
      }
    },

    /**
     * Iterate through the child nodes:
     * expressions (2)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      // Perform extra semantic validations on the expressions
      this.validateExpressions(children)

      children.forEach((expression) => {
        if (expression.component === null) return
        this.expressions.push(expression.component.proxy)
      })
    },

    validateExpressions (expressions) {
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy
        if (node.getCardinality() !== 'single') {
          throw new QtiValidationException('Expressions must be cardinality="single"')
        }
        if (node.getBaseType() !== 'boolean') {
          throw new QtiValidationException('Expressions must be base-type="boolean"')
        }
      })
    },

    evaluate () {
      try {
        let hasNullValues = false

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()
          // If one or more sub-expressions are NULL and all others are true then
          // the operator also results in NULL.
          if (qtiProcessing.isNullValue(value)) {
            hasNullValues = true
          } else if (value === false) {
            // Ok to bail early on false?
            console.log('[And] value:', false)
            this.setValue(false)
            return this.getValue()
          }
        }

        if (hasNullValues) {
          console.log('[And] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[And] value:', true)
        this.setValue(true)
        return this.getValue()
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
