<template>
  <div class="qti-min">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The min operator takes 1 or more sub-expressions which all have numerical
 * base-types and may have single, multiple or ordered cardinality. The result
 * is a single float, or, if all sub-expressions are of integer type, a single integer,
 * equal in value to the smallest of the argument values, i.e. the result is the
 * argument closest to negative infinity. If the arguments have the same value,
 * the result is that same value. If any of the sub-expressions is NULL, the result
 * is NULL. If any of the sub-expressions is not a numerical value, then the result
 * is NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMin',

  data () {
    return {
      value: null,
      valueBaseType: null,
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
        throw new QtiValidationException('Must have one or more Expression nodes')
      }
    },

    /**
     * Iterate through the child nodes:
     * expressions (1-n)
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
      // Integer base-type unless an expression is float
      this.setBaseType('integer')

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
        this.setBaseType('integer')
        let min = new BigNumber(Infinity)

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          // If a sub-expression is NULL then the operator result is Null
          if (qtiProcessing.isNullValue(value)) {
            console.log('[Min][' + this.getBaseType() + ']', null)
            this.setValue(qtiProcessing.nullValue())
            return this.getValue()
          }

          if (this.expressions[i].getBaseType() !== 'integer') {
            this.setBaseType('float')
          }

          let cardinality = this.expressions[i].getCardinality()
          if (cardinality === 'single') {
            min = (min.comparedTo(value) > 0) ? new BigNumber(value) : min
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            for (let j = 0; j < value.length; j++) {
              // If a sub-expression is NULL then the operator result is Null
              if (qtiProcessing.isNullValue(value[j])) {
                console.log('[Min][' + this.getBaseType() + ']', null)
                this.setValue(qtiProcessing.nullValue())
                return this.getValue()
              } else {
                min = (min.comparedTo(value[j]) > 0) ? new BigNumber(value[j]) : min
              }
            }
          }
        }

        if (this.getBaseType() === 'integer') {
          console.log('[Min][Integer]', min.toNumber())
          if (!min.isInteger()) {
            throw new QtiEvaluationException('Expressions did not produce an integer value')
          }
          this.setValue(min.toNumber())
          return this.getValue()
        }

        console.log('[Min][Float]', min.toNumber())
        this.setValue(min.toNumber())
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
