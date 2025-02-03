<template>
  <div ref="root" class="qti-response-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Response variables are declared by response declarations and bound to interactions
 * in the itemBody.  Unlike all other variable types, Response variables also maintain
 * a 'state' property in order to persist an interaction's 'state' (in addition to an
 * interaction's response).
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseDeclaration',

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
      // This is the value that is set via defaultValue or an interaction response
      value: null,
      // This is the volue of an interaction's state
      state: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      /* [0-1] multiplicity */
      correctResponse: null,
      /* [0-1] multiplicity */
      mapping: null,
      /* [0-1] multiplicity */
      areaMapping: null,
      // internal validation status
      isQtiValid: true,
      // default declaration context: ITEM
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

    getState () {
      return this.state
    },

    setState (state) {
      this.state = state
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

    getCorrectResponse () {
      return this.correctResponse
    },

    getMapping() {
      return this.mapping
    },

    getAreaMapping() {
      return this.areaMapping
    },

    /*
     * Response declarations only occur in items
     */
     getDeclarationContext () {
      return 'ITEM'
    },

    /**
     * Utility method to reset value of this variable to default.
     */
    initializeValue () {
      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }

      // 3) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
     * @description Basic validation of the children.
     */
    validateChildren () {
      let hasCorrectResponse = false
      let hasDefaultValue = false
      let hasMapping = false
      let hasAreaMapping = false

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only children permitted:
          //   qti-correct-response
          //   qti-default-value
          //   qti-mapping,
          //   qti-area-mapping
          if (slot.type.name === 'QtiCorrectResponse') {
            if (!hasCorrectResponse) {
              return hasCorrectResponse = true
            }
            throw new QtiValidationException('Maximum of 1 qti-correct-response element permitted')
          }

          if (slot.type.name === 'QtiDefaultValue') {
            if (!hasDefaultValue) {
              return hasDefaultValue = true
            }
            throw new QtiValidationException('Maximum of 1 qti-default-value element permitted')
          }

          if (slot.type.name === 'QtiMapping') {
            if (!hasMapping) {
              return hasMapping = true
            }
            throw new QtiValidationException('Maximum of 1 qti-mapping element permitted')
          }

          if (slot.type.name === 'QtiAreaMapping') {
            if ((this.getCardinality() !== 'record') && (this.getBaseType() !== 'point')) {
              throw new QtiValidationException(`Invalid qti-area-mapping definition.  Variable base-type is "${this.getBaseType()}", not "point"`)
            }
            if (!hasAreaMapping) {
              return hasAreaMapping = true
            }
            throw new QtiValidationException('Maximum of 1 qti-area-mapping element permitted')
          }

          throw new QtiValidationException('Element must be one of qti-correct-response, qti-default-value, qti-mapping, qti-area-mapping: "' + slot.type.name + '"')
        }
      })
    },

    /**
     * Iterate through the optional child nodes: 
     * [0-1] qti-default-value
     * [0-1] qti-correct-response
     * [0-1] qti-mapping
     * [0-1] qti-area-mapping (unsupported)
     */
    processChildren () {
      const children = this.$.subTree.children[0].children
      
      children.forEach((node) => {
        if (node.component === null) return
        if (node.type.name === 'QtiCorrectResponse') {
          return this.correctResponse = node.component.proxy.getValue()
        }

        if (node.type.name === 'QtiDefaultValue') {
          return this.defaultValue = node.component.proxy.getValue()
        }

        if (node.type.name === 'QtiMapping') {
          return this.mapping = node.component.proxy
        }

        if (node.type.name === 'QtiAreaMapping') {
          return this.areaMapping = node.component.proxy
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
     *   state: [State saved from last attempt]
     * }
     * @param {String} identifier - of an outcome variable
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)
      console.log('[ResponseDeclaration][' + identifier + '][priorState]', priorState)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('Variable Restore State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Variable Restore State Invalid.  "state" property not found.')
      }

      this.setValue(priorState.value)
      this.setState(priorState.state)
      return priorState
    }
  },

  created () {
    try {
      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)

      this.validateChildren()

      // Notify store of our initial model.  We need this Initial
      // definition before we can properly process interactions.
      store.defineResponseDeclaration({
          identifier: this.getIdentifier(),
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          state: null,
          defaultValue: null,
          correctResponse: null,
          mapping: null,
          areaMapping: null
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

  mounted () {
    if (this.isQtiValid) {
      try {
        this.processChildren()

        if (this.getPriorState(this.identifier) === null) {
          // Initialize a value when no prior state
          this.initializeValue()
        }

        // Notify store of our updated model.
        store.defineResponseDeclaration({
            identifier: this.getIdentifier(),
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            value: this.getValue(),
            state: this.getState(),
            defaultValue: this.getDefaultValue(),
            correctResponse: this.getCorrectResponse(),
            mapping: this.getMapping(),
            areaMapping: this.getAreaMapping()
          })

        console.log('[' + this.$options.name + '][' + this.identifier + '][CorrectResponse]', this.correctResponse, '[Mapping]', this.mapping)
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
div.qti-response-declaration {
  display:none;
}
</style>
