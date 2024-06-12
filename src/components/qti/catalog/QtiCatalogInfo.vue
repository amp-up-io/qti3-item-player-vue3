<template>
  <div class="qti-catalog-info">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A CatalogInfo (qti-catalog-info) element is a container for supplemental
 * item content, or alternative accessibility content, that is defined to
 * enable the range of supported accessibility options to reconfigure the
 * assessment content. This content augments the original content that is
 * defined for the associated QTI feature.
 *
 * The qti-catalog-info node holds one or more catalogs. Catalogs hold and
 * reference item content that is presented to candidates based on their
 * candidate profile (PNP) requirements.
 */
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiCatalogInfo',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    isCatalog (tag) {
      if (tag === 'qti-catalog') return true
      return false
    },

    /**
     * Validate the child nodes:
     * expressions (1-n)
     */
     validateChildren: function () {
      let countChildren = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Invalid CatalogInfo.  Must contain at least 1 qti-catalog child node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be qti-catalog
          if (!this.isCatalog(qtiAttributeValidation.kebabCase(slot.type.name))) {
            throw new QtiValidationException('Invalid CatalogInfo child node: "' + slot.type.name + '"')
          }

          countChildren += 1
        }
      })

      if (countChildren === 0) {
        throw new QtiValidationException('Invalid CatalogInfo.  Must contain at least 1 qti-catalog child node')
      }
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
      console.log('[QtiCatalogInfo]')
    }
  }
}
</script>
