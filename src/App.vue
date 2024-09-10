<template>
  <div>
    <Qti3Player
      ref="qti3player"
      :container-class="containerClass"
      :color-class="colorClass"
      :container-padding-class="containerPaddingClass"
      suppress-alert-messages
      suppress-invalid-response-messages
      @notifyQti3PlayerReady="handlePlayerReady"
      @notifyQti3ItemReady="handleItemReady"
      @notifyQti3SuspendAttemptCompleted="handleSuspendAttemptCompleted"
      @notifyQti3EndAttemptCompleted="handleEndAttemptCompleted"
      @notifyQti3ScoreAttemptCompleted="handleScoreAttemptCompleted"
      @notifyQti3ItemAlertEvent="displayItemAlertEvent"
      @notifyQti3ItemCatalogEvent="handleItemCatalogEvent"
    />
    <button ref="btnPrev" type="button" @click="handlePrevItem" class="btn btn-sm btn-outline-primary">Prev</button>
    <button ref="btnNext" type="button" @click="handleNextItem" class="btn btn-sm btn-outline-primary">Next</button>
</div>
</template>

<script>
import Qti3Player from '@/components/Qti3Player.vue'
import { PnpFactory } from '@/shared/helpers/PnpFactory'
import { SessionControlFactory } from '@/shared/helpers/SessionControlFactory'
import Swal from 'sweetalert2'

