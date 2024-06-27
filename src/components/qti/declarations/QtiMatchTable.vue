<template>
  <div class="qti-match-table">
    <slot></slot>
  </div>
</template>

<script>
/*
 * An interpolationTable transforms a source float (or integer) by finding the first interpolationTableEntry
 * with a sourceValue that is less than or equal to (subject to includeBoundary) the source value. For example,
 * an interpolation table can be used to map a raw numeric score onto an identifier representing a grade. It may
 * also be used to implement numeric transformations such as those from a simple raw score to a value on a
 * calibrated scale.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMatchTable',

  props: {
    /*
     * [0-1] multiplicity
     * The default outcome value to be used when no matching table entry is found. If omitted, the NULL value is used.
     */
    defaultValue: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      // value contains the table of interpolation table entries
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      valueDefaultValue: null,
      tableType: 'match',
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

    setBaseType (baseType) {
      this.valueBaseType = baseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    getTableType() {
      return this.tableType
    },

    getDefaultValue () {
      return this.valueDefaultValue
    },

    setDefaultValue (defaultValue) {
      this.valueDefaultValue = defaultValue
    },

    /**
     * Iterate through the child qti-match-table-entry nodes, performing validation tests on
     * the children.  Set the match table if all validation tests pass.
     */
    validateChildren: function () {
      let countEntries = 0

      if (!this.$slots.default) {
        throw new QtiValidationException('Must have at least one qti-match-table-entry node')
      }

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect a match table entry
          if (qtiAttributeValidation.kebabCase(slot.type.name) === 'qti-match-table-entry') {
            countEntries += 1
          } else {
            throw new QtiValidationException('Node is not a qti-match-table-entry: "' + slot.tpe.name + '"')
          }
        }
      })

      if (countEntries === 0) {
        throw new QtiValidationException('Must have at least one qti-match-table-entry node')
      }
    },

    /**
     * Builds the final matchTable array from the children.
     * @return - constructed matchTable array
     */
    processChildren () {
      let table = null

      const children = this.$.subTree.children[0].children

      children.forEach((tableEntry) => {
        if (table === null) {
          table = []
        }
        table.push(tableEntry.getValue())
      })

      return table
    }

  },

  created () {
    try {
      let declarationBaseType = this.$parent.getBaseType()
      this.setBaseType(declarationBaseType)
      if (typeof this.defaultValue === 'undefined') {
        this.setDefaultValue(null)
      } else {
        this.setDefaultValue(qtiAttributeValidation.validateValueFromBaseType(declarationBaseType, this.defaultValue))
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
        // All good.  Save off our matchTable.
        this.setValue(this.processChildren())
        console.log('[QtiMatchTable][DefaultValue][Value]', this.getDefaultValue(), this.getValue())
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
