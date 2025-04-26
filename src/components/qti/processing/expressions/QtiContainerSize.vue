<template>
  <div class="qti-container-size">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The containerSize operator takes a sub-expression with any base-type and either multiple 
 * or ordered cardinality. The result is an integer giving the number of values in the 
 * sub-expression, in other words, the size of the container. If the sub-expression is 
 * NULL the result is 0. This operator can be used for determining how many choices were 
 * selected in a multiple-response choiceInteraction, for example.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiContainerSize',

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
      valueCardinality: 'single',
      expression: null,
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
      return false
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    /**
     * Validate the child node:
     * expressions (1)
     */
    validateChildren: function () {
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('[ContainerSize] Must have exactly one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('[ContainerSize] Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpressions !== 1) {
        throw new QtiValidationException('[ContainerSize] Must have exactly one Expression node')
      }
    },

    /**
     * Get the child node:
     * expressions (1)
     */
     processChildren () {
      const children = this.$.subTree.children[0].children

      // Perform extra semantic validations on the expression
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
        const cardinality = node.getCardinality()
        if ((cardinality !== 'multiple') && (cardinality !== 'ordered')) {
          throw new QtiValidationException('[ContainerSize] Expression must be of cardinality="multiple" or cardinality="ordered"')
        }
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[ContainerSize][Value]', 0)
          this.setValue(0)
          return this.getValue()
        }

        this.setValue(value.length)
        console.log('[ContainerSize][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        this.value = null
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
