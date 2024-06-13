<template>
  <div class="qti-sum">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'sum' function on the enclosed set of expressions. The sum operator takes 1 or more
 * sub-expressions which all have numerical base-types and may have single, multiple or ordered cardinality.
 * The result is a single float or, if all sub-expressions are of integer type, a single integer that
 * corresponds to the sum of the numerical values of the sub-expressions. If any of the sub-expressions
 * are NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiSum',

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

    setBaseType (baseType) {
      this.valueBaseType = baseType
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
        if (!qtiProcessing.isBaseTypeNumeric(node.getBaseType())) {
          throw new QtiValidationException('Expressions must be a numeric base-type')
        }
        if (node.getBaseType() === 'float') {
          this.setBaseType('float')
        }
        if ((node.getCardinality() !== 'single') && (node.getCardinality() !== 'multiple') && (node.getCardinality() !== 'ordered')) {
          throw new QtiValidationException('Expressions must be of cardinality "single", "multiple", or "ordered"')
        }
      })
    },

    evaluate () {
      try {
        let baseType = 'integer'
        let sum = new BigNumber(0)

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          // If a sub-expression is NULL then the operator result is Null
          if (qtiProcessing.isNullValue(value)) {
            console.log('[Sum][' + this.getBaseType() + '] value:', null)
            this.setValue(qtiProcessing.nullValue())
            return this.getValue()
          }

          if (this.expressions[i].getBaseType() !== 'integer') {
            baseType = 'float'
          }

          let cardinality = this.expressions[i].getCardinality()
          if (cardinality === 'single') {
            sum = sum.plus(value)
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            for (let j = 0; j < value.length; j++) {
              // If a sub-expression is NULL then the operator result is Null
              if (qtiProcessing.isNullValue(value[j])) {
                console.log('[Sum][' + this.getBaseType() + '] value:', null)
                this.setValue(qtiProcessing.nullValue())
                return this.getValue()
              } else {
                sum = sum.plus(value[j])
              }
            }
          }
        }

        if (baseType === 'integer') {
          console.log('[Sum][Integer] value:', sum.toNumber())
          if (!sum.isInteger()) {
            throw new QtiEvaluationException('Expressions did not produce an integer value')
          }
          this.setBaseType('integer')
          this.setValue(sum.toNumber())
          return this.getValue()
        }

        console.log('[Sum][Float] value:', sum.toNumber())
        this.setBaseType('float')
        this.setValue(sum.toNumber())
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
