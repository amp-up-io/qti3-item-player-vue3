<template>
  <div class="qti-integer-divide">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The integer divide operator takes 2 sub-expressions which both have single cardinality and base-type integer.
 * The result is the single integer that corresponds to the first expression (x) divided by the second expression (y)
 * rounded down to the greatest integer (i) such that i LTE (x/y). If y is 0, or if either of the sub-expressions
 * is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiIntegerDivide',

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
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
     * expressions (2)
     */
    validateChildren: function () {
      // Must have 2
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have two Expression nodes')
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

      if (countExpressions !== 2) {
        throw new QtiValidationException('Must have exactly two Expression nodes')
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
        if (node.getBaseType() !== 'integer') {
          throw new QtiValidationException('Expressions must be base-type="integer"')
        }
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[IntegerDivide][Value]', this.getValue())
          return this.getValue()
        }

        firstValue = new BigNumber(firstValue)
        secondValue = new BigNumber(secondValue)

        if (secondValue.isZero()) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[IntegerDivide][Value]', this.getValue())
          return this.getValue()
        }

        this.setValue(firstValue.dividedToIntegerBy(secondValue).toNumber())
        console.log('[IntegerDivide][Value]', this.getValue())
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
