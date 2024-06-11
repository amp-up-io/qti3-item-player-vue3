<template>
  <div class="qti-gt">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The gt operator takes two sub-expressions which must both have single cardinality
 * and have a numerical base-type. The result is a single boolean with a value of true
 * if the first expression is numerically greater than the second and false if it is
 * less than or equal to the second.
 * If either sub-expression is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiGt',

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
     * @description Implements the "greater than" expression.  Returns true if
     * the firstValue is greater than the secondValue.  Returns false otherwise.
     * @param - firstValue, secondValue are BigNumber's
     * @return - boolean
	   */
    isGreaterThan (firstValue, secondValue) {
      return firstValue.isGreaterThan(secondValue)
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
        if (!qtiProcessing.isBaseTypeNumeric(node.getBaseType())) {
          throw new QtiValidationException('Expressions must be a numeric base-type')
        }
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[GT][Exp1][Exp2][Value]', (firstValue === null ? null : firstValue.valueOf()), (secondValue === null ? null : secondValue.valueOf()), this.getValue())
          return this.getValue()
        }

        firstValue = new BigNumber(firstValue)
        secondValue = new BigNumber(secondValue)
        this.setValue(this.isGreaterThan(firstValue, secondValue))

        console.log('[GT][Exp1][Exp2][Value]', firstValue.valueOf(), secondValue.valueOf(), this.getValue())
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