export default {
  name: 'App',

  components: {
    Qti3Player
  },

  data () {
    return {
      isTestStarted: false,
      currentItem: 0,
      items: [
        {
          "identifier": "sbac-200-183300-templated",
          "guid": "0000-0000-0001sbac-templated",
          "xml": `<!-- This example adapted from the Smarter Balanced IRP, copyright Smarter Balanced. -->
      <qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
        xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" 
        identifier="sbac-200-183300-templated" time-dependent="false" title="sbac-200-183300-templated" xml:lang="en">
        <qti-response-declaration base-type="identifier" cardinality="multiple" identifier="RESPONSE">
          <qti-correct-response>
            <qti-value>D</qti-value>
            <qti-value>E</qti-value>
          </qti-correct-response>
        </qti-response-declaration>
        <qti-outcome-declaration base-type="float" cardinality="single" identifier="SCORE" normal-maximum="1.0" normal-minimum="0.0">
          <qti-default-value>
            <qti-value>0</qti-value>
          </qti-default-value>
        </qti-outcome-declaration>
        <qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>
        <qti-template-declaration identifier="a" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
        <qti-template-declaration identifier="b" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
        <qti-template-declaration identifier="c" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
        <qti-template-declaration identifier="d" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
        <qti-template-processing>
          <qti-set-template-value identifier="a">
            <qti-random-integer min="2" max="20"/>
          </qti-set-template-value>
          <qti-set-template-value identifier="b">
            <qti-random-integer min="3" max="13"/>
          </qti-set-template-value>
          <qti-set-template-value identifier="c">
            <qti-integer-divide>
              <qti-variable identifier="a"/>
              <qti-variable identifier="b"/>
            </qti-integer-divide>
          </qti-set-template-value>
          <qti-set-template-value identifier="d">
            <qti-integer-modulus>
              <qti-variable identifier="a"/>
              <qti-variable identifier="b"/>
            </qti-integer-modulus>
          </qti-set-template-value>
          <qti-template-constraint>
            <qti-and>
              <qti-gt>
                <qti-variable identifier="a"/>
                <qti-variable identifier="b"/>
              </qti-gt>
              <qti-not>
                <qti-equal tolerance-mode="exact">
                  <qti-variable identifier="c"/>
                  <qti-variable identifier="d"/>
                </qti-equal>
              </qti-not>
              <qti-not>
                <qti-equal tolerance-mode="exact">
                  <qti-variable identifier="d"/>
                  <qti-base-value base-type="integer">0</qti-base-value>
                </qti-equal>
              </qti-not>
            </qti-and>
          </qti-template-constraint>
      </qti-template-processing>
      <qti-item-body data-catalog-idref="item-183300-global">
        <div class="qti-layout-row">
          <div class="qti-layout-col8 qti-layout-offset2">
            <div class="prompt">
              <strong>sbac-200-183300 <em>with templating</em></strong>
              <hr />
              <p>
                Select <strong>all</strong> values equivalent to <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mfrac bevelled="false"><mi>a</mi><mi>b</mi></mfrac></math>.
              </p>
            </div>
            <qti-choice-interaction class="sbac qti-labels-none" shuffle="true" max-choices="5" min-choices="1" response-identifier="RESPONSE">
              <qti-simple-choice identifier="A">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac bevelled="false"><mrow><mo>-</mo><mi>a</mi></mrow><mrow><mo>-</mo><mi>b</mi></mrow></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="B">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mi>d</mi><mfrac bevelled="false"><mi>c</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="C">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mi>c</mi><mfrac bevelled="false"><mi>d</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="D">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mfrac bevelled="false"><mrow><mo>-</mo><mi>a</mi></mrow><mrow><mo>-</mo><mi>b</mi></mrow></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="E">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mi>c</mi><mfrac bevelled="false"><mi>d</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
            </qti-choice-interaction>
          </div>
       </div>
      </qti-item-body>
      <qti-response-processing>
        <qti-response-condition>
          <qti-response-if>
            <qti-match>
              <qti-variable identifier="RESPONSE"/>
              <qti-correct identifier="RESPONSE"/>
            </qti-match>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1</qti-base-value>
            </qti-set-outcome-value>
            <qti-set-outcome-value identifier="FEEDBACK">
              <qti-base-value base-type="identifier">correct</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-if>
          <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
            <qti-set-outcome-value identifier="FEEDBACK">
              <qti-base-value base-type="identifier">incorrect</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-else>
        </qti-response-condition>
      </qti-response-processing>
      <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
        <qti-content-body>
          <p>Well done!</p>
        </qti-content-body>
      </qti-modal-feedback>
      <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
        <qti-content-body>
          <p>Sorry, your answer is not correct.</p>
        </qti-content-body>
      </qti-modal-feedback>
      </qti-assessment-item>`
        },
      {
        "identifier": "q2-choice-interaction-single-cardinality",
        "guid": "0000-0000-0001",
        "xml": `<qti-assessment-item 
          xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" 
          identifier="q2-choice-interaction-single-cardinality" title="Q2 - Choice Interaction - Single Cardinality" adaptive="false" time-dependent="false">
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-correct-response>
              <qti-value>choice_c</qti-value>
            </qti-correct-response>
          </qti-response-declaration>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
            <qti-default-value>
              <qti-value>0.0</qti-value>
            </qti-default-value>
          </qti-outcome-declaration>
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" class="" max-choices="0" shuffle="true" min-choices="0">
              <qti-prompt>Select 0 to 1 SimpleChoice below and end the attempt by submitting the response.</qti-prompt>
              <qti-simple-choice identifier="choice_a">choice_a</qti-simple-choice>
              <qti-simple-choice identifier="choice_b">choice_b</qti-simple-choice>
              <qti-simple-choice identifier="choice_c">choice_c</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>
          <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
          </qti-assessment-item>`
      }
      ],
      maxItems: 2,
      containerClass: 'qti3-player-container-fluid',
      colorClass: 'qti3-player-color-default',
      containerPaddingClass: 'qti3-player-container-padding-2',
      itemStates: new Map(),
      sessionControl: null,
      pnp: null,
      qti3Player: null,
      item: null,
      performResponseProcessing: true
    }
  },

  methods: {

    initialize () {
      // Score when navigating
      this.performResponseProcessing = true
      // Load pnp
      this.pnp = new PnpFactory()
      // Load sessionControl
      this.sessionControl = new SessionControlFactory()
      this.sessionControl.setValidateResponses(true)
      this.sessionControl.setShowFeedback(false)
    },

    loadFirstItem () {
      this.loadItemAtIndex(0)
    },

    handleNextItem () {
      console.log('[Controller][NextItem][' + this.currentItem + ']')
      if (!this.isTestStarted) {
        this.isTestStarted = true
        this.loadFirstItem()
        return
      }

      this.initiateNavigateNextItem()
    },

    handlePrevItem () {
      console.log('[Controller][PrevItem][' + this.currentItem + ']')
      if (this.currentItem === 0) return

      this.initiateNavigatePrevItem()
    },

    initiateNavigateNextItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigateNextItem')
      else
        this.qti3Player.suspendAttempt('navigateNextItem')
    },

    navigateNextItem () {
      console.log('[NavigateNextItem]')

      this.currentItem += 1
      this.loadItemAtIndex(this.currentItem)
    },

    initiateNavigatePrevItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigatePrevItem')
      else
        this.qti3Player.suspendAttempt('navigatePrevItem')
    },

    navigatePrevItem () {
      console.log('[NavigatePrevItem]')

      this.currentItem -= 1
      this.loadItemAtIndex(this.currentItem)
    },

    handleEndAttemptCompleted (data) {
      this.evaluateResults(data)
    },

    handleSuspendAttemptCompleted (data) {
      this.evaluateResults(data)
    },

    handleScoreAttemptCompleted () {
    },

    evaluateResults (data) {
      // Save our state
      this.setTestStateItemState(data.state)

      if (data.state.validationMessages.length > 0) {
        // Display validation messages
        this.displayInvalidResponseMessages(data.state.validationMessages)
        // Do not proceed if we have any validationMessages
        return
      }

      this.next(data.target)
    },

    next (action) {
      switch (action) {
        case 'navigateNextItem':
          this.navigateNextItem()
          break

        case 'navigatePrevItem':
          this.navigatePrevItem()
          break

        default:
          // Unknown action --> NOOP
      }
    },

    loadItemAtIndex (index) {
      if (index === null) return
      if ((index < 0) || (index > this.maxItems-1)) return

      // Build a configuration
      const configuration = this.getConfiguration(this.items[index].guid)

      this.qti3Player.loadItemFromXml(this.items[index].xml, configuration)
    },

    toggleButtonDisabled (buttonRef, disable) {
      if (disable) {
        buttonRef.setAttribute('disabled', '')
      } else {
        buttonRef.removeAttribute('disabled')
      }
    },

    setTestStateItemState (state) {
      console.log('[Controller][SetItemState][' + state.guid + ']', state)
      this.itemStates.set(state.guid, state)
    },

    getTestStateItemState (guid) {
      console.log('[Controller][GetItemState][' + guid + ']', this.itemStates.get(guid))
      return this.itemStates.get(guid)
    },

    getConfiguration (guid) {
      const configuration = {}

      // Fetch prior state from Test State
      const state = this.getTestStateItemState(guid)
      if (typeof state !== 'undefined') {
        configuration.state = state
      }

      // IMPORTANT: Stamp the item's tracking guid onto the configuration
      configuration.guid = guid
      configuration.pnp = this.pnp.getPnp()
      configuration.sessionControl = this.sessionControl.getSessionControl()

      return configuration
    },

    displayItemAlertEvent (event) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: event.icon,
        html: event.message,
        showConfirmButton: false,
        showCloseButton: true,
        timer: 3000,
        timerProgressBar: true
      })
    },

    displayInvalidResponseMessages (messages) {
      messages.forEach((message) => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            html: message.message,
            showConfirmButton: false,
            showCloseButton: true,
            timer: 3000,
            timerProgressBar: true
          })
      })
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3PlayerReady'
     * event.  This event is fired upon mounting of the Qti3Player component.
     *
     * The Qti3Player is now ready for XML loading.
     * @param {Component} qti3Player - the Qti3Player component itself
     */
    handlePlayerReady (qti3Player) {
      this.qti3Player = qti3Player
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3ItemReady'
     * event.  This event is fired upon completion of the qti-assessment-item
     * component's loading of XML.
     * 
     * The inner qti-assessment-item component is passed in the event.
     * @param {Component} item - the qti-assessment-item component itself
     */
    handleItemReady (item) {
      this.item = item
    },

    handleItemCatalogEvent (event) {
      console.log('[ItemCatalogEvent][Type: ' + event.type + ']', event)
    }

  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
</style>
