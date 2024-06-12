<template>
  <div class="qti-card">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A data structure within a catalog which contains dormant HTML content or a
 * resource reference for a specific support/feature. A card may also contain
 * multiple CardEntry containers. For example, you might have multiple CardEntry
 * nodes for different language versions of a particular support.
 *
 * The qti-card node holds the following elements:
 *   qti-card-entry
 *   qti-html-content
 *   qti-file-href
 */
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiCard',

  props: {
    /*
     * This attribute names either pre-defined supports or a custom-named
     * support. The named support will indicate for whom the dormant content
     * is intended. Use only one card for any particular named support in
     * a catalog.
     */
    support: {
      type: String,
      required: true
    },
    'xml:lang': {
      type: String,
      required: false,
      default: ''
    },
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

    getChildren () {
      return this.children
    },

    isValidCardChild (tag) {
      if (tag === 'qti-card-entry') return true
      if (tag === 'qti-html-content') return true
      if (tag === 'qti-file-href') return true
      return false
    },

    /**
     * Validate the child nodes:
     * children (0-n)
     */
    validateChildren: function () {
      let countChildren = 0
      let firstChildTag = null

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Slot must be one of: qti-card-entry, qti-html-content, qti-file-href
          if (!this.isValidCardChild(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid Card Child node: "' + slot.type.name + '"')
          }

          if ((countChildren > 0) && (slot.type.name !== firstChildTag)) {
            throw new QtiValidationException('All Card Child elements must be the same element type: "' + firstChildTag + '"')
          }

          if ((countChildren > 0) && (qtiAttributeValidation.kebabCase(slot.type.name) !== 'qti-card-entry')) {
            throw new QtiValidationException('Multiple Card Child elements of type "' + slot.type.name + '" not permitted')
          }

          if (countChildren === 0) {
            firstChildTag = slot.type.name
          }

          countChildren += 1
        }
      })
    },

    /**
     * Iterate through the child nodes:
     * children (0-n)
     */
    processChildren () {
      const cardChildren = this.$.subTree.children[0].children

      cardChildren.forEach((cardChild) => {
        if (cardChild.component === null) return
        this.children.push(cardChild.component.proxy)
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
        console.log('[QtiCard][Support: ' + this.support + ' ]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
