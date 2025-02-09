<template>
  <div ref="root" class="qti-extended-text-interaction">

    <div ref="prompt" class="qti-prompt-wrapper">
      <slot></slot>
    </div>

    <component
      ref="textarea"
      :is="interactionTemplate"
      @extendedTextUpdate="handleExtendedTextUpdate"
      @extendedTextReady="handleExtendedTextReady"
    />
  </div>
</template>

<script>
/**
 * An Extended Text interaction is a blockInteraction that allows the candidate to enter
 * an extended amount of text. The qti-extended-text-interaction must be bound to a
 * response variable of single, multipe, ordered or record cardinality. If the response
 * variable has record cardinality the fields in the records are 'stringValue' 'floatValue',
 * etc. Otherwise it must have a baseType of string, integer or float. When bound to
 * response variable with single cardinality a single string of text is required from
 * the candidate.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import ExtendedTextPresentationFactory from '@/components/qti/interactions/presentation/ExtendedTextInteractionPresentationFactory'
import { getExtendedTextInteractionSubType, extendedTextInteractionAdapter } from './adapters/extendedtext-interaction-adapter'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiExtendedTextInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The expectedLength characteristic is only used when a qti-counter-<up | down>
     * class is specified.  Otherwise, best practice is to ignore expectedLength.
     */
    expectedLength: {
      required: false,
      type: String
    },
    /*
     * If given, the pattern mask specifies a regular expression that the candidate's response must match
     * in order to be considered valid. The regular expression language used is defined in Appendix F of [XSCHEMA2, 01].
     * Care is needed to ensure that the format of the required input is clear to the candidate, especially when
     * validity checking of responses is required for progression through a test. This could be done by providing an
     * illustrative sample response in the prompt, for example.
     */
    patternMask: {
      required: false,
      type: String
    },
    /*
     * In visual environments, string interactions are typically represented by empty boxes into which the candidate
     * writes or types. However, in speech based environments it is helpful to have some placeholder text that can be
     * used to vocalize the interaction. Delivery engines should use the value of this attribute (if provided) instead
     * of their default placeholder text when this is required. Implementors should be aware of the issues concerning
     * the use of default values described in the section on Response Variables.
     */
    placeholderText: {
      required: false,
      type: String
    },
    /*
     * Used to control the format of the text entered by the candidate. This characteristic affects the way the value
     * of the associated response variable should be interpreted by response processing engines and also controls the
     * way it should be captured in the delivery engine.
     * Enumerated value set of: { plain | preformatted | xhtml }
     * Default = 'plain'
     */
    format: {
      required: false,
      type: String,
      default: 'plain'
    },
    /*
     * Override delivery platform's default patternMask error message.
     */
    dataPatternmaskMessage: {
      required: false,
      type: String
    },
    /*
     * The min-strings attribute specifies the minimum number separate (non-empty) strings 
     * required from the candidate to form a valid response. If min-strings is 0 then the 
     * candidate is not required to enter any strings at all.
     */
    minStrings: {
      required: false,
      type: String,
      default: '0'
    },
    maxStrings: {
      required: false,
      type: String,
      default: '0'
    }
  },

  computed: {

    /**
     * @description Compute a template/component according to the interactionSubType.
     */
    interactionTemplate () {
      return extendedTextInteractionAdapter(this.interactionSubType, this.createComponentProperties(), this.$attrs)
    },

    placeholder () {
      return qtiAttributeValidation.validatePlaceholderText(this.placeholderText, '')
    },

    hasPatternMask () {
      return (typeof this.patternMask !== 'undefined')
    },

    patternMaskMessage () {
      return qtiAttributeValidation.validatePatternmaskMessage(this.dataPatternmaskMessage, 'Invalid Input')
    }

  },

  data() {
    return {
      response: '',
      state: null,
      baseType: 'string',
      cardinality: 'single',
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
     * @return {String} response string or null
     */
    getResponse () {
      if (this.response.length === 0) return null

      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string
     */
    setResponse (response) {
      if (response === null)
        this.response = ''
      else
        this.response = response

      this.node.setResponse(this.response, true)
    },

    updateResponse (response) {
      if (response === null)
        this.response = ''
      else
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

      this.node.setState(this.state, true)
    },

    updateState (state) {
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
      this.node.setIsDisabled(isDisabled)
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
      const min = this.minStrings*1

      // If minStrings is 0, there are no constraints
      if (min === 0) return true
      
      // minStrings is > 0.  There are constraints.

      // A null response is invalid
      if (this.response === null) return false

      const response = this.response.trim()

      // An empty string is invalid
      if (response.length < 1) return false

      // The number of words must be >= minStrings, else invalid
      if (qtiProcessing.computeWordCount(response) < min) return false

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
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     * @param format
     */
    detectInteractionSubType (staticClass, format) {
      return getExtendedTextInteractionSubType(staticClass, format)
    },

    createComponentProperties () {
      // Create default properties
      const properties = {
        responseIdentifier: this.responseIdentifier,
        expectedLength: this.presentationFactory.getExpectedLength(),
        placeholder: this.placeholder,
        patternMask: this.patternMask,
        patternMaskMessage: this.patternMaskMessage,
        heightClass: this.presentationFactory.getHeightClass(),
        counterStyle: this.presentationFactory.getCounterStyle()
      }

      return properties
    },

    handleExtendedTextUpdate (data) {
      this.updateResponse(data.response)

      if ('state' in data) {
        this.updateState(data.state)
      }

      // Update validity
      this.evaluateValidity()
    },

    handleExtendedTextReady (interaction) {
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
        throw new QtiEvaluationException('Extended Text Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Extended Text Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      this.setInteractionSubType(this.detectInteractionSubType(this.$.vnode.props['class'], this.format))

      // Set up a presentation factory
      this.presentationFactory = new ExtendedTextPresentationFactory(this.$.vnode.props['class'], this.expectedLength)

      qtiAttributeValidation.validateMaxMinStrings(this.maxStrings, this.minStrings)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.cardinality = this.getCardinality()
      this.hasPrompts = (this.getPrompts(this.$slots).length > 0 ? true : false)
      this.appliedRegex = qtiAttributeValidation.validatePattern('pattern-mask', this.patternMask)
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
.qti-extended-text-interaction.qti-writing-orientation-vertical-rl {
  display: table;
  height: 100%;
}
</style>
