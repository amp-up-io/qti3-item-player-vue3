<template>
  <div class="qti-anyn">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-any-n operator takes one or more sub-expressions each with a base-type of boolean
 * and single cardinality. The result is a single boolean which is 'true' if at least min of
 * the sub-expressions are 'true' and at most max of the sub-expressions are 'true'. If more
 * than n - min sub-expressions are 'false' (where n is the total number of sub-expressions)
 * or more than max sub-expressions are 'true' then the result is 'false'. If one or more
 * sub-expressions are NULL then it is possible that neither of these conditions is satisfied,
 * in which case the operator results in NULL. For example, if min is 3 and max is 4 and the
 * sub-expressions have values {true,true,false,NULL} then the operator results in NULL
 * whereas {true,false,false,NULL} results in false and {true,true,true,NULL} results in 'true'.
 * The result NULL indicates that the correct value for the operator cannot be determined.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiAnyN',

  props: {
    /*
     * The minimum number of sub-expressions that must be true.
     */
    min: {
      type: String,
      required: true
    },
    /*
     * 	The maximum number of sub-expressions that must be true.
     */
    max: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expressions: [],
      valueMin: null,
      // Set to true if min resolves to a variable identifier
      isMinIdentifier: false,
      valueMax: null,
      // Set to true if max resolves to a variable identifier
      isMaxIdentifier: false,
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

    validateMinMaxAttribute(attributeName, attributeValue) {
      let declaration
      let isIdentifier = false

      // Try and resolve attribute as an identifier
      try {
        declaration =  qtiAttributeValidation.validateVariableIdentifierAttribute(store, attributeValue)
        // If we get to this line of code then we believe that the attribute is
        // a variable identifier, not an integer value
        isIdentifier = true
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          // NOOP
        } else {
          throw new Error(err.message)
        }
      }

      if (isIdentifier) {
        if ((declaration.baseType !== 'integer') || (declaration.cardinality !== 'single')) {
          throw new QtiValidationException('[AnyN] Invalid "' + attributeName + '" attribute.  The referenced variable must be of base-type "integer" and cardinality "single"')
        }

        if (attributeName === 'min') {
          this.isMinIdentifier = true
          return
        }

        if (attributeName === 'max') {
          this.isMaxIdentifier = true
          return
        }
      }

      // Try to parse the attribute as an integer.
      let value = qtiAttributeValidation.validatePositiveIntegerAttribute('min', attributeValue, true)

      if (attributeName === 'min') {
        this.valueMin = value
        return
      }

      if (attributeName === 'max') {
        this.valueMax = value
        return
      }
    },

    validateAttributes() {
      this.validateMinMaxAttribute('min', this.min)
      this.validateMinMaxAttribute('max', this.max)
      if (!this.isMinIdentifier && !this.isMaxIdentifier) {
        if (this.valueMax < this.valueMin) {
          throw new QtiValidationException('[AnyN] Invalid "max" and "min" attributes.  "max" (' + this.max  + ') must be greater than or equal to "min" (' + this.min + ')')
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
        throw new QtiValidationException('[AnyN] Must have at least one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('[AnyN] Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpressions === 0) {
        throw new QtiValidationException('[AnyN] Must have at least one Expression node')
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
        if (node.getCardinality() !== 'single') {
          throw new QtiValidationException('[AnyN] Expressions must be cardinality="single"')
        }
        if (node.getBaseType() !== 'boolean') {
          throw new QtiValidationException('[AnyN] Expressions must be base-type="boolean"')
        }
      })
    },

    evaluate () {
      try {
        let numberOfNull = 0
        let numberOfTrue = 0

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          if (qtiProcessing.isNullValue(value)) {
            numberOfNull += 1
          } else if (value) {
            numberOfTrue += 1
          }
        }

        const minimum = this.getMinValue()
        let maximum = this.getMaxValue()
        maximum = (maximum > 0) ? maximum : 0;

        if (minimum > maximum) {
          console.log('[AnyN] value:', false)
          this.setValue(false)
          return this.getValue()
        }

        if ((numberOfTrue >= minimum) && ((numberOfTrue + numberOfNull) <= maximum)) {
          console.log('[AnyN] value:', true)
          this.setValue(true)
          return this.getValue()
        }

        if (((numberOfTrue + numberOfNull) < minimum) ||(numberOfTrue > maximum)) {
          console.log('[AnyN] value:', false)
          this.setValue(false)
          return this.getValue()
        }

        console.log('[AnyN] value:', null)
        this.setValue(qtiProcessing.nullValue())
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
     * @description Utility method to resolve min
     * value from an integer or a variable declaration.
     */
    getMinValue () {
      if (this.valueMin !== null) {
        return (this.valueMin)
      }
      let declaration = store.getVariableDeclaration(this.min)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
    },

    /**
     * @description Utility method to resolve max
     * value from an integer or a variable declaration.
     */
    getMaxValue () {
      if (this.valueMax !== null) {
        return (this.valueMax)
      }
      let declaration = store.getVariableDeclaration(this.max)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
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
