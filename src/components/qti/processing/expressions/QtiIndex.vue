<template>
  <div class="qti-index">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The index operator takes a sub-expression with an ordered container value and any base-type.
 * The result is the nth value of the container. The result has the same base-type as the
 * sub-expression but single cardinality.
 * The first value of a container has index 1, the second 2 and so on. 'n' must be a positive integer.
 * If 'n' exceeds the number of values in the container (or the sub-expression is NULL) then the
 * result of the index operator is NULL. If 'n' is an identifier, it is the value of 'n' at
 * runtime that is used.
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
  name: 'QtiIndex',

  props: {
    /*
     * Identification of the index ordinal value required.
     * May be an integer or an identifier.
     */
    n: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      expression: null,
      // This resolves to an integer if 'n' is not an identifier
      valueN: null,
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
      // Resolve the n attribute.
      // First, try to resolve it as an integer.
      try {
        this.valueN = qtiAttributeValidation.validateIntegerAttribute('n', this.n, true, 0)
        return
      } catch (err) {
        if (err.name !== 'QtiParseException') {
          throw new Error(err.message)
        }
      }
      // We know that n was not an integer value.
      // It must be an identifier that resolves to a properly-declared
      // template variable or outcome variable.
      try {
        qtiAttributeValidation.validateIdentifierAttribute(this.n)
        const declarationN = qtiAttributeValidation.validateTemplateOrOutcomeIdentifierAttribute(this.getStore(), this.n)
        if ((declarationN.baseType !== 'integer') || (declarationN.cardinality !== 'single')) {
          throw new QtiValidationException('[Index] Attribute "n" template or outcome variable must be base-type="integer" and cardinality="single"')
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
        if (node.getCardinality() !== 'ordered') {
          throw new QtiValidationException('Expression must be of cardinality="ordered"')
        }
        this.setBaseType(node.getBaseType())
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()
        this.setBaseType(this.expression.getBaseType())

        // Resolve n
        const nValue = this.getNValue()

        // If 'n' refers to a variable whose value is less than 1, or if
        // the value is null, the value of the whole expression is NULL.
        // the value of the whole expression is NULL.
        if ((nValue === null) || (nValue < 1)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (qtiProcessing.isNullValue(value)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if ((value.length) && (value.length < nValue)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        const indexValue = value[nValue-1]
        console.log('[Index][' + nValue + ']', indexValue)
        this.setValue(indexValue)
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.nae === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    },

    /**
     * @description Utility method to resolve an 'n'
     * value from an integer or an identifier.
     */
    getNValue () {
      if (this.valueN !== null) {
        return (this.valueN)
      }
      const declaration = this.getStore().getVariableDeclaration(this.n)
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
