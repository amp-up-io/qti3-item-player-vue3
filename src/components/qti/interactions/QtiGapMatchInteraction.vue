<template>
  <div ref="root" class="qti-gap-match-interaction">

    <div ref="prompt" class="qti-prompt-wrapper"></div>

    <GapMatchGroup
      ref="gapmatchgroup"
      :cardinality="cardinality"
      :shuffle="shuffle"
      :responseIdentifier="responseIdentifier"
      :maxAssociations="maxAssociations"
      :minAssociations="minAssociations"
      :interactionSubType="interactionSubType"
      :gapMatchInteractionStaticClass="gapMatchInteractionStaticClass"
      :dataChoicesContainerWidth="dataChoicesContainerWidth"
      :priorState="priorState"
      @gapMatchGroupReady="handleGapMatchGroupReady"
      @gapMatchGroupUpdate="handleGapMatchGroupUpdate"
      @gapMatchGroupAssociationsLimit="handleAssociationsLimit"
      v-bind="$attrs">
      <slot></slot>
    </GapMatchGroup>
  </div>
</template>

<script>
/*
 * A gap match interaction is a blockInteraction that contains a number gaps that the candidate can fill 
 * from an associated set of choices. The candidate must be able to review the content with the gaps 
 * filled in context, as indicated by their choices. The qti-gap-match-interaction must be bound to a 
 * response variable with base-type 'directedPair' and either single or multiple cardinality, depending 
 * on the number of gaps. The choices represent the source of the pairing and gaps the targets. Each gap 
 * can have at most one choice associated with it.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiGapMatchInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The minimum number of associations that the candidate is required to make to 
     * form a valid response. If min-associations is 0 then the candidate is not required 
     * to make any associations. min-associations must be less than or equal to the limit 
     * imposed by max-associations.
     */
    minAssociations: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The maximum number of associations that the candidate is allowed to make. 
     * If max-associations is 0 then there is no restriction. If max-associations is 
     * greater than 1 (or 0) then the interaction must be bound to a response with 
     * multiple cardinality.
     */
    maxAssociations: {
      required: false,
      type: String,
      default: '1'
    },
    /*
     * If the shuffle characteristic is true then the delivery engine must randomize the order in which
     * the choices are initially presented, subject to the value of the fixed attribute of each choice.
     */
    shuffle: {
      required: false,
      type: String,
      default: 'false'
    },
    dataMaxSelectionsMessage: {
      required: false,
      type: String
    },
    dataMinSelectionsMessage: {
      required: false,
      type: String
    },
    /*
     * The gap choices container width in pixels. Example: data-choices-container-width="100"
     */
    dataChoicesContainerWidth: {
      required: false,
      type: String,
      default: null
    }
  },

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      choices: [],
      order: [],
      cardinality: 'single',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      hasPrompts: false,
      gapMatchInteractionStaticClass: '',
      interactionSubType: 'default',
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Array} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Array} response -  containing choice identifiers.
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

    setInteractionSubType (interactionSubType) {
      this.interactionSubType = interactionSubType
    },

    getInteractionSubType () {
      return this.interactionSubType
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

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
    },

    disable () {
      this.$refs.gapmatchgroup.disable()      
    },

    enable () {
      this.$refs.gapmatchgroup.enable()
    },

    /**
     * @description Method to initialize this interaction's response, state,
     * and validity. This method is called upon receipt of an 'matchGroupReady'
     * event.
     * @param {Array} response
     */
    initializeValue (response) {
      this.setResponse(response)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Reset this interaction's response and UI.  Typically, this
     * method is called when a new template is generated.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // Reset the response, state, priorState
      this.setResponse(null)
      this.setState(null)
      this.priorState = null

      // Call the GapMatchGroup component to rebuild the UI.
      // After the GapMatchGroup is rebuilt (it will be 'ready'), which triggers
      // the 'gapMatchGroupReady' event, which in turn completes the
      // initialization process. See the handleGapMatchGroupReady method.
      this.$refs.matchgroup.resetGroupUI()
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Array} response
     */
    restoreValue (response) {
      this.setResponse(response)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality (ordered).
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality 'ordered'
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to ordered if the response variable is not found
      this.cardinality = (typeof rv !== 'undefined' ? rv.cardinality : 'single')
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
     * @description Handler called by GapMatchGroup component.
     * @param {Object} data - an object containing all components
     *                          nested within the GapMatchGroup, plus a response.
     */
    handleGapMatchGroupReady (data) {
      this.choices = data.choices
      this.order = data.order
      this.initializeValue(data.response)
    },

    /**
     * @description Handler for when the GapMatchGroup component has an update.
     * @param {Object} data
     */
    handleGapMatchGroupUpdate (data) {
      this.setResponse(data.response)
      this.updateValidity(this.computeIsValid())
    },

    handleAssociationsLimit () {
      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
    },

    /**
     * @description Compute a state object.
     * @return {Object} state object
     */
    computeState () {
      if (this.priorState !== null) return this.priorState.state

      // The state (order) is the order of the qti-gap-text or qti-gap-img choices
      const state = {
        order: this.order
      }

      return state
    },

    /**
     * @description This determines an interaction's validity status based
     * on the min-associations attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      const response = this.getResponse()
      const minRequired = this.minAssociations*1

      if (minRequired === 0) return true

      if (response === null) return false

      // Response is not null, so cardinality single implies valid=true
      if (this.cardinality === 'single') return true

      // When cardinality is multiple, compare response length to minRequired
      if (response.length >= minRequired) return true

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
     * @description Update the interaction's validity in this component
     * and in the store.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    computeMaxSelectionsMessage () {
      if (typeof this.dataMaxSelectionsMessage !== 'undefined') {
        this.maxSelectionsMessage = this.dataMaxSelectionsMessage
        return
      }
      this.maxSelectionsMessage = (this.maxAssociations*1 == 0) ? '' : 'You may make a maximum of ' + this.maxAssociations + ' match' + (this.maxAssociations*1 > 1 ? 'es' : '') + ' for this question.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }

      if ((this.minAssociations*1) != 0) {
        this.minSelectionsMessage = 'You must make at least ' + this.minAssociations + ' match' + (this.minAssociations*1 > 1 ? 'es' : '') + ' for this question.'
      }
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      return this.computeInteractionSubType(staticClass)
    },

    /**
     * @description Gap Match's have a considerable amount of shared
     * vocabulary that is expressed via the interaction's class attribute.
     * This determines whether nor not the interaction has choices separated
     * from targets.
     * @param {String} clazz - the interaction's class attribute
     * @return {String} 'default'
     */
    computeInteractionSubType (clazz) {
      let subtype = 'default'

      if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
        return subtype
      }

      this.gapMatchInteractionStaticClass = clazz

      return subtype
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     order: [Array of Identifiers]
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
        throw new QtiEvaluationException('Gap Match Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Gap Match Interaction State Invalid.  "state" property not found.')
      }
      if (!('order' in priorState.state)) {
        throw new QtiEvaluationException('Gap Match Interaction State Invalid.  "order" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      
      this.setInteractionSubType(this.detectInteractionSubType(this.$.vnode.props['class']))

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.cardinality = this.getCardinality()
      if ((this.cardinality !== 'single') && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-gap-match-interaction cardinality must be "single" or "multiple"')
      }

      if (((this.maxAssociations*1) != 1) && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-gap-match-interaction response variable must have "multiple" cardinality because max-associations is ' + this.maxAssociations)
      }

      if (((this.minAssociations*1) > 1) && (this.cardinality === 'single')) {
        throw new QtiValidationException('qti-gap-match-interaction response variable must have "multiple" cardinality because min-associations is ' + this.minAssociations)
      }

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

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'GapMatch',
            interactionSubType: this.interactionSubType,
            node: this,
            resetValue: this.resetValue,
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
