<template>
  <div ref="root" class="qti-custom-interaction">

    <div ref="prompt" class="qti-prompt-wrapper">
      <slot></slot>
    </div>

    <component
      ref="interaction"
      :is="interactionTemplate"
      @customInteractionUpdate="handleCustomInteractionUpdate"
      @customInteractionReady="handleCustomInteractionReady"
    />
  </div>
</template>

<script>
/**
 * The qti-custom-interaction provides an opportunity for extensibility of this specification 
 * to include support for interactions not currently documented, using methods that are 
 * proprietary for the supplier.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import { getCustomInteractionSubType, customInteractionAdapter } from './adapters/custom-interaction-adapter'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiCustomInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    definition: {
      required: false,
      type: String,
      default: ''
    }
  },

  computed: {

    /**
     * @description Compute a template/component according to the interactionSubType.
     */
    interactionTemplate () {
      return customInteractionAdapter(this.interactionSubType, this.createComponentProperties(), this.$attrs)
    }

  },

  data() {
    return {
      response: null,
      state: null,
      baseType: null,
      cardinality: null,
      interactionSubType: null,
      isValidResponse: false,
      invalidResponseMessage: 'Input Required',
      classAttribute: '',
      isDisabled: false,
      isQtiValid: true,
      hasPrompts: false,
      presentationFactory: null,
      /*
       * Reference to the sub-component
       */
      node: null,
      /*
       * When restoring, this is where we save the prior variable state.
       */
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Generic} response - depending on baseType and cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Generic} response - depending on baseType and cardinality
     */
    setResponse (response) {
      this.response = response
    },

    /**
     * @description Get this interaction's state.
     * @return {Object} state
     */
    getState () {
      return this.state
    },

    /**
     * @description Set/restore this interaction's state.
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    /**
     * @description Get this interaction's response validity.
     * @return {Boolean} isValidResponse
     */
    getIsValid () {
      return this.isValidResponse
    },

    /**
     * @description Set this interaction's response validity.
     * @param {Boolean} isValid
     */
    setIsValid (isValid) {
      this.isValidResponse = isValid
    },

    setInteractionSubType (interactionSubType) {
      this.interactionSubType = interactionSubType
    },

    getInteractionSubType () {
      return this.interactionSubType
    },

    disable () {
      this.toggleDisable(true)
    },

    enable () {
      this.toggleDisable(false)
    },

    /**
     * @description Utility method to disable/enable this interaction.
     * @param {Boolean} isDisabled 
     */
    toggleDisable (isDisabled) {
      this.isDisabled = isDisabled
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} invalidResponseMessage
     */
    getInvalidResponseMessage () {
      return this.invalidResponseMessage
    },

    initializeValue () {
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Object} state
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String]
     *   state: {
     *   }
     * }
     */
    restoreValue (state) {
      this.setResponse(state.value)
      this.setState(state.state)
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality - which MUST be 'single'
     * @return {String} - cardinality 'single'
     */
    getCardinality () {
      return this.cardinality
    },

    /**
     * @description For now, return an empty object.
     * @return {Object} state object
     */
    computeState () {
      return {}
    },

    /**
     * @description The determines an interaction's validity status.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      return true
    },

    /**
     * @description Evaluate the interaction's response validity.
     * Update the interaction's validity if there is a change.
     */
    evaluateValidity () {
      // Save old validity value
      const priorValidity = this.getIsValid()
      // Compute new validity value
      const currentValidity = this.computeIsValid()
      // Bail if no change
      if (priorValidity === currentValidity) return
      // There is a change.
      this.updateValidity(currentValidity)
    },

    /**
     * @description Update the interaction's validity.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      // Notify store that we have a change in validity
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
    getPrompts (slots) {
      let prompts = []

      if (!slots.default) return prompts

      slots.default().forEach((vnode) => {
        // Only check for qti-prompt, skipping text nodes.
        if (typeof vnode.type !== 'undefined') {
          if (vnode.type.name === 'QtiPrompt') {
            prompts.push(vnode)
          }
        }
      })

      return prompts
    },

    /**
     * @description Move the first qti-prompt DOM element into the prompt-wrapper
     * in the template.
     */
    movePrompt () {
      if (!this.hasPrompts) return
      // Only select and move the first prompt
      const node = this.$refs.root.querySelector('.qti-prompt')
      if (node !== null) {
        this.$refs.prompt.appendChild(node)
      }
    },

    /**
     * @description attempt to parse the interaction component
     * from the class attribute (if any) of this interaction.
     * Throws an exception if none found.
     * @param classAttribute class attribute
     */
    detectInteractionSubType (classAttribute) {
      return getCustomInteractionSubType(classAttribute)
    },

    createComponentProperties () {
      // Create default properties
      const properties = {
        responseIdentifier: this.responseIdentifier,
      }

      return properties
    },

    handleCustomInteractionUpdate (data) {
      this.updateResponse(data.response)

      if ('state' in data) {
        this.updateState(data.state)
      }

      // Update validity
      this.evaluateValidity()
    },

    handleCustomInteractionReady (interaction) {
      // This gives us a handle on the sub-component's methods
      this.node = interaction.node

      if (this.priorState === null)
        this.initializeValue()
      else
        this.restoreValue(this.priorState)
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String] or [Object]
     *   state: {
     *   }
     * }
     * @param {String} identifier - of a response variable
     * @return {Object} - a prior state or null
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('Custom Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Custom Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      this.setInteractionSubType(this.detectInteractionSubType(this.$attrs['class']))


      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.hasPrompts = (this.getPrompts(this.$slots).length > 0 ? true : false)
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

        // Notify store of our new component
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'ExtendedText',
            interactionSubType: this.interactionSubType,
            node: this,
            resetValue: this.resetValue,
            isValidResponse: this.isValidResponse,
            invalidResponseMessage: this.getInvalidResponseMessage(),
          })

        console.log('[' + this.$options.name + '][Identifier]', this.responseIdentifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
</style>
