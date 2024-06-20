<template>
  <div class="qti-round">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The round operator takes a single sub-expression which must have single cardinality
 * and a numerical base-type. The result is a value of base-type integer formed by
 * rounding the value of the sub-expression. The result is the integer n for all input
 * values in the range [n-0.5,n+0.5). In other words, 6.8 and 6.5 both round up
 * to 7, 6.49 rounds down to 6 and -6.5 rounds up to -6. If the sub-expression is
 * NULL then the operator results in NULL. If the sub-expression is NaN, then the
 * result is NULL. If the sub-expression is INF, then the result is INF.
 * If the sub-expression is -INF, then the result is -INF.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRound',

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
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
        if (!qtiProcessing.isBaseTypeNumeric(node.getBaseType())) {
          throw new QtiValidationException('Expression must be a numeric base-type')
        }
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        // If expression is NULL then the operator result is Null
        if (qtiProcessing.isNullValue(value)) {
          console.log('[Round][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        value = new BigNumber(value)

        if (value.isNaN()) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[Round][Value]', this.getValue())
          return this.getValue()
        }

        if (value.toNumber() == Infinity) {
          this.setValue(Infinity)
          console.log('[Round][Value]', this.getValue())
          return this.getValue()
        }

        if (value.toNumber() == -Infinity) {
          this.setValue(Infinity)
          console.log('[Round][Value]', this.getValue())
          return this.getValue()
        }

        this.setValue(value.integerValue(BigNumber.ROUND_HALF_CEIL).toNumber())
        console.log('[Round][Value]', this.getValue())
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
