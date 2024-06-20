<template>
  <div class="qti-round-to">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The roundTo operator takes one sub-expression which must have single cardinality and a numerical
 * base-type. The result is a single float with the value nearest to that of the expression's value
 * such that when converted to a decimal string it represents the expression rounded by the specified
 * rounding method to the specified precision. If the sub-expression is NULL, then the result is NULL.
 * If the sub-expression is INF, then the result is INF. If the sub-expression is -INF, then the
 * result is -INF. If the argument is NaN, then the result is NULL. When rounding to n significant
 * figures, the deciding digit is the (n+1)th digit counting from the first non-zero digit from
 * the left in the number. If the deciding digit is 5 or greater, the nth digit is increased by
 * 1 and all digits to its right are discarded; if the deciding digit is less than 5, all digits
 * to the right of the nth digit are discarded. When rounding to n decimal places, the deciding
 * digit is the (n+1)th digit counting to the right from the decimal point. If the deciding digit
 * is 5 or greater, the nth digit is increased by 1 and all digits to its right are discarded; if
 * the deciding digit is less than 5, all digits to the right of the nth digit are discarded.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRoundTo',

  props: {
    /*
     * Enumerated value set of: { decimalPlaces | significantFigures }
     * decimalPlaces - Use a number of decimal places.
     * significantFigures - The number of significant decimal places.
     */
    roundingMode: {
      type: String,
      required: true
    },
    /*
     * 	The number of figures to round to. If rounding-mode="significantFigures", the value
     * of figures must be a non-zero positive integer. If rounding-mode="decimalPlaces", the
     * value of figures must be an integer greater than or equal to zero.
     */
    figures: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      expression: null,
      valueFigures: null,
      isFiguresIdentifier: false,
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

    validateAttributes() {
      qtiAttributeValidation.validateRoundingModeAttribute(this.roundingMode)

      // Figures may resolve to an integer or to a template or outcome variable identifier
      // TODO: Perform attribute validation that includes a variable identifier reference
      // For now, only resolve integer values.
      this.valueFigures = qtiAttributeValidation.validateIntegerAttribute('figures', this.figures, true, 1)

      if ((this.valueFigures !== null) && (this.valueFigures < 1)) {
        throw new QtiValidationException('Attribute "figures" must be positive')
      }

      this.isFiguresIdentifier = (typeof this.valueFigures === 'string')
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
          console.log('[RoundTo][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let valueRoundTo = new BigNumber(value)

        switch (this.roundingMode) {
          case 'decimalPlaces':
            this.setValue( valueRoundTo.decimalPlaces(this.valueFigures, BigNumber.ROUND_HALF_UP).toNumber() )
            break
          case 'significantFigures':
            this.setValue( valueRoundTo.precision(this.valueFigures, BigNumber.ROUND_HALF_UP).toNumber() )
            break
          default:
            throw new QtiEvaluationException('Unexpected rounding mode: "' + this.roundingMode + '"')
        }

        console.log('[RoundTo][Value]', this.getValue())
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
      this.validateAttributes()
      this.validateChildren()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
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
