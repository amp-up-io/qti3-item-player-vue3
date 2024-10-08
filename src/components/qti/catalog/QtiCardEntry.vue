<template>
  <div class="qti-card-entry">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A content container within a catalog card. Each instance of a CardEntry provides
 * a different resource where an attribute (often custom attributes) on the CardEntry
 * element declares the difference between the resources, and where the attribute
 * value aligns with a specific preference/need from the candidate's PNP (or an
 * assessment program's settings). For example, there could be multiple CardEntry
 * nodes for different language versions for a particular support.
 *
 * The qti-card -entry node holds the following elements:
 *   qti-html-content
 *   qti-file-href
 */
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiCardEntry',

  props: {
    /*
     * QtiCardEntry should have an xml:lang
     */
    'xml:lang': {
      type: String,
      required: false,
      default: ''
    },
    /*
     * An attribute that denotes whether the particular card is the default
     * content for the support (listed in the Card attribute). If the CardEntry
     * attribute values do not identify the proper content for a candidate,
     * use the content designated as default. Only one of the CardEntry
     * instances can have a default designation.
     */
    default: {
      type: String,
      required: false,
      default: 'false'
    },
    /*
     * Smarter Balanced Extensions for Keyword Translations,
     * Illustrated Glossary, and Braille Files.
     */
    dataListCode: {
      type: String,
      required: false
    },
    dataListType: {
      type: String,
      required: false
    },
    dataMathRepresentation: {
      type: String,
      required: false
    },
    dataContracted: {
      type: String,
      required: false
    },
    dataType: {
      type: String,
      required: false
    },
    dataFormat: {
      type: String,
      required: false
    }

  },

  data () {
    return {
      children: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * @description Convenience method to provide the 'xml:lang' attribute.
     * @return {String} the language code or ''
     */
    getLanguage () {
      return this.$props['xml:lang']
    },

    /**
     * @description Convenience method to provide the 'default' attribute
     * as a Boolean value.
     * @return {Boolean} true when default="true", false otherwise.
     */
    isDefault () {
      return (this.$props['default'] === 'true')
    },

    /**
     * @description Return all known and defined data- attributes in one payload.
     * @return {Object} containing all known and defined data- attributes
     */
    getDataAttributes () {
      let obj = {}
      if (typeof this.dataListCode !== 'undefined') obj['data-list-code'] = this.dataListCode
      if (typeof this.dataListType !== 'undefined') obj['data-list-type'] = this.dataListType
      if (typeof this.dataMathRepresentation !== 'undefined') obj['data-math-representation'] = this.dataMathRepresentation
      if (typeof this.dataContracted !== 'undefined') obj['data-contracted'] = this.dataContracted
      if (typeof this.dataType !== 'undefined') obj['data-type'] = this.dataType
      if (typeof this.dataFormat !== 'undefined') obj['data-format'] = this.dataFormat
      return obj
    },

    getChildren () {
      return this.children
    },

    isValidCardChild (tag) {
      if (tag === 'qti-html-content') return true
      if (tag === 'qti-file-href') return true
      return false
    },

    /**
     * Validate the child nodes:
     * qti-card (1-*)
     */
    validateChildren: function () {
      let countChildren = 0

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be one of qti-html-content, qti-file-href
          if (!this.isValidCardChild(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid CardEntry Child node: "' + slot.type.name + '"')
          }

          if (countChildren > 1) {
            throw new QtiValidationException('Maximum of one CardEntry Child node permitted')
          }

          countChildren += 1
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * qti-html-content or qti-file-href
     */
    processChildren () {
      const children = this.$.subTree.children[0].children

      children.forEach((child) => {
        if (child.component === null) return
        this.children.push(child.component.proxy)
      })
    }
  },

  created () {
    try {
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
        this.processChildren()
        console.log('[QtiCardEntry][Lang: ' + this.$props['xml:lang'] + ' ]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
