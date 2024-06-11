<template>
  <div class="qti-delete">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-delete operator takes two sub-expressions which must both have the same base-type. The first
 * sub-expression must have single cardinality and the second must be a multiple or ordered container.
 * The result is a new container derived from the second sub-expression with all instances of the first
 * sub-expression removed. For example, when applied to A and {B,A,C,A} the result is the container {B,C}.
 * If either sub-expression is NULL the result of the operator is NULL. The restrictions that apply to the
 * qti-member operator also apply to the qti-delete operator.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiDelete',

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
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

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },

    /**
     * Validate the child nodes:
     * expressions (2)
     */
    validateChildren: function () {
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('[Delete] Must have two Expression nodes')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('[Delete] Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpressions !== 2) {
        throw new QtiValidationException('[Delete] Must have two Expression nodes')
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
      let first = true
      let firstExpression = null
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy

        if (first) {
          first = false
          firstExpression = node
          if (node.getCardinality() !== 'single') {
            throw new QtiValidationException('[Delete] First expression must be cardinality="single"')
          }
          if (node.getBaseType() === 'duration') {
            throw new QtiValidationException('[Delete] First expression of base-type="duration" not permitted')
          }
          this.setBaseType(node.getBaseType())
        } else {
          if (firstExpression.getBaseType() !== node.getBaseType()) {
            throw new QtiValidationException('[Delete] Expressions must be of same base-type')
          }
          if ((node.getCardinality() !== 'multiple') && (node.getCardinality() !== 'ordered')) {
            throw new QtiValidationException('[Delete] Second expression must be cardinality="multiple" or cardinality="ordered"')
          }
          if (node.getBaseType() === 'duration') {
            throw new QtiValidationException('[Delete] Second expression of base-type="duration" not permitted')
          }
          this.setCardinality(node.getCardinality())
        }
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          console.log('[Delete][Value]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let baseType = this.expressions[0].getBaseType()

        // Strategy: build a new container, skipping elements that match firstValue
        let value = []
        for (let i = 0; i < secondValue.length; i++) {
          if (!qtiProcessing.isNullValue(secondValue[i])) {
            if (!qtiProcessing.isSingleValuesMatch(baseType, firstValue, secondValue[i])) {
              value.push(secondValue[i])
            }
          }
        }

        // If empty container, return nullValue
        if (value.length === 0) {
          console.log('[Delete][Value]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Delete][Value]', value)
        this.setValue(value)
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
