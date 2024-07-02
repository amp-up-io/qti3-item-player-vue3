<template>
  <div ref="root"
    class="qti-interaction-modules">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The set of interaction configuration settings to be used by the associated PCI. 
 * These settings are defined with respect to the set of JavaScript library modules.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiInteractionModules',

  props: {
    /*
     * Provides a URL which is a reference to a JSON configuration file which 
     * describes the PCI module configuration to use for this interaction instance. 
     * Relative URLs indicate relative paths in the QTI content package. If no value 
     * is supplied a value of "modules/module_resolution.js" should be applied.
     */
     primaryConfiguration: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Provides a URL which is a reference to a JSON configuration file which 
     * describes the PCI module configuration to use for this interaction instance. 
     * Relative URLs indicate relative paths in the QTI content package. If no value 
     * is supplied a value of "modules/fallback_module_resolution.js" should be applied.
     */
    secondaryConfiguration: {
      required: false,
      type: String,
      default: ''
    },
  },

  data () {
    return {
      modules: [],
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    getPrimaryConfiguration () {
      return this.primaryConfiguration
    },

    getSecondaryConfiguration () {
      return this.secondaryConfiguration
    },

    getModules () {
      return this.modules
    },

    /**
     * @description Basic validation of the children.
     */
     validateChildren () {

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only qti-interaction-module permitted
          if (slot.type.name === 'QtiInteractionModule') return
          
          throw new QtiValidationException('Node is not a qti-interaction-module: "' + slot.type.name + '"')
        }
      })
    },

    processChildren () {
      const children = this.$.subTree.children[0].children
      children.forEach((node) => {
        if ((node.type.name === 'QtiInteractionModule') && (node.component !== null)) {
          this.modules.push(node.component.proxy)
        }
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

        console.log('[PCI][' + this.$options.name + '][PrimaryCfg='+this.primaryConfiguration+'][SecondaryCfg='+this.secondaryConfiguration+']')
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
div.qti-interaction-modules {
  display: none;
}
</style>
