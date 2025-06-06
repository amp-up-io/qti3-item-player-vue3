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
import { store } from '@/store/store'
import { teststore } from '@/store/teststore'
import { RecordField } from '@/shared/helpers/RecordField'
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

    /*
     * Context declarations occur in items and tests
     */
    getDeclarationContext () {
      return this.declarationContext
    },

    /**
     * Utility method to reset value of this variable to default.
     */
    initializeValue () {
      if (this.getIdentifier() === 'QTI_CONTEXT') {
        this.initializeQtiContext()
        return
      }

      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }
      // 2) null
      this.setValue(qtiProcessing.nullValue())
    },

    initializeQtiContext () {
      // Extra fussing for the built-in QTI_CONTEXT variable
      const qtiContextValue = new Map()
      qtiContextValue.set('candidateIdentifier', new RecordField('candidateIdentifier', 'string', null))
      qtiContextValue.set('testIdentifier', new RecordField('testIdentifier', 'string', null))
      qtiContextValue.set('environmentIdentifier', new RecordField('environmentIdentifier', 'string', null))

      if (this.defaultValue !== null) {
        // merge default value fields into QTI_CONTEXT
        this.defaultValue.forEach((value, key) => {
          qtiContextValue.set(key, new RecordField(key, value.getBaseType(), value.getValue()))
        })
      }
      this.setValue(qtiContextValue)
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

    getStore () {
      return (this.declarationContext === 'TEST') ? teststore : store
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
    },

    /**
     * @description Retrieve this variable's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Value saved from last attempt]
     * }
     * @param {String} identifier - of an outcome variable
     */
     getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)
      console.log('[ContextDeclaration][' + identifier + '][priorState]', priorState)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('Variable Restore State Invalid.  "value" property not found.')
      }

      if (this.getCardinality() !== 'record')
        this.setValue(priorState.value)
      else
        this.setValue(store.createRecordFromMapValue(identifier, this.defaultValue, priorState.value))

      return priorState
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

      // Notify store or teststore of our initial model.  We need this Initial
      // definition before we can properly parse template variable references
      // in the rest of the test
      this.getStore().defineContextDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          resetValue: this.reset,
          defaultValue: null
        })

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

        if (this.getPriorState(this.identifier) === null) {
          // Initialize a value when no prior state
          this.initializeValue()
        }

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
