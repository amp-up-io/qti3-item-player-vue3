<template>
  <div class="qti-multiple">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The multiple operator takes 0 or more sub-expressions all of which must have either single or multiple
 * cardinality. Although the sub-expressions may be of any base-type they must all be of the same base-type.
 * The result is a container with multiple cardinality containing the values of the sub-expressions,
 * sub-expressions with multiple cardinality have their individual values added to the result: containers
 * cannot contain other containers. For example, when applied to A, B and {C,D} the multiple operator
 * results in {A,B,C,D}. All sub-expressions with NULL values are ignored. If no sub-expressions are given (or all are NULL) then the result is NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMultiple',

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'multiple',
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
     * expressions (0-n)
     */
    validateChildren: function () {
      // May have 0 expressions
      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (!qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * expressions (0-n)
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
      let baseType = null
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy
        const cardinality = node.getCardinality()
        if ((cardinality !== 'single') && (cardinality !== 'multiple')) {
          throw new QtiValidationException('Expressions must be of cardinality="single" or cardinality="multiple"')
        } else {
          if (baseType === null) {
            baseType = node.getBaseType()
          } else if (baseType !== node.getBaseType()) {
            throw new QtiValidationException('Expressions not all the same base-type: "' + baseType + '"')
          }
        }
      })
      this.setBaseType(baseType)
    },

    evaluate () {
      try {
        let container = []

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          let cardinality = this.expressions[i].getCardinality()

          // Add all non-null expressions to container.
          if (cardinality === 'single') {
            if (value !== null) {
              container.push(value)
            }
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            if (value !== null) {
              for (let j = 0; j < value.length; j++) {
                if (value[j] !== null) {
                  container.push(value[j])
                }
              }
            }
          }
        }

        // container with no elements --> null
        if (container.length === 0) {
          this.setValue(qtiProcessing.nullValue())
        } else {
          this.setValue(container)
        }
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
