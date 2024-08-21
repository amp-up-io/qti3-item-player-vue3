<template>
  <div class="qti-field-value">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The field-value operator takes a sub-expression with a record container value. The result
 * is the value of the field with the specified fieldIdentifier. If there is no field with
 * that identifier then the result of the operator is NULL.
 */
import { store } from '@/store/store'
import { teststore } from '@/store/teststore'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiFieldValue',

  props: {
    /*
     * The identifier of the field to be selected.
     */
    fieldIdentifier: {
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
        if (node.getCardinality() !== 'record') {
          throw new QtiValidationException('Expression must be of cardinality="record"')
        }
        // The expression node is a record.  Get a base-type for this Field.
        this.setBaseType(this.processFieldBaseType(node, expression.type.name))
      })
    },

    /**
     * @description Get a base-type for this Field.
     * @param node - Should be an expression resolving to a record variable
     */
    processFieldBaseType (node, name) {
      switch (name) {
        case 'QtiVariable':
        case 'QtiCorrect':
        case 'QtiDefault':
          return this.getFieldBaseTypeFromRecordVariable(node.$props.identifier)
        default:
          // What is the expression node ??
          return null
      }
    },

    getFieldBaseTypeFromRecordVariable (variableIdentifier) {
      let variableDeclaration

      try {
        variableDeclaration = qtiAttributeValidation.validateVariableIdentifierAttribute(this.getStore(), variableIdentifier)
      } catch (err) {
        // No variable declaration found for this identifier.  Bail.
        return null
      }

      // Bail if our variable is not a record.
      if (variableDeclaration.cardinality !== 'record') return null

      // Pluck the field value from the record
      if (variableDeclaration.defaultValue !== null) {
        const fieldDeclaration = variableDeclaration.defaultValue.get(this.fieldIdentifier)
        return (typeof fieldDeclaration !== 'undefined') ? fieldDeclaration.getBaseType() : null
      }

      // No default value.  If this is a response declaration, check if there is a correctResponse definition
      try {
        variableDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute (this.getStore(), variableIdentifier)
      } catch (err) {
        // If we get here, it's because no response declaration was found for this identifier. Bail.
        return null
      }

      // This is a response declaration.  Check for a correctResponse definition.
      if (variableDeclaration.correctResponse !== null) {
        const fieldDeclaration = variableDeclaration.correctResponse.get(this.fieldIdentifier)
        return (typeof fieldDeclaration !== 'undefined') ? fieldDeclaration.getBaseType() : null
      }

      // oh well ...
      return null
    },

    evaluate () {
      try {
        // The expression should resolve to a Record
        const recordValue = this.expression.evaluate()

        if (this.expression.getCardinality() !== 'record') {
          throw new QtiEvaluationException('qti-field-value expression is not cardinality="record"')
        }

        if (qtiProcessing.isNullValue(recordValue)) {
          console.log('[FieldValue][' + this.fieldIdentifier + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        // Get the field value component from the record hashmap
        let fieldValue = recordValue.get(this.fieldIdentifier)

        // Will be undefined if record does not have the field
        if (typeof fieldValue === 'undefined') {
          console.log('[FieldValue][' + this.fieldIdentifier + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        this.setValue(fieldValue.getValue())
        console.log('[FieldValue][' + this.fieldIdentifier + ']', this.getValue())
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
    }
  },

  created () {
    try {
      this.processingContext = qtiProcessing.computeProcessingContext(this)
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
