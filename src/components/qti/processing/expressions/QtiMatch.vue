<template>
  <div class="qti-match">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The match operator takes two sub-expressions which must both have the same base-type and cardinality.
 * The result is a single boolean with a value of true if the two expressions represent the same value and
 * false if they do not. If either sub-expression is NULL then the operator results in NULL.

 * The match operator must not be confused with broader notions of equality such as numerical equality.
 * To avoid confusion, the match operator should not be used to compare subexpressions with base-types of
 * float and must not be used on sub-expressions with a base-type of duration.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMatch',

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

    validateExpressions (expressions) {
      let first = true
      let firstExpression = null
      expressions.forEach((expression) => {
        const node = expression.component.proxy
        if (first) {
          first = false
          firstExpression = node
        } else {
          if (firstExpression.getBaseType() !== node.getBaseType()) {
            throw new QtiValidationException('Expressions must be of same base-type')
          }
          if (firstExpression.getCardinality() !== node.getCardinality()) {
            throw new QtiValidationException('Expressions must be of same cardinality')
          }
          if (node.getBaseType() === 'duration') {
            throw new QtiValidationException('Expressions of base-type duration not permitted')
          }
        }
      })
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
        this.expressions.push(expression.component.proxy)
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let firstExpression = this.expressions[0]

        if (firstExpression.getCardinality() == 'single') {
          return qtiProcessing.isSingleValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'multiple') {
          return qtiProcessing.isMultipleValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'ordered') {
          return qtiProcessing.isOrderedValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'record') {
          // TODO:
          JSON.stringify(firstValue) === JSON.stringify(secondValue)
        }
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
