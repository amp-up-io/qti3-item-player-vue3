<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
/*
 * Converts an argument of base-type string with single cardinality to
 * a result of base-type float with single cardinality.  If the argument
 * is NULL or NaN, then the result is NULL
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'MathStringToFloat',

  emits: [
    'customOperatorReady'
  ],

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      expression: null
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

    setCardinality (cardinality) {
      this.cardinality = cardinality
    },

    /**
     * Validate the child node:
     * expressions (1)
     */
    validateChildren: function () {
      let countExpressions = 0

      // We always have a default slot.  Look down a level to see if any possible
      // expressions exist.
      if (this.$slots.default()[0].children.length === 0) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }

      // Go down a level
      const slots = this.$slots.default()[0].children[0].children

      slots.forEach((slot) => {
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
        if (node.getBaseType() !== 'string') {
          throw new QtiValidationException('Expression must be base-type="string"')
        }
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[math.StringToFloat][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        value = new BigNumber(value)

        if (value.isNaN()) {
          console.log('[math.StringToFloat][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        this.setValue(value.toNumber())
        console.log('[math.StringToFloat][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.nae === 'QtiEvaluationException') {
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
    try {
      this.processChildren()

      // Notify the customOperator parent, and pass our evaluate function
      this.$parent.$emit('customOperatorReady', {
        baseType: this.getBaseType(),
        cardinality: this.getCardinality(),
        evaluate: this.evaluate
      })

    } catch (err) {
      throw new QtiValidationException(err.message)
    }
  }
}
</script>
