<template>
  <main class="test-shell">
    <header class="test-header">
      <div>
        <p class="eyebrow">Manual Verification</p>
        <h1>Order Interaction Keyboard Test</h1>
        <p class="instructions">
          Tab into a choice, then use
          <strong>{{ arrowInstructions }}</strong>
          to move it. Press <strong>Home</strong> to send it to the start and
          <strong>End</strong> to send it to the end.
        </p>
      </div>

      <div class="sample-switcher">
        <button type="button" @click="loadSample('horizontal')">
          Horizontal Sample
        </button>
        <button type="button" @click="loadSample('vertical')">
          Vertical Sample
        </button>
      </div>
    </header>

    <Qti3Player
      ref="qti3player"
      container-class="qti3-player-container-fluid"
      color-class="qti3-player-color-default"
      container-padding-class="qti3-player-container-padding-2"
      suppress-alert-messages
      suppress-invalid-response-messages
      @notifyQti3PlayerReady="handlePlayerReady"
    />
  </main>
</template>

<script>
import Qti3Player from '@/components/Qti3Player.vue'
import { PnpFactory } from '@/shared/helpers/PnpFactory'
import { SessionControlFactory } from '@/shared/helpers/SessionControlFactory'

const SAMPLE_ITEMS = {
  horizontal: {
    guid: 'order-keyboard-horizontal-guid',
    xml: `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="order-keyboard-horizontal" title="Order keyboard horizontal" adaptive="false" time-dependent="false">
      <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>
      <qti-item-body>
        <qti-order-interaction response-identifier="RESPONSE" orientation="horizontal">
          <qti-prompt>Put these presidents in chronological order by presidency.</qti-prompt>
          <qti-simple-choice identifier="CHOICE_D">Theodore Roosevelt</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_A">James Madison</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_C">Abraham Lincoln</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_B">Andrew Jackson</qti-simple-choice>
        </qti-order-interaction>
      </qti-item-body>
    </qti-assessment-item>`
  },
  vertical: {
    guid: 'order-keyboard-vertical-guid',
    xml: `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="order-keyboard-vertical" title="Order keyboard vertical" adaptive="false" time-dependent="false">
      <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>
      <qti-item-body>
        <qti-order-interaction response-identifier="RESPONSE" orientation="vertical">
          <qti-prompt>Put these presidents in chronological order by presidency.</qti-prompt>
          <qti-simple-choice identifier="CHOICE_D">Theodore Roosevelt</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_A">James Madison</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_C">Abraham Lincoln</qti-simple-choice>
          <qti-simple-choice identifier="CHOICE_B">Andrew Jackson</qti-simple-choice>
        </qti-order-interaction>
      </qti-item-body>
    </qti-assessment-item>`
  }
}

export default {
  name: 'OrderKeyboardTestApp',

  components: {
    Qti3Player
  },

  data () {
    return {
      qti3Player: null,
      pnp: null,
      sessionControl: null,
      currentSample: 'horizontal'
    }
  },

  computed: {
    arrowInstructions () {
      return (this.currentSample === 'vertical')
        ? 'Up and Down arrow keys'
        : 'Left and Right arrow keys'
    }
  },

  methods: {
    initialize () {
      this.pnp = new PnpFactory()
      this.sessionControl = new SessionControlFactory()
      this.sessionControl.setValidateResponses(false)
      this.sessionControl.setShowFeedback(false)
    },

    getConfiguration (guid) {
      return {
        guid,
        pnp: this.pnp.getPnp(),
        sessionControl: this.sessionControl.getSessionControl()
      }
    },

    loadSample (sampleKey) {
      if (this.qti3Player === null) return

      this.currentSample = sampleKey
      const sample = SAMPLE_ITEMS[sampleKey]
      this.qti3Player.loadItemFromXml(sample.xml, this.getConfiguration(sample.guid))
    },

    handlePlayerReady (qti3Player) {
      this.qti3Player = qti3Player
      this.loadSample(this.currentSample)
    }
  },

  created () {
    this.initialize()
  }
}
</script>

<style>
body {
  margin: 0;
}

.test-shell {
  padding: 1rem;
}

.test-header {
  margin-bottom: 1.5rem;
}

.sample-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
</style>
