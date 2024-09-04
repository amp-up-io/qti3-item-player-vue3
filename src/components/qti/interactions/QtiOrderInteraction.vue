<template>
  <div ref="root" class="qti-order-interaction">

    <div ref="prompt" class="qti-prompt-wrapper"></div>

    <OrderGroup
      ref="ordergroup"
      :cardinality="cardinality"
      :shuffle="shuffle"
      :responseIdentifier="responseIdentifier"
      :orientation="orientation"
      :maxChoices="maxChoicesValue"
      :minChoices="minChoicesValue"
      :interactionSubType="interactionSubType"
      :dataChoicesContainerWidth="dataChoicesContainerWidth"
      :priorState="priorState"
      @orderGroupReady="handleOrderGroupReady"
      @orderGroupUpdate="handleOrderGroupUpdate"
      @orderGroupSelectionsLimit="handleSelectionsLimit"
      v-bind="$attrs">
      <slot></slot>
    </OrderGroup>
  </div>
</template>

<script>
/*
 * In an Order Interaction the candidate's task is to reorder the choices,
 * the order in which the choices are displayed initially is significant.
 * By default the candidate's task is to order all of the choices but a
 * subset of the choices can be requested using the maxChoices and minChoices
 * attributes. When specified the candidate must select a subset of the
 * choices and impose an ordering on them.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiOrderInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The minimum number of choices that the candidate must select and order
     * to form a valid response to the interaction. If specified, minChoices
     * must be '1' or greater but must not exceed the number of choices available.
     * If unspecified, all of the choices must be ordered and maxChoices is ignored.
     */
    minChoices: {
      required: false,
      type: String
    },
    /*
     * The maximum number of choices that the candidate may select and order
     * when responding to the interaction. Used in conjunction with minChoices,
     * if specified, maxChoices must be greater than or equal to minChoices
     * and must not exceed the number of choices available. If unspecified,
     * all of the choices may be ordered.
     */
    maxChoices: {
      required: false,
      type: String
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
    /*
     * Default to horizontal although spec does not specify a default.
     */
    orientation: {
      required: false,
      type: String,
      default: 'horizontal'
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
     * The choices container width in pixels. Example: data-choices-container-width="100"
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
      cardinality: 'ordered',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      /*
       * May be one of 'default' | 'ordermatch'
       */
      interactionSubType: 'default',
      choices: [],
      isShuffle: false,
      hasPrompts: false,
      minChoicesValue: null,
      maxChoicesValue: null,
      isMinChoicesSpecified: false,
      isMaxChoicesSpecified: false,
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null,
      originalOrder: null
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
      this.$refs.ordergroup.disable()      
    },

    enable () {
      this.$refs.ordergroup.enable()
    },

    /**
     * @description Method to initialize this interaction's response, state,
     * and validity. This method is called upon receipt of an 'orderGroupReady'
     * event.
     * @param {Array} response
     */
    initializeValue (response) {
      this.setResponse(this.computeResponse(response))
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    initializeOriginalOrder () {
      if (this.originalOrder !== null) return

      // Construct an order from the order of the choices
      let order = []

      this.choices.forEach((choice) => {
        order.push(choice.identifier)
      })

      this.originalOrder = order
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

      // Call the OrderGroup component to rebuild the UI.
      // After the OrderGroup is rebuilt (it will be 'ready'), which triggers
      // the 'orderGroupReady' event, which in turn completes the
      // initialization process. See the handleOrderGroupReady method.
      this.$refs.ordergroup.resetGroupUI()
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
      this.cardinality = (typeof rv !== 'undefined' ? rv.cardinality : 'ordered')
      return this.cardinality
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
    getPrompts (slots) {
      let prompts = []

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
      // The OrderGroup component has saved the prompt.  
      // Retrieve it, inject it. 
      this.$refs.prompt.appendChild(this.$refs.ordergroup.getPromptElement())
    },

    /**
     * @description Handler called by OrderGroup component.
     * @param {Object} data - an object containing all choice components
     *                          nested within the ChoiceGroup, plus a response.
     */
    handleOrderGroupReady (data) {
      this.choices = data.choices

      if (!this.isMinChoicesSpecified) {
        this.minChoicesValue = this.choices.length
      }

      if (this.originalOrder === null) {
        this.initializeOriginalOrder()
      }

      this.initializeValue(data.response)
    },

    /**
     * @description Handler for when the OrderGroup component has an update.
     * @param {Object} data
     */
    handleOrderGroupUpdate (data) {
      this.setResponse(data.response)
      this.setState({
        order: data.response,
        oorder: this.originalOrder
      })
      this.updateValidity(this.computeIsValid())
    },

    handleSelectionsLimit () {
      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
    },

    /**
     * @description Build a response with the provided data.  If no data is provided then
     * compute a response from the current order.
     * @param {Object} data
     * @return {Array} response - an ordering of choices or null (when no choices have been ordered)
     */
    computeResponse (data) {
      let response = []
      
      // If no data provided, build a provisional response from the given choice order.
      if (typeof data === 'undefined')
        this.choices.forEach((choice) => {
          response.push(choice.identifier)
        })

      else
        // Provisional response data is provided.
        response = data
  
      let changeCount = 0

      // Depending on the interactionSubType, we count changes differently.
      switch (this.interactionSubType) {
        case 'default':
          // Compare originalOrder vs current response order
          for (let i = 0; i < response.length; i++) {
            // If originalOrder and response do not match then increment count
            if (response[i] !== this.originalOrder[i]) {
              changeCount += 1
            }
          }
          break

        case 'ordermatch':
          // Look for any response elements that are not null and not in the same order 
          // as the originalOrder.
          for (let i = 0; i < response.length; i++) {
            if ((response[i] !== null) && (response[i] !== this.originalOrder[i])) {
              changeCount += 1
            }
          }
          break
        
      }

      return (changeCount === 0) ? null : response
    },

    computeOrder () {
      const order = []

      this.choices.forEach((choice) => {
        order.push(choice.identifier)
      })

      return order
    },

    /**
     * @description Compute a state object.
     * @return {Object} state object
     */
    computeState () {
      if (this.priorState !== null) return this.priorState.state

      // The state (order) is the current order of the choices
      // and the original order (oorder) of the choices.
      return {
        order: this.computeOrder(),
        oorder: this.originalOrder
      }
    },

    /**
     * @description This determines an interaction's validity status based
     * on the min-choices attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      const state = this.getState()
      const response = this.getResponse()
      const minRequired = this.minChoicesValue

      // First, completely null responses are not valid.
      if (response === null) return false

      // Second, do a sanity check on the response by comparing
      // the response length to the original order length.
      if (response.length != state.order.length) return false

      let changeCount = 0

      // Depending on the interactionSubType, we count changes differently.
      switch (this.interactionSubType) {
        case 'default':
          // Compare original state.order vs current response order
          for (let i = 0; i < response.length; i++) {
            // If state.order and response do not match then increment count
            if (response[i] !== state.oorder[i]) {
              changeCount += 1
            }
          }

          // minChoices is not explicitly specified.
          if (!this.isMinChoicesSpecified) {
            // All choices must be ordered to be valid.
            if (changeCount === minRequired) return true
            return false
          }

          // minChoices is explicitly specified.
          if (changeCount >= minRequired) return true
          return false

        case 'ordermatch':
          // Look for any response elements that are not null and not in the same order 
          // as the original state.order.
          for (let i = 0; i < response.length; i++) {
            if ((response[i] !== null) && (response[i] !== state.oorder[i])) {
              changeCount += 1
            }
          }

          // minChoices is not explicitly specified.
          if (minRequired === 0) {
            // All choices must be ordered to be valid.
            if (changeCount === response.length) return true
            return false
          }

          if (changeCount >= minRequired) return true
          return false

      }

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
      this.maxSelectionsMessage = (this.maxChoicesValue === null) ? '' : 'You may set an order for a maximum of ' + this.maxChoicesValue + ' choice' + (this.maxChoicesValue > 1 ? 's' : '') + ' for this question.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }

      // If minChoices is not explicitly specified, all choices must be ordered.
      if (!this.isMinChoicesSpecified)
        this.minSelectionsMessage = 'You must set the order for all choices for this question.'
      else
        this.minSelectionsMessage = 'You must set the order for at least ' + this.minChoicesValue + ' choice' + (this.minChoicesValue > 1 ? 's' : '') + ' for this question.'
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      return this.getOrderInteractionSubType(staticClass)
    },

    /**
     * @description Order interactions have a considerable amount of shared
     * vocabulary that is expressed via the interaction's class attribute.
     * This determines whether nor not the interaction has choices separated
     * from targets.
     * @param {String} clazz - the interaction's class attribute
     * @return {String} one of 'default' | 'ordermatch'
     */
    getOrderInteractionSubType (clazz) {
      if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
        return 'default'
      }

      // Return the first supported subtype we find.
      const clazzTokens = clazz.split(' ')
      for (let index = 0; index < clazzTokens.length; index++) {
        switch (clazzTokens[index]) {
          case 'qti-choices-top':
          case 'qti-choices-bottom':
          case 'qti-choices-left':
          case 'qti-choices-right':
            return 'ordermatch'
          default:
        }
      }

      return 'default'
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Array] or null
     *   state: {
     *     order: [Array of Strings],
     *     oorder: [Array of Strings]
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
        throw new QtiEvaluationException('Order Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Order Interaction State Invalid.  "state" property not found.')
      }
      if (!('order' in priorState.state)) {
        throw new QtiEvaluationException('Order Interaction State Invalid.  "order" property not found.')
      }
      if (!('oorder' in priorState.state)) {
        throw new QtiEvaluationException('Order Interaction State Invalid.  "oorder" property not found.')
      }

      // Set original order
      this.originalOrder = priorState.state.oorder

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
      if (this.cardinality !== 'ordered') {
        throw new QtiValidationException('qti-order-interaction cardinality must be "ordered"')
      }

      this.isShuffle = (this.shuffle === 'true' ? true : false)
      this.hasPrompts = (this.getPrompts(this.$slots).length > 0 ? true : false)

      // Fussing with order interaction min-choices.
      if (typeof this.minChoices !== 'undefined') {
        this.isMinChoicesSpecified = true
      }
      this.minChoicesValue = qtiAttributeValidation.validateIntegerAttribute('min-choices', this.minChoices, false, null)
      if (this.minChoicesValue === 0) {
        throw new QtiValidationException('qti-order-interaction "min-choices", when specified, must not be 0')
      }

      // If min-choices is not specified, max-choices is ignored.
      if (!this.isMinChoicesSpecified) {
        this.maxChoicesValue = null
      } else {
        if (typeof this.maxChoices !== 'undefined') {
          this.isMaxChoicesSpecified = true
        }
        this.maxChoicesValue = qtiAttributeValidation.validateIntegerAttribute('max-choices', this.maxChoices, false, null)
      }

      if (this.isMinChoicesSpecified && this.isMaxChoicesSpecified) {
        if (this.minChoicesValue > this.maxChoicesValue) {
          throw new QtiValidationException('qti-order-interaction "min-choices" must not be greater than "max-choices"')
        }
      }

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
            interactionType: 'Order',
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
