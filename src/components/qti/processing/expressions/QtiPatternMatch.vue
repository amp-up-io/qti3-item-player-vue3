<template>
  <div class="qti-pattern-match">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-pattern-match expression takes a sub-expression which must have single cardinality and a
 * base-type of string. The result is a single boolean with a value of true if the sub-expression
 * matches the regular expression given by pattern and false if it doesn't.
 * If the sub-expression is NULL then the operator results in NULL.
 *
 * The syntax for the regular expression language is defined in Appendix F of [XSCHEMA2, 2001]:
 * http://www.w3.org/TR/2001/REC-xmlschema-2-20010502/#regexs
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
  name: 'QtiPatternMatch',

  props: {
    /*
     * The syntax for the regular expression language is defined in Appendix F of [XSCHEMA2, 01].
     * May refer to a variable as pattern is of type stringOrVariableRef.
     * To resolve this, variable declarations should be searched first.  If none are found
     * then pattern must be a Regular Expression string.
     */
    pattern: {
      required: false,
      type: String
    },
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expression: null,
      // Save computed Regex here when pattern is not a variable identifier
      appliedRegex: null,
      // Set to true if pattern resolves to a variable identifier
      isPatternIdentifier: null,
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

    getCardinality () {
      return this.valueCardinality
    },

    getStore () {
      return (this.processingContext === 'TEST') ? teststore : store
    },

    validateAttributes() {
      let declaration
      try {
        declaration =  qtiAttributeValidation.validateVariableIdentifierAttribute(this.getStore(), this.pattern)
        // If we get to this line of code then we believe that 'pattern' is
        // a variable identifier, not a RegEx pattern.
        this.isPatternIdentifier = true
      } catch (err) {
        // QtiValidationException means that pattern wasn't an identifier
        if (err.name === 'QtiValidationException') {
          this.isPatternIdentifier = false
        } else {
          throw new Error(err.message)
        }
      }

      if (this.isPatternIdentifier) {
        // Validate that variable is a string with single cardinality
        if ((declaration.baseType === 'string') && (declaration.cardinality === 'single')) {
          // Bail.  Resolve the variable value if/when evaluate is called.
          return
        }
        throw new QtiValidationException('Invalid "pattern" attribute.  The referenced variable must be of base-type "string" and cardinality "single"')
      }

      // 'pattern' is a RegEx expression.  Parse it and save the result in appliedRegex.
      this.appliedRegex = qtiAttributeValidation.validatePattern('pattern', this.pattern)
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
        if (node.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be of cardinality="single"')
        }
        if (node.getBaseType() !== 'string') {
          throw new QtiValidationException('Expression must be a string base-type')
        }
      })
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        // compute the final RegEx
        const rx = this.getRegex()

        if (qtiProcessing.isNullValue(value) || (rx === null)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[PatternMatch][Pattern][Exp][Value]', rx, value, this.getValue())
          return this.getValue()
        }

        this.setValue(rx.test(value))
        console.log('[PatternMatch][Pattern][Exp][Value]', rx, value, this.getValue())
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
     * @description Utility method to resolve the Regex
     * from a string or an identifier that resolves to a string
     */
    getRegex () {
      if (this.isPatternIdentifier) {
        const declaration = this.getStore().getVariableDeclaration(this.pattern)
        return qtiAttributeValidation.validatePattern('pattern', declaration.value)
      }
      return this.appliedRegex
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
