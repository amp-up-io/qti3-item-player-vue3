<template>
  <div class="qti-lookup-outcome-value">
    <slot></slot>
  </div>
</template>

<script>
/**
 * The lookupOutcomeValue rule sets the value of an outcome variable to the value obtained by looking
 * up the value of the associated expression in the lookupTable associated with the outcome's declaration.
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
  name: 'QtiLookupOutcomeValue',

  props: {
    identifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      isQtiValid: true,
      expression: null,
      processingContext: null
    }
  },

  methods: {

    getStore () {
      return (this.processingContext === 'TEST') ? teststore : store
    },

    /**
     * Implements several validation checks on aspects of the lookupTable and expression.
     * @param declaration { object } - the outcome declaration pulled from the $store
     * @param expression { component } - the expression parameter to this lookupOutcomeValue rule
     */
    validateRequiredBaseTypeAndCardinality (declaration, expression) {
      // expression cardinality must be single
      if (expression.getCardinality() !== 'single') {
        throw new QtiValidationException('Expression node must have cardinality "single"')
      }

      // extra check for non-null lookupTable
      if (declaration.lookupTable === null) {
        throw new QtiEvaluationException('Missing lookupTable for Outcome variable identifier: "' + this.identifier + '"')
      }

      // permissible expression baseType varies depending on lookupTable type
      const baseType = expression.getBaseType()
      const tableType = declaration.lookupTable.getTableType()
      if (tableType === 'match') {
        // expression baseType must be integer
        if (baseType !== 'integer') {
          throw new QtiValidationException('Expression node must have base-type "integer" when lookupTable=matchTable')
        }
      } else if (tableType === 'interpolation') {
        // expression baseType must be { 'integer', 'float', 'duration' }
        if ((baseType !== 'integer') && (baseType !== 'float') && (baseType !== 'duration')) {
          throw new QtiValidationException('Expression node must have base-type "integer", "float", or "duration" when lookupTable=interpolationTable')
        }
      }
    },

    /**
     * Iterate through the child nodes:
     * There must be one expression child which must have single cardinality and an effective baseType of
     * either integer, float or duration. Integer type is required when the associated table is a matchTable.
     * expression (1)
     */
    validateChildren () {
      let countExpression = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have one Expression node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            countExpression += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.type.name + '"')
          }
        }
      })

      if (countExpression !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
    },

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
        // Ensure expression has suitable baseType and cardinality
        this.validateRequiredBaseTypeAndCardinality(
              qtiAttributeValidation.validateOutcomeIdentifierAttribute(
                this.getStore(), 
                this.identifier), 
              expression.component.proxy)
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        let declaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(this.getStore(), this.identifier)
        if (typeof declaration === 'undefined') {
          throw new QtiEvaluationException('Outcome variable not found for identifier: "' + this.identifier + '"')
        }

        if (declaration.lookupTable === null) {
          throw new QtiEvaluationException('Outcome variable lookupTable not found for identifier: "' + this.identifier + '"')
        }

        let numericValue = null
        if (!qtiProcessing.isNullValue(value)) {
          if (this.expression.getBaseType() === 'duration') {
            value = qtiAttributeValidation.FloatValue(qtiAttributeValidation.DurationValue(value))
          }
          numericValue = value
        }

        let targetValue = qtiProcessing.mapValueFromLookupTable(declaration, numericValue)
        console.log('[LookupOutcomeValue][' + this.identifier + '][Expression]', numericValue, '[TargetValue]', targetValue)

        // Notify store of our targetValue
        this.getStore().setOutcomeVariableValue({
            identifier: this.identifier,
            value: targetValue
          })

      } catch (err) {
        this.isQtiValid = false
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
      this.processingContext = qtiProcessing.computeProcessingContext(this)
      qtiAttributeValidation.validateOutcomeIdentifierAttribute(this.getStore(), this.identifier)
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
