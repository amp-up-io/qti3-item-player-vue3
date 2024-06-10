<template>
  <div class="qti-template-constraint">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A templateConstraint contains an expression which must have an effective baseType of boolean
 * and single cardinality. If the expression is 'false' (including if the expression is NULL),
 * the template variables are set to their default values and templateProcessing is restarted;
 * this happens repeatedly until the expression is 'true' or the maximum number of iterations is
 * reached. In the event that the maximum number of iterations is reached, any default values
 * provided for the variables during declaration are used. Processing then continues with the
 * next templateRule after the templateConstraint, or finishes if there are no further
 * templateRules. By using a templateConstraint, authors can ensure that the values of variables
 * set during templateProcessing satisfy the condition specified by the boolean expression.
 * For example, two randomly selected numbers might be required which have no common factors.
 * A templateConstraint may occur anywhere as a child of templateProcessing. It may not be used
 * as a child of any other element. Any number of templateConstraints may be used, though two
 * or more consecutive templateConstraints could be combined using the 'and' element to combine
 * their boolean expressions. The maximum number of times that the operations preceding the
 * templateConstraint can be expected to be performed is assumed to be 100; implementations
 * may permit more iterations, but there must be a finite maximum number of iterations. This
 * prevents the occurrence of an endless loop. It is the responsibility of the author to provide
 * default values for any variables assigned under a templateConstraint.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiTemplateConstraintException from '@/components/qti/exceptions/QtiTemplateConstraintException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateConstraint',

  data () {
    return {
      expression: null,
      iterationCount: 0,
      isQtiValid: true
    }
  },

  methods: {

    getIterationCount () {
      return this.iterationCount
    },

    setIterationCount (iterationCount) {
      this.iterationCount = iterationCount
    },

    incrementIterationCount () {
      this.setIterationCount(this.getIterationCount() + 1)
    },

    resetIterationCount () {
      this.setIterationCount(0)
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

      this.expression = children[0].component.proxy
    },

    validateExpressions (expressions) {
      expressions.forEach((expression) => {
        const node = expression.component.proxy
        if (node.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be cardinality="single"')
        }
        if (node.getBaseType() !== 'boolean') {
          throw new QtiValidationException('Expression must be base-type="boolean"')
        }
      })
    },

    evaluate () {
      try {
        // Implementations must support at least 100 iterations.
        // If we exceed max iterations then we proceed with the next
        // template processing rule (if any)
        if (this.iterationCount > 100) {
          this.resetIterationCount()
          console.log('[TemplateConstraint][MaxIterations]')
          // Proceed with next template rule
          return
        }

        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value) || (!value)) {
          this.incrementIterationCount()
          console.log('[TemplateConstraint][False][' + this.getIterationCount() + ']')
          throw new QtiTemplateConstraintException('TemplateConstraint:false')
        }

        this.resetIterationCount()
        console.log('[TemplateConstraint][True]')
        // Proceed with next template rule
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiTemplateConstraintException') {
          throw new QtiTemplateConstraintException(err.message)
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
