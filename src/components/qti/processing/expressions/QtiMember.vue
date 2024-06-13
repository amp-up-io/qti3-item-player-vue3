<template>
  <div class="qti-member">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-member operator takes two sub-expressions which must both have the same base-type.
 * The first sub-expression must have single cardinality and the second must be a multiple or
 * ordered container. The result is a single boolean with a value of true if the value given
 * by the first sub-expression is in the container defined by the second sub-expression. If either
 * sub-expression is NULL then the result of the operator is NULL. The member operator should not
 * be used on sub-expressions with a base-type of float because of the poorly defined comparison
 * of values. It must not be used on sub-expressions with a base-type of duration.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMember',

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
            throw new QtiValidationException('First expression must be cardinality="single"')
          }
          if (node.getBaseType() === 'duration') {
            throw new QtiValidationException('First expression of base-type="duration" not permitted')
          }
        } else {
          if (firstExpression.getBaseType() !== node.getBaseType()) {
            throw new QtiValidationException('Expressions must be of same base-type')
          }
          if ((node.getCardinality() !== 'multiple') && (node.getCardinality() !== 'ordered')) {
            throw new QtiValidationException('Second expression must be cardinality="multiple" or cardinality="ordered"')
          }
          if (node.getBaseType() === 'duration') {
            throw new QtiValidationException('Second expression of base-type="duration" not permitted')
          }
        }
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          console.log('[Member]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let baseType = this.expressions[0].getBaseType()

        console.log('[Member][Exp1][Exp2]', firstValue, secondValue)
        for (let i = 0; i < secondValue.length; i++) {
          if (!qtiProcessing.isNullValue(secondValue[i])) {
            if (qtiProcessing.isSingleValuesMatch(baseType, firstValue, secondValue[i])) {
              console.log('[Member]', true)
              this.setValue(true)
              return this.getValue()
            }
          }
        }

        console.log('[Member]', false)
        this.setValue(false)
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
