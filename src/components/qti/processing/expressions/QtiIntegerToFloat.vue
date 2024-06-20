<template>
  <div class="qti-integer-to-float">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The integer to float conversion operator takes a single sub-expression which must
 * have single cardinality and base-type integer. The result is a value of base type
 * float with the same numeric value.
 * If the sub-expression is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiIntegerToFloat',

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      expression: null,
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
     * Validate the child node:
     * expressions (1)
     */
    validateChildren: function () {
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have exactly one Expression node')
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

      if (countExpressions !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
    },

    /**
     * Get the child node:
     * expressions (1)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      // Perform extra semantic validations on the expressions
      this.validateExpressions(children)

      children.forEach((expression) => {
        if (expression.component === null) return
        this.expression = expression.component.proxy
      })
    },

    validateExpressions (expressions) {
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy
        if (node.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be of cardinality="single"')
        }
        if (node.getBaseType() !== 'integer') {
          throw new QtiValidationException('Expression must be base-type="integer"')
        }
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        // If expression is NULL then the operator result is Null
        if (qtiProcessing.isNullValue(value)) {
          console.log('[IntegerToFloat][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        value = new BigNumber(value)

        if (value.isNaN()) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[IntegerToFloat][Value]', this.getValue())
          return this.getValue()
        }

        this.setValue(value.toNumber())
        console.log('[IntegerToFloat][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
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
