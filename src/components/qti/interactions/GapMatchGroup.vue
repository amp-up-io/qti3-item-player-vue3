<template>
  <div 
    ref="root" 
    class="qti-gap-match-group-wrapper">
    <slot></slot>
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import GapMatchPresentationFactory from '@/components/qti/interactions/presentation/GapMatchInteractionPresentationFactory'
import GapMatchInteractionWidget from '@/components/qti/interactions/widgets/GapMatchInteractionWidget'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {

  emits: [
    'gapMatchGroupReady',
    'gapMatchGroupUpdate',
    'gapMatchGroupAssociationsLimit'
  ],

  props: {
    /*
     * Computed by the parent component by examining the parent interaction's response declaration.
     */
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * Computed by the parent component by examining the parent interaction's response declaration.
     */
    cardinality: {
      required: true,
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
     * The maximum number of associations that the candidate may make
     * when responding to the interaction. Used in conjunction with minAssociations,
     * if specified, maxAssociations must be greater than or equal to minAssociations
     * and must not exceed the number of choices available. If unspecified,
     * all of the choices may be matched.
     */
    maxAssociations: {
      required: false,
      type: String,
      default: '1'
    },
    /*
     * The minimum number of associations that the candidate is required to make to form a valid response. 
     * If min-associations is 0 then the candidate is not required to make any associations. min-associations 
     * must be less than or equal to the limit imposed by max-associations.
     */
    minAssociations: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The gap choices container width in pixels. Example: data-choices-container-width="100"
     */
    dataChoicesContainerWidth: {
      required: false,
      type: String,
      default: null
    },
    /*
     * NOT A QTI ATTRIBUTE - Determined by the QtiGapMatchInteraction component.
     * May be one of 'default'
     */
    interactionSubType: {
      required: false,
      type: String,
      default: 'default'
    },
    /*
     * NOT A QTI ATTRIBUTE
     */
    gapMatchInteractionStaticClass: {
      required: true,
      type: String
    },
    /*
     * NOT A QTI ATTRIBUTE
     * Parent QtiGapMatchInteraction component passed the
     * interaction state into this GapMatchGroup component.
     * Used for re-establishing a prior choice order on shuffled interactions.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [directedPair, or Array of directedPairs, depending on cardinality]
     *   state: {
     *     order: [Array of Identifiers]
     *   }
     * }
     */
    priorState: {
      required: false,
      type: Object,
      default: null
    }
  },

  data () {
    return {
      choices: [],
      order: [],
      gaps: [],
      response: null,
      isShuffle: null,
      gapMatchInteractionClassAttribute: null,
      presentationFactory: null,
      matchable: null,
      isQtiValid: true
    }
  },

  computed: {

    computedMaxAssociations () {
      return this.maxAssociations*1
    }

  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Array} response, or null if no response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Array} response - null if no response
     */
    setResponse (response) {
      this.response = response
    },

    disable () {
      if (this.matchable === null) return
      this.matchable.toggleDisable(true)
    },

    enable () {
      if (this.matchable === null) return
      this.matchable.toggleDisable(false)
    },

    getChoices () {
        return this.choices
    },

    setIsShuffle (isShuffle) {
        this.isShuffle = isShuffle
    },

    /**
     * @description Basic validation of the children.
     */
    validateChildren () {
      let gapChoiceCount = 0

      this.$slots.default()[0].children.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only qti-prompt, qti-gap-text, and qti-gap-img's permitted
          if (slot.type.name === 'QtiPrompt') {
            if (gapChoiceCount > 0) {
              throw new QtiValidationException('Invalid element order. qti-prompt must come before qti-gap-text\'s, qti-gap-img\'s, or qti-gap\'s')
            }

            if (!this.hasPrompt) return this.hasPrompt = true

            throw new QtiValidationException('Maximum of 1 qti-prompt element permitted')
          }

          if ((slot.type.name === 'QtiGapText') || (slot.type.name === 'QtiGapImg')) {
            return gapChoiceCount += 1
          }

          throw new QtiValidationException('Node is not one of qti-gap-text or qti-gap-img: "' + slot.type.name + '"')
        }
      })
    },

    processChildren () {
      const children = this.$.subTree.children[0].children[0].children

      children.forEach((node) => {
        if (node.component === null) return
        if ((node.type.name === 'QtiGapText') || (node.type.name === 'QtiGapImg')) {
          this.choices.push(node.component.proxy)
        }
      })

      // Gaps are nested inside HTML ... Use special handling (use the DOM) to get
      // a handle on all gaps.
      const gapElements = this.$refs.root.querySelectorAll('.gap-match-gap')
      gapElements.forEach(gap => {
        this.gaps.push(gap)
      })
    },

    insertAfter (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    },

    /**
     * @description Main workhorse method to initialize this Gap Match Group's UI.
     * @param {Array} response - a prior response or null
     */
    processGroupUI (response) {
      let gapChoiceWrapperElement = this.createGapChoiceWrapper()

      if (gapChoiceWrapperElement == null) return

      //let gapTargetWrapperElement = this.createGapTargetWrapper(gapChoiceWrapperElement)

      let container = this.createContainer(this.priorState)
      this.processContainerChoices(container, gapChoiceWrapperElement)
      this.saveContainerOrder(container)

      let gapTargetWrapperElement = this.createGapTargetWrapper(gapChoiceWrapperElement)

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory
        .initialize(
          this.$refs.root,
          gapChoiceWrapperElement,
          gapTargetWrapperElement,
          this.dataChoicesContainerWidth,
          this.choices,
          this.gaps)

      
      // Bind to the GapMatchInteraction widget.
      this.matchable = new GapMatchInteractionWidget(this.$refs.root, {
        interactionSubType: this.interactionSubType,
        cardinality: this.cardinality,
        maxAssociations: this.computedMaxAssociations,
        response: response,
        onReady: this.handleWidgetReady,
        onUpdate: this.handleWidgetUpdate,
        onAssociationsLimit: this.handleAssociationsLimit
      })
    },

    /**
     * @description Attempt to create and insert a ul element wrapper around the gap choices.
     * If successful return the ul.qti-gap-match-source-wrapper.  If not, return null.
     */
    createGapChoiceWrapper () {
      // Find the first qti-gap-choice
      let firstGapChoice = this.$refs.root.querySelector('.qti-gap-choice')

      // If there are no qti-gap-choice's, bail.
      if (firstGapChoice === null) return null

      // We have qti-gap-choices, wrap them.
      let gapChoiceWrapper = document.createElement('ul')
      gapChoiceWrapper.classList.add('qti-gap-match-source-wrapper')
      this.$refs.root.insertBefore(gapChoiceWrapper, firstGapChoice)

      // Return the wrapper
      return gapChoiceWrapper
    },

    /**
     * @description Create a target wrapper element and append the
     * element containing the gap content.
     * @param { DOM Element } gapChoiceWrapperElement 
     */
    createGapTargetWrapper (gapChoiceWrapperElement) {
      // Create the new target wrapper div
      const gapTargetWrapper = document.createElement('div')
      gapTargetWrapper.classList.add('qti-gap-match-target-wrapper')

      // Insert the empty target wrapper immediately after the Choice Wrapper
      this.insertAfter(gapTargetWrapper, gapChoiceWrapperElement)

      // The next element sibling after the target wrapper SHOULD BE the
      // element containing all gaps.  Append the element to the target wrapper.
      const gapContentElement = gapTargetWrapper.nextElementSibling
      if (gapContentElement != null) {
        gapTargetWrapper.append(gapContentElement)
      }

      // Return the wrapper
      return gapTargetWrapper
    },

    /**
     * @description This builds an array of gap choice nodes from
     * a prior state (if one exists) or from the original QTI order.
     * @return {Array} container - Array of choices in the proper order.
     */
    createContainer (priorState) {
      let container = []

      // If priorState is null, create a container of Choices
      // in their QTI order.
      if (priorState === null) {
        this.choices.forEach((choice) => {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        })

        if (this.isShuffle) {
          // Shuffle the container in place.
          qtiProcessing.shuffleArrayFixed(container)
        }

        return container
      }

      // If priorState is not null, rebuild a container of Choices
      // from the order array in priorState.state
      const order = priorState.state.order
      order.forEach((identifier) => {
        const choice = this.findChoiceByIdentifier(identifier, this.choices)
        if (choice !== null) {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        }
      }, this)

      return container
    },

    /**
     * @description Builds a new dom and choices
     * array from the choices array.
     * @param {Array} container - Array of ordered choices
     * @param {DomElement} wrapper - wrapper element for the choices
     */
    processContainerChoices (container, wrapper) {
      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      wrapper.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        wrapper.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    /**
     * @description Iterate through the given container, create and persist the
     * order in state.
     * @param {Array} container - a container or choices
     */
    saveContainerOrder (container) {
      const order = []
      container.forEach((choice) => {
        order.push(choice.node.identifier)
      })

      this.order = order
    },

    /**
     * @description Utility method for selecting a choice by identifier
     * @param {String} identifier - the identifier of the choice
     * @param {Array} choices - array of qti-gap-choice nodes
     * @return {Component} choice or an exception if not found
     */
    findChoiceByIdentifier (identifier, choices) {
      for (let i = 0; i < choices.length; i++) {
        if (choices[i].$el.getAttribute('data-identifier') === identifier) {
          return choices[i]
        }
      }

      throw new QtiEvaluationException('Gap Match Interaction State Invalid.  Choice identifier "' + identifier + '" not found.')
    },

    /**
     * @description Utility method used when generating a new template - in
     * which case we unbind the sortable widget and then call processGroupUI
     * all over again.
     */
    resetGroupUI () {
      // Reprocess the entire UI
      this.processGroupUI(null)
    },

    /**
     * @description Callback function that is part of the GapMatchInteraction
     * widget lifecycle when an interaction has completed its initialization.
     * A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetReady (data) {
      this.setResponse(data.response)

      // Important: Notify parent qti-gap-match-interaction component
      // that our gapMatchGroup is ready
      this.$emit('gapMatchGroupReady', {
        response: this.getResponse(),
        order: this.order
      })
    },

    /**
     * @description Callback function that is part of the GapMatchInteraction
     * widget lifecylce.  A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetUpdate (data) {
      this.setResponse(data.response)

      // Notify parent that we have an update
      this.$emit('gapMatchGroupUpdate', {
          response: this.getResponse()
        })
    },

    handleAssociationsLimit () {
      this.$emit('gapMatchGroupAssociationsLimit')
    },

    initializeGapMatchGroup () {
      // Set up a presentation factory
      this.presentationFactory = new GapMatchPresentationFactory(this.gapMatchInteractionStaticClass)
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-gap-match-interaction cardinality')
      }

      if ((this.cardinality !== 'single') && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-gap-match-interaction cardinality must be "single" or "multiple"')
      }

      this.setIsShuffle(this.shuffle === 'true' ? true : false)
      this.initializeGapMatchGroup()

      this.validateChildren()
    } catch (err) {
      this.isQtiValid = false
      console.log('[QtiGapMatchInteraction][ValidationError]', err.name, err.message)
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate and process the choices and targets
        this.processChildren()

        // Build a UI - triggers a 'gapMatchGroupReady' event upon completion.
        this.processGroupUI(this.priorState === null ? null : this.priorState.value)
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          console.log('[QtiGapMatchInteraction][ValidationException]', err.message)
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          console.log('[QtiGapMatchInteraction][EvaluationException]', err.message)
          throw new QtiEvaluationException(err.message)
        }
      }
    }
  },

  beforeUnmount () {
    if (this.matchable !== null) {
      this.matchable.destroy()
      this.matchable = null
    }
  }
}
</script>

<style>
.qti-gap-match-group-wrapper {
  margin: .75rem 0;
  display: block;
  width: 100%;
}

/* 
 * For qti-choices-left and right, use a two-column
 * layout with a 2rem gap separator.
 */
.qti-gap-match-group-wrapper.qti-choices-left,
.qti-gap-match-group-wrapper.qti-choices-right {
    display: flex;
    column-gap: 2rem;
}

.qti-gap-match-group-wrapper.qti-choices-left > *,
.qti-gap-match-group-wrapper.qti-choices-right > * {
    width:calc(50% - 1rem);
}

ul.qti-gap-match-source-wrapper {
  list-style: none;
  margin: 0 auto;
  padding: 12px 0 4px;
  width: 100%;
  text-align: center;
  border: 1px solid;
  border-color: var(--background);
  border-radius: .25rem;
  min-height: 3.4rem;
}

ul.qti-gap-match-source-wrapper.qti-choices-top,
ul.qti-gap-match-source-wrapper.qti-choices-bottom {
  text-align: left;
}

ul.qti-gap-match-source-wrapper.target-active {
  background-color: var(--well-bg);
  border: 1px dashed;
  border-color: var(--ea-button-secondary-bgc);
}

/* Hide sources when not containing a dragger */
ul.qti-gap-match-source-wrapper > li.source {
  display: none;
}

ul.qti-gap-match-source-wrapper > li.source.full {
  display: inline-block;
  padding: 0;
  margin: 0 .15rem .15rem;
  vertical-align: top;
}

div.qti-gap-match-target-wrapper {
  margin-top: .5rem;
  margin-bottom: .5rem;
  padding: 0;
  width: 100%;
}

div.qti-gap-match-target-wrapper.qti-choices-top,
div.qti-gap-match-target-wrapper.qti-choices-bottom {
  display: block;
}

.gm-dragger-placeholder {
  cursor: none;
}

.gap-choice-text.draggable.dragging {
  position: fixed;
  left: 0;
  top: 0;
  will-change: transform;
  z-index: 1;
}

.gap-choice-text.draggable {
  display: inline-block;
  position: relative;
  font-weight:400;
  font-size: 16px;
  line-height: 26px;
  cursor: move;
  padding: 0 .25rem;
  margin: 0;
  vertical-align: top;
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  text-decoration: none;
  border-radius: .25rem;
  min-height: 26px;
}

.gap-choice-text.draggable.disabled {
  cursor: default;
}
</style>
