<template v-slot:Mapping>
  <div class="qti-mapping">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A special class used to create a mapping from a source set of any baseType (except file and duration) to
 * a single float. Note that mappings from values of base type float should be avoided due to the difficulty
 * of matching floating point values, see the match operator for more details. When mapping containers the
 * result is the sum of the mapped values from the target set. See mapResponse for details.
 * Note: A qti-mapping must contain at least one qti-map-entry
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMapping',

  props: {
    /*
     * [0..1] multiplicity
     * The lower bound for the result of mapping a container. If unspecified there is no lower-bound.
     */
    lowerBound: {
      type: String,
      required: false
    },
    /*
     * [0..1] multiplicity
     * The upper bound for the result of mapping a container. If unspecified there is no upper-bound.
     */
    upperBound: {
      type: String,
      required: false
    },
    /*
     * The default value from the target set to be used when no explicit mapping for a source value is given.
     */
    defaultValue: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      // value contains the table of map entries
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      valueLowerBound: null,
      valueUpperBound: null,
      valueDefaultValue: new BigNumber(0).toNumber(),
      isQtiValid: true
    }
  },

  methods: {

    getValue () {
      return this.value
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return this.value === null
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    getLowerBound () {
      return this.valueLowerBound
    },

    setLowerBound (lowerBound) {
      this.valueLowerBound = lowerBound
    },

    getUpperBound () {
      return this.valueUpperBound
    },

    setUpperBound (upperBound) {
      this.valueUpperBound = upperBound
    },

    getDefaultValue () {
      return this.valueDefaultValue
    },

    setDefaultValue (defaultValue) {
      this.valueDefaultValue = defaultValue
    },

    computeFloatValue (textContent) {
      let value = null
      try {
        value = new BigNumber(textContent)
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value.toNumber()
    },

    /**
     * Apply mapping constraints to a value.
     * @param - value (BigNumber object) - value to be constrained
     * @return - a constrained result
     */
    applyConstraints (value) {
      if ((value === null) || !BigNumber.isBigNumber(value)) {
        return null
      }

      if (this.getLowerBound() !== null) {
        if (value.comparedTo(this.getLowerBound()) < 0) {
          value = new BigNumber(this.getLowerBound())
        }
      }

      if (this.getUpperBound() !== null) {
        if (value.comparedTo(this.getUpperBound()) > 0) {
          value = new BigNumber(this.getUpperBound())
        }
      }

      return value.toNumber()
    },

    /**
     * Iterate through the child qti-map-entry nodes, performing validation tests on
     * the children.  Set the mapping table if all validation tests pass.
     */
    validateChildren: function () {
      let countMapEntries = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have at least one qti-map-entry node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect a map entry
          if (qtiAttributeValidation.kebabCase(slot.type.name) === 'qti-map-entry') {
            countMapEntries += 1
          } else {
            throw new QtiValidationException('Node is not a qti-map-entry: "' + slot.tpe.name + '"')
          }
        }
      })

      if (countMapEntries === 0) {
        throw new QtiValidationException('Must have at least one qti-map-entry node')
      }
    },

    /**
     * Builds the final mapping array from the children.
     * @return - constructed mapping array
     */
    processChildren () {
      let mapping = null

      const children = this.$.subTree.children[0].children

      children.forEach((mapEntry) => {
        if (mapEntry.component === null) return
        const node = mapEntry.component.proxy
        if (mapping === null) {
          mapping = []
        }
        mapping.push(node.getValue())
      })

      return mapping
    }

  },

  created () {
    try {
      // Validate the attributes. convert all to proper BigNumber floats
      if (typeof this.lowerBound !== 'undefined') {
        this.setLowerBound(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.lowerBound)))
      }
      if (typeof this.upperBound !== 'undefined') {
        this.setUpperBound(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.upperBound)))
      }
      if (typeof this.defaultValue !== 'undefined') {
        this.setDefaultValue(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.defaultValue)))
      }

      this.validateChildren()
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
        // All good.  Save off our mapping.
        this.setValue(this.processChildren())
        console.log('[QtiMapping][lowerBound][upperBound][defaultValue][Value]', this.getLowerBound(), this.getUpperBound(), this.getDefaultValue(), this.getValue())
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
