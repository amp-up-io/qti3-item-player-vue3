<template>
  <div class="qti-context-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Context declarations declare test variables that are global in scope.
 *
 * Context variables are initialized at the start of a test session.  They can have their
 * values retrieved during outcomeProcessing.
 */
import { teststore } from '@/store/teststore'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiContextDeclaration',

  props: {
    identifier: {
      type: String,
      required: true
    },
    baseType: {
      type: String,
      // baseType not required on cardinality==record
      required: false
    },
    cardinality: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      // this is the value that is set via defaultValue, template processing, or response processing
      value: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      // internal validation status
      isQtiValid: true,
      // default declaration context: TEST or ITEM
      declarationContext: 'ITEM'
    }
  },

  methods: {

    getIdentifier () {
      return this.identifier
    },

    getValue () {
      return this.value
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return this.value === null
    },

    getBaseType () {
      return this.baseType
    },

    getCardinality () {
      return this.cardinality
    },

    getDefaultValue () {
      return this.defaultValue
    },

    /**
     * Utility method to resets value of this variable to default.
     */
    initializeValue () {
      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }
      // 2) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
     * Resets value of this templateDeclaration to default if it exists, or null.
     */
    reset () {
      this.initializeValue()
    },

    /**
     * @description Determine if we are declared inside of a 
     * QtiAssessmentTest or a QtiAssessmentItem.
     */
    computeDeclarationContext () {
      this.declarationContext =
            (this.$parent?.$parent?.$options?.name === 'QtiAssessmentTest')
              ? 'TEST' 
              : 'ITEM'
    },

    /**
     * Validate the optional child node: 
     * [0-1] qti-default-value
     */
    validateChildren () {
      let hasDefaultValue = false

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only children permitted:
          //   qti-default-value
          if (slot.type.name === 'QtiDefaultValue') {
            if (!hasDefaultValue) {
              return hasDefaultValue = true
            }
            throw new QtiValidationException('Maximum of 1 qti-default-value element permitted')
          }

          throw new QtiValidationException('Element must be one of qti-default-value: "' + slot.type.name + '"')
        }
      })
    },

    /**
     * Iterate through the optional child node: 
     * [0-1] qti-default-value
     */
    processChildren () {
      const children = this.$.subTree.children[0].children
      
      children.forEach((node) => {
        if (node.component === null) return
        if (node.type.name === 'QtiDefaultValue') {
          return this.defaultValue = node.component.proxy.getValue()
        }

        throw new QtiValidationException('[' + node.type.name + '][Unhandled Child Node]: "' + node.type.name + '"')
      })
    }

  },

  created: function() {
    try {
      // Compute our context: TEST or ITEM
      this.computeDeclarationContext()

      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)

      this.validateChildren()

      const obj = {
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          resetValue: this.reset,
          defaultValue: null
        }

      // Notify store or teststore of our initial model.  We need this Initial
      // definition before we can properly parse template variable references
      // in the rest of the test
      if (this.declarationContext === 'TEST')
        teststore.defineContextDeclaration(obj)
      else
        store.defineContextDeclaration(obj)

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

  mounted: function () {
    if (this.isQtiValid) {
      try {
        this.processChildren()

        this.initializeValue()

        const obj = {
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            value: this.getValue(),
            resetValue: this.reset,
            defaultValue: this.defaultValue
          }

        // Notify store or teststore of our updated model.
        if (this.declarationContext === 'TEST')
          teststore.defineContextDeclaration(obj)
        else
          store.defineContextDeclaration(obj)

        console.log('[' + this.$options.name + '][' + this.identifier + '][' + this.declarationContext + '][DefaultValue]', this.defaultValue)
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
  }
}
</script>

<style>
div.qti-context-declaration {
  display:none;
}
</style>
