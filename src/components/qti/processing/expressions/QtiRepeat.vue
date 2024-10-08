<template>
  <div class="qti-repeat">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The repeat operator takes 0 or more sub-expressions, all of which must have
 * either single or ordered cardinality and the same baseType. The result is an
 * ordered container having the same baseType as its sub-expressions.
 * The container is filled sequentially by evaluating each sub-expression
 * in turn and adding the resulting single values to the container, iterating
 * this process numberRepeats times in total. If number-repeats refers to a
 * variable whose value is less than 1, the value of the whole expression is NULL.
 * Any sub-expressions evaluating to NULL are ignored. If all sub-expressions are
 * NULL then the result is NULL.
 */
import { store } from '@/store/store'
import { teststore } from '@/store/teststore'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRepeat',

  props: {
    /*
     * Defines the number of iterations applied to the processing of the contents.
     * May be an integer or a template variable identifier.
     */
    numberRepeats: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'ordered',
      expressions: [],
      // This resolves to an integer if number-repeats is not an identifier
      valueNumberRepeats: null,
      processingContext: null,
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

    getStore () {
      return (this.processingContext === 'TEST') ? teststore : store
    },

    validateAttributes() {
      // Resolve the number-repeats attribute.
      // First, try to resolve it as an integer.
      try {
        this.valueNumberRepeats = qtiAttributeValidation.validateIntegerAttribute('number-repeats', this.numberRepeats, true, 0)
        return
      } catch (err) {
        if (err.name !== 'QtiParseException') {
          throw new Error(err.message)
        }
      }
      // We know that number-repeats was not an integer value.
      // It must be an identifier that resolves to a properly-declared
      // template variable or outcome variable.
      try {
        qtiAttributeValidation.validateIdentifierAttribute(this.numberRepeats)
        const declarationNumberRepeats = qtiAttributeValidation.validateTemplateOrOutcomeIdentifierAttribute(this.getStore(), this.numberRepeats)
        if ((declarationNumberRepeats.baseType !== 'integer') || (declarationNumberRepeats.cardinality !== 'single')) {
          throw new QtiValidationException('[Repeat] Attribute "number-repeats" template or outcome variable must be base-type="integer" and cardinality="single"')
        }
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiParseException') {
          throw new QtiParseException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    },

    /**
     * Validate the child nodes:
     * expressions (1-n)
     */
    validateChildren: function () {
      let countExpressions = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('[Repeat] Must have at least one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('[Repeat] Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpressions === 0) {
        throw new QtiValidationException('[Repeat] Must have at least one Expression node')
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
      let baseType = null
      expressions.forEach((expression) => {
        if (expression.component === null) return
        const node = expression.component.proxy
        const cardinality = node.getCardinality()
        if ((cardinality !== 'single') && (cardinality !== 'ordered')) {
          throw new QtiValidationException('[Repeat] Expressions must be of cardinality="single" or cardinality="ordered"')
        } else {
          if (baseType === null) {
            baseType = node.getBaseType()
          } else if (baseType !== node.getBaseType()) {
            throw new QtiValidationException('[Repeat] Expressions not all the same base-type: "' + baseType + '"')
          }
        }
      })
      this.setBaseType(baseType)
    },

    evaluate () {
      try {
        let container = []

        // Resolve number-repeats
        const repeatsValue = this.getNumberRepeatsValue()

        // If number-repeats refers to a variable whose value is less than 1,
        // the value of the whole expression is NULL.
        if (repeatsValue < 1) {
          console.log('[Repeat][' + repeatsValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        // Iterate for numberRepeats over the expressions
        for (let r = 0; r < repeatsValue; r++) {
          // Loop through all the expressions
          for (let i = 0; i < this.expressions.length; i++) {
            let value = this.expressions[i].evaluate()

            let cardinality = this.expressions[i].getCardinality()

            // Add all non-null expressions to container.
            if (cardinality === 'single') {
              if (value !== null) {
                container.push(value)
              }
            } else if (cardinality === 'ordered') {
              if (value !== null) {
                for (let j = 0; j < value.length; j++) {
                  if (value[j] !== null) {
                    container.push(value[j])
                  }
                }
              }
            }
          }
        }

        // container with no elements --> null
        if (container.length === 0) {
          console.log('[Repeat][' + repeatsValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Repeat][' + repeatsValue + ']', container)
        this.setValue(container)
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
    },

    /**
     * @description Utility method to resolve a number-repeats
     * value from an integer or a template declaration.
     */
    getNumberRepeatsValue () {
      if (this.valueNumberRepeats !== null) {
        return (this.valueNumberRepeats)
      }
      const declaration = this.getStore().getVariableDeclaration(this.numberRepeats)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
    }

  },

  created () {
    try {
      this.processingContext = qtiProcessing.computeProcessingContext(this)
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
