<template>
  <div class="qti-lcm">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The lcm operator takes 1 or more sub-expressions which all have base-type integer
 * and may have single, multiple or ordered cardinality. The result is a single integer
 * equal in value to the lowest common multiple (lcm) of the argument values. If any
 * argument is zero, the result is 0, lcm(0,n)=0; authors should beware of this in
 * calculations which require division by the lcm of random values. If any of the
 * sub-expressions is NULL, the result is NULL. If any of the sub-expressions is
 * not a numerical value, then the result is NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiLcm',

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
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy
        if (node.getBaseType() !== 'integer') {
          throw new QtiValidationException('Expressions must be base-type="integer"')
        }
        if ((node.getCardinality() !== 'single') && (node.getCardinality() !== 'multiple') && (node.getCardinality() !== 'ordered')) {
          throw new QtiValidationException('Expressions must be of cardinality "single", "multiple", or "ordered"')
        }
      })
    },

    evaluate () {
      try {
        let container = []

        // Build a monolithic array of all expression values.
        // Load all expressions and sub-expressions into the container.
        for (let i = 0; i < this.expressions.length; i++) {
          const value = this.expressions[i].evaluate()

          // If a sub-expression is NULL then the operator result is Null
          if (qtiProcessing.isNullValue(value)) {
            console.log('[Lcm]', null)
            this.setValue(qtiProcessing.nullValue())
            return this.getValue()
          }

          // Add all expressions and sub-expressions to container.
          const cardinality = this.expressions[i].getCardinality()
          if (cardinality === 'single') {
            container.push(value)
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            for (let j = 0; j < value.length; j++) {
              container.push(value[j])
            }
          }
        }

        const lcm = qtiProcessing.generalizedLcm(container.length, container)
        console.log('[Lcm][container]', lcm, container)
        this.setValue(lcm)
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
