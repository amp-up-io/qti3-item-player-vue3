<template>
  <div ref="root" class="qti-hottext-interaction">

    <div ref="prompt" class="qti-prompt-wrapper"></div>

    <div ref="hottextgroup" 
      @setChecked="handleSetChecked"
      class="qti3-player-hottext-group">
      <slot></slot>
    </div>

  </div>
</template>

<script>
/*
 * The HotText Interaction presents a set of choices to the candidate represented as selectable runs 
 * of text embedded within a surrounding context, such as a simple passage of text. Like choiceInteraction, 
 * the candidate's task is to select one or more of the choices, up to a maximum of max-choices. 
 * The interaction is initialized from the qti-default-value of the associated response variable, 
 * a NULL value indicating that no choices are selected (the usual case). The qti-hottext-interaction 
 * must be bound to a response variable with a base-type of identifier and single or multiple cardinality.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import NodeUtils from '@/shared/helpers/NodeUtils'
import HottextPresentationFactory from '@/components/qti/interactions/presentation/HottextInteractionPresentationFactory'

const qtiAttributeValidation = new QtiAttributeValidation()
const nodeUtils = new NodeUtils()

export default {
  name: 'QtiHottextInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    minChoices: {
      required: false,
      type: String,
      default: '0'
    },
    maxChoices: {
      required: false,
      type: String,
      default: '1'
    },
    dataMaxSelectionsMessage: {
      required: false,
      type: String
    },
    dataMinSelectionsMessage: {
      required: false,
      type: String
    }
  },

  inheritAttrs: true,

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      cardinality: 'single',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      choices: [],
      currentChoice: null,
      isRadio: true,
      isDisabled: false,
      isQtiValid: true,
      hasPrompts: false,
      presentationFactory: null,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String or Array} response - depending on cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String or Array} response - (string or array depending on cardinality)
     *                                     containing selected choice identifier(s).
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

    disable () {
      this.toggleDisableChoices(true)
    },

    enable () {
      this.toggleDisableChoices(false)
    },

    /**
     * @description Utility method to disable/enable this interaction's choices.
     * @param {Boolean} isDisabled 
     */
    toggleDisableChoices (isDisabled) {
      this.isDisabled = isDisabled
      this.choices.forEach((choice) => {
        choice.setIsDisabled(isDisabled)
      })
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
    },

    /**
     * @description Reset this interaction's response and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // Uncheck all choices
      this.choices.forEach((choice) => {
        choice.setChecked(false)
      })

      this.currentChoice = null

      // When a new template, smoke the priorState
      this.priorState = null
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {String or Array} response
     */
    restoreValue (response) {
      if (response === null) return

      if (this.isRadio) {
        // response is an identifier string
        this.handleSetChecked(new CustomEvent('setChecked', {
            bubbles: false,
            detail: { 'identifier': response, 'checked': 'true' }
          }), true)
      } else {
        // response is an array of identifier strings
        response.forEach((identifier) => {
          this.handleSetChecked(new CustomEvent('setChecked', {
              bubbles: false,
              detail: { 'identifier': identifier, 'checked': 'true' }
            }), true)
          }, this)
      }

      this.setResponse(this.computeResponse())
      this.setState(this.computeState())
      // When restoring, manually update validity
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality (single, multiple).
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality 'single' or 'multiple'
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to single if the response variable is not found
      this.cardinality = (typeof rv !== 'undefined' ? (rv.cardinality !== 'multiple' ? 'single' : 'multiple') : 'single')
      return this.cardinality
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
     * @description Implements checked behavior on hottext radio button and checkbox groups.
     * @param {CustomEvent} event - CustomEvent 'setChecked'
     * @param {Boolean} restoring - boolean set to true when restoring
     */
    handleSetChecked (event, restoring=false) {

      /*
       * event.detail is an object with the following properties:
       *
       * { 
       *  'identifier': identifier {String} identifier of the qti-hottext element being checked
       *  'checked': checked {String} 'true' | 'false'
       * }
       * 
       */
      const choice = event.detail

      this.choices.forEach((hottextChoice) => {
        // Single cardinality: turn off all radio buttons
        if (this.isRadio) {
          hottextChoice.setChecked(false)
        }
        // Set currentChoice to our choice to be checked (or unchecked)
        if (hottextChoice.identifier === choice.identifier) {
          this.currentChoice = hottextChoice
        }
      })

      if (choice.checked === 'true') {

        // Only permit checking if we have not exceeded maxChoices
        if (!this.checkMaxChoicesLimit()) {
          this.currentChoice.setChecked(true)
        } else {
          this.currentChoice.setChecked(false)
        }

      } else {
        this.currentChoice.setChecked(false)
      }

      if (!restoring) {
        // Update the response to reflect the current checked state of the choices
        this.setResponse(this.computeResponse())
        // Focus the choice if we are not restoring.
        this.currentChoice.setFocus()
        // Update validity
        this.evaluateValidity()
      }
      
    },

    /**
     * @description Build a response from the array of choices.
     * Single Cardinality: response is an identifier string
     * Multiple Cardinality: response is an array of identifier strings
     * @return {String or Array} response
     */
    computeResponse () {
      let response = this.isRadio ? null : []

      this.choices.forEach((hottextChoice) => {
        if (hottextChoice.isChecked()) {
          if (this.isRadio) {
            response = hottextChoice.identifier
          } else {
            response.push(hottextChoice.identifier)
          }
        }
      })

      // Single Cardinality
      if (this.isRadio) return response

      // Multiple Cardinality
      return (response.length === 0) ? null : response
    },

    /**
     * @description Return an empty object as we do not track any other 
     * state properties as of 1/5/1023.
     * @return {Object} state object
     */
     computeState () {
      const state = {}
      return state
    },

    /**
     * @description The determines an interaction's validity status based
     * on the min-choices attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      // If minChoices is 0, there are no constraints
      if ((this.minChoices*1) === 0) return true

      // MinChoices is > 0.  There are constraints.

      // A null response is invalid
      if (this.response === null) return false

      // A single cardinality interaction with a non-null response is valid
      if (this.cardinality === 'single') return true

      // A multiple cardinality interaction that is non-null must have at least
      // minChoices selections in order to be valid
      if ((this.cardinality === 'multiple') && (this.response.length >= (this.minChoices*1))) return true

      // Must be invalid
      return false
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
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    /**
     * @description This method should be called prior to setting checked=true on a choice.
     * @return {Boolean} (true if exceeding max-choices, false if not)
     */
    checkMaxChoicesLimit () {
      // max-choices = 0 means no limit.
      // On Radio Groups there should always be at most 1 choice.
      if ((this.isRadio) || (this.maxChoices == 0)) return false

      // Should only get to this code on a multiple cardinality ChoiceGroup.
      // In this case, response should be an array of identifier strings.
      const response = this.getResponse()
      if ((response !== null) && (response.length == this.maxChoices)) {
        store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
        return true
      }

      return false
    },

    computeMaxSelectionsMessage () {
      if (typeof this.dataMaxSelectionsMessage !== 'undefined') {
        this.maxSelectionsMessage = this.dataMaxSelectionsMessage
        return
      }
      this.maxSelectionsMessage = (this.maxChoices == 0) ? '' : 'You are permitted a maximum of ' + this.maxChoices + ' selection' + (this.maxChoices > 1 ? 's' : '') + ' for this question.<br/><br/>Please unselect one of your selections before making another selection.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }
      this.minSelectionsMessage = (this.minChoices == 0) ? '' : 'You must make at least ' + this.minChoices + ' selection' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
    },

    /**
     * @description Basic validation of the children.
     */
    validateChildren () {
      // NOOP
    },

    processChildren () {
      // children[1] is the hottextgroup child
      const children = 
        this.$.subTree === null 
          ? null 
          : this.$.subTree.children[1].children
      
      // Sniff for all nested QtiHottext nodes
      this.choices = nodeUtils.findNodes('QtiHottext', { within: children })

      // Build a UI
      this.processGroupUI()

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }
    },

    processGroupUI () {
      this.setUnselectedHidden()
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    setUnselectedHidden () {
      if (this.presentationFactory.getUnselectedHidden()) {
        this.$refs.hottextgroup.setAttribute('class', 'qti3-player-hottext-group qti-unselected-hidden')
      }
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     order: [Array of Strings]
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
        throw new QtiEvaluationException('Hottext Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Hottext Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Set up a presentation factory
      this.presentationFactory = new HottextPresentationFactory(this.$.vnode.props['class'])

      this.validateChildren()

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinChoices(this.maxChoices, this.minChoices)

      this.isRadio = (this.getCardinality() !== 'multiple')
      this.hasPrompts = (this.getPrompts(this.$slots).length > 0 ? true : false)
      this.computeMinSelectionsMessage()
      this.computeMaxSelectionsMessage()
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
        this.movePrompt()

        this.processChildren()

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'Hottext',
            node: this,
            resetValue: this.resetValue,
            disable: this.disable,
            isValidResponse: this.getIsValid(),
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: this.maxSelectionsMessage
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
div.qti3-player-hottext-group {
  line-height: 160%;
}
</style>
