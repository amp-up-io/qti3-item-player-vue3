<template>
  <div class="qti-response-processing">
    <div v-if="useStandardTemplate">
      <component ref="rptemplate" v-bind:is="templateXml"></component>
    </div>
    <div v-if="containsSlotData">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseProcessing',

  props: {
    template: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      responseRules: [],
      isQtiValid: true,

      matchCorrectXml: `<qti-response-condition>
      <qti-response-if>
          <qti-match>
              <qti-variable identifier="RESPONSE"/>
              <qti-correct identifier="RESPONSE"/>
          </qti-match>
          <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1</qti-base-value>
          </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
          <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">0</qti-base-value>
          </qti-set-outcome-value>
      </qti-response-else>
  </qti-response-condition>`,
      mapResponseXml: `<qti-response-condition>
        <qti-response-if>
            <qti-is-null>
                <qti-variable identifier="RESPONSE"/>
            </qti-is-null>
            <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
                <qti-map-response identifier="RESPONSE"/>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`,
      mapResponsePointXml: `<qti-response-condition>
        <qti-response-if>
            <qti-is-null>
                <qti-variable identifier="RESPONSE"/>
            </qti-is-null>
            <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
                <qti-map-response-point identifier="RESPONSE"/>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`
    }
  },

  computed: {
    containsSlotData () {
      return this.$slots.default
    },

    useStandardTemplate () {
      // Support standard template injection IF there are no qti-response-processing child nodes
      if (!this.containsSlotData) {
        const isMatchCorrect = /.*(match_correct.xml|match_correct)$/
        const isMapResponse = /.*(map_response.xml|map_response)$/
        const isMapResponsePoint = /.*(map_response_point.xml|map_response_point)$/
        return (isMatchCorrect.test(this.template) || isMapResponse.test(this.template) || isMapResponsePoint.test(this.template))
      }
      return false
    },

    templateXml () {
      const isMatchCorrect = /.*(match_correct.xml|match_correct)$/
      const isMapResponse = /.*(map_response.xml|map_response)$/
      const isMapResponsePoint = /.*(map_response_point.xml|map_response_point)$/

      let xml = ''
      if (isMatchCorrect.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MATCH_CORRECT')
        xml = this.matchCorrectXml
      } else if (isMapResponse.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MAP_RESPONSE')
        xml = this.mapResponseXml
      } else if (isMapResponsePoint.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MAP_RESPONSE_POINT')
        xml = this.mapResponsePoint
      }

      return {
        template: `<div id="amp-rptemplate-container">${xml}</div>`
      }
    }
  },

  methods: {

    /**
     * Validate the child nodes:
     * qti-response-condition
     * qti-response-processing-fragment
     * qti-set-outcome-value
     * qti-lookup-outcome-value
     * qti-exit-response
     */
    validateChildren () {
      if (!this.containsSlotData) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          if (!qtiProcessing.isResponseRuleNode(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid Response Rule: "' + slot.type.name + '"')
          }
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * qti-response-condition
     * qti-response-processing-fragment
     * qti-set-outcome-value
     * qti-lookup-outcome-value
     * qti-exit-response
     */
    processChildren () {
      const children = this.getChildren()

      children.forEach((rule) => {
        this.responseRules.push(rule.component.proxy)
      })
    },

    getChildren () {
      // If using a standard template, the rules will be one additional level down from this component.
      return (this.useStandardTemplate)
                ? this.$.subTree.children[0].children[0].component.subTree.children
                : this.$.subTree.children[1].children[0].children
    },

    evaluate () {
      try {
        this.responseRules.forEach((rule) => {
          rule.evaluate()
        })
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          console.log('[' + err.name + '] ' + err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
    try {
      // Validate the Response Rules
      this.validateChildren()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Process all Response Rules in this RP.
        this.processChildren()

        // Notify store of our new model.
        store.defineResponseProcessing({
            node: this
          })
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
