<template>
  <div class="qti-outcome-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/**
 * Outcome variables are declared by outcome declarations. Their value is set either from a default given in the declaration itself or
 * by a responseRule during responseProcessing. Items that declare a numeric outcome variable representing the candidate's overall
 * performance on the item should use the outcome name 'SCORE' for the variable. SCORE needs to be a float. Items that declare a maximum
 * score (in multiple response choice interactions, for example) should do so by declaring the * 'MAXSCORE' variable. MAXSCORE needs
 * to be a float. Items or tests that want to make the fact that the candidate scored above a predefined treshold available as a variable
 * should use the 'PASSED' variable. PASSED needs to be a boolean. At runtime, outcome variables are instantiated as part of an item
 * session. Their values may be initialized with a default value and/or set during responseProcessing. If no default value is given in
 * the declaration then the outcome variable is initialized to NULL unless the outcome is of a numeric type (integer or float) in which
 * case it is initialized to 0. Declared outcomes with numeric types should indicate their range of possible values using normalMaximum
 * and normalMinimum, especially if this range differs from [0,1].
 */
import { store } from '@/store/store'
import { teststore } from '@/store/teststore'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiOutcomeDeclaration',

  props: {
    identifier: {
      type: String,
      required: true
    },
    baseType: {
      type: String,
      // baseType not required on cardinality==record
      required: false
    },
    cardinality: {
      type: String,
      required: true
    },
    /**
     * The intended audience for an outcome variable can be set with the view attribute. 
     * If no view is specified the outcome is treated as relevant to all views. Complex 
     * items, such as adaptive items or complex templates, may declare outcomes that are 
     * of no interest to the candidate at all, but are merely used to hold intermediate 
     * values or other information useful during the item or test session. Such variables 
     * should be declared with a view of author (for item outcomes) or testConstructor 
     * (for test outcomes). Systems may exclude outcomes from result reports on the basis 
     * of their declared view if appropriate. Where more than one class of user should be 
     * able to view an outcome variable the view attribute should contain a comma 
     * delimited list.
     * 
     * A list from an enumerated value set of: 
     * { author | candidate | proctor | scorer | testConstructor | tutor }
     */
    view: {
      type:String,
      required: false,
      default: null
    },
    interpretation: {
      type: String,
      required: false,
      default: null
    },
    /**
     * An optional link (URI) to an extended interpretation of the outcome variable's value.
     */
    longInterpretation: {
      type: String,
      required: false,
      default: null
    },
    /**
     * The normalMaximum characteristic optionally defines the maximum magnitude of numeric 
     * outcome variables, it must be a positive value. If given, the outcome's value can be 
     * divided by normalMaximum and then truncated (if necessary) to obtain a normalized 
     * score in the range [-1.0,1.0]. normalMaximum has no affect on responseProcessing or 
     * the values that the outcome variable itself can take.
     */
    normalMaximum: {
      type: String,
      required: false
    },
    /**
     * The normalMinimum characteristic optionally defines the minimum value of numeric outcome 
     * variables, it may be negative.
     */
    normalMinimum: {
      type: String,
      required: false
    },
    /** 
     * The masteryValue characteristic optionally defines a value for numeric outcome variables 
     * above which the aspect being measured is considered to have been mastered by the 
     * candidate.
     */
    masteryValue: {
      type: String,
      required: false
    },
    /**
     * This identifies whether or not the value for this outcome is produced by human or by 
     * machine scoring.
     * Enumerated value set of: { externalMachine | human }
     */
    externalScored: {
      type: String,
      required: false,
      default: null
    },
    variableIdentifierRef: {
      type: String,
      required: false,
      default: null
    }
  },

  data () {
    return {
      value: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      /* [0-1] multiplicity */
      lookupTable: null,
      // internal validation status
      isQtiValid: true,
      // normalMaximum float value
      normalMaximumValue: null,
      // normalMinimum float value
      normalMinimumValue: null,
      // masteryValue float value
      masteryValueValue: null,
      // default declaration context: TEST or ITEM
      declarationContext: 'ITEM'
    }
  },

  methods: {

    getIdentifier () {
      return this.identifier
    },

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
      return this.baseType
    },

    getCardinality () {
      return this.cardinality
    },

    getNormalMaximumValue () {
      return this.normalMaximumValue
    },

    getNormalMinimumValue () {
      return this.normalMinimumValue
    },

    getMasteryValueValue () {
      return this.masteryValueValue
    },

    getDefaultValue () {
      return this.defaultValue
    },

    /*
     * Outcome declarations occur in items and tests
     */
    getDeclarationContext () {
      return this.declarationContext
    },

    /**
     * Utility method to reset value of this variable to default.
     */
    initializeValue () {
      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }
      // 2) if single cardinality and numeric baseType, set value to 0
      if ((this.getCardinality() === 'single') && qtiProcessing.isBaseTypeNumeric(this.getBaseType())) {
        this.setValue(new BigNumber(0).toNumber())
        return
      }
      // 3) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
  	 * Resets value of this variable to default.
  	 *
  	 * Per IMS QTI Test, Section and Item Information Model section "2.2.2.2 Outcome Variables", "At runtime,
  	 * outcome variables are instantiated as part of an item session.  Their values may be initialized
  	 * with a default value and/or set during responseProcessing. If no default value is given in the
  	 * declaration then the outcome variable is initialized to NULL unless the outcome is of a numeric
  	 * type (integer or float) in which case it is initialized to 0."
  	 */
    reset () {
      this.initializeValue()
      // Notify store of our value
      this.getStore().setOutcomeVariableValue({
          identifier: this.identifier,
          value: this.getValue()
        })
    },

    /**
     * @description Determine if we are declared inside of a 
     * QtiAssessmentTest or a QtiAssessmentItem.
     */
    computeDeclarationContext () {
      this.declarationContext =
            (this.$parent?.$parent?.$options?.name === 'QtiAssessmentTest')
              ? 'TEST' 
              : 'ITEM'
    },

    getStore () {
      return (this.declarationContext === 'TEST') ? teststore : store
    },

    /**
     * Validate the optional child nodes: 
     * [0-1] qti-default-value
     * [0-1] qti-match-table || qti-interpolation-table
     */
    validateChildren () {
      let hasDefaultValue = false
      let hasMatchTable = false
      let hasInterpolationTable = false

      if (!this.$slots.default) return

      this.$slots.default().forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only children permitted:
          //   qti-default-value
          //   qti-match-table || qti-interpolation-table
          if (slot.type.name === 'QtiDefaultValue') {
            if (!hasDefaultValue) {
              return hasDefaultValue = true
            }
            throw new QtiValidationException('Maximum of 1 qti-default-value element permitted')
          }

          if (slot.type.name === 'QtiMatchTable') {
            if (hasInterpolationTable) {
              throw new QtiValidationException('Maximum of 1 lookupTable permitted')
            }
            if (!hasMatchTable) {
              return hasMatchTable = true
            }
            throw new QtiValidationException('Maximum of 1 qti-match-table element permitted')
          }

          if (slot.type.name === 'QtiInterpolationTable') {
            if (hasMatchTable) {
              throw new QtiValidationException('Maximum of 1 lookupTable permitted')
            }
            if (!hasInterpolationTable) {
              return hasInterpolationTable = true
            }
            throw new QtiValidationException('Maximum of 1 qti-interpolation-table element permitted')
          }

          throw new QtiValidationException('Element must be one of qti-default-value, qti-match-table, qti-interpolation-table: "' + slot.type.name + '"')
        }
      })
    },

    /**
     * Iterate through the optional child nodes: 
     * [0-1] qti-default-value
     * [0-1] qti-match-table || qti-interpolation-table
     */
    processChildren () {
      const children = this.$.subTree.children[0].children
      
      children.forEach((node) => {
        if (node.component === null) return
        if (node.type.name === 'QtiDefaultValue') {
          return this.defaultValue = node.component.proxy.getValue()
        }

        if ((node.type.name === 'QtiMatchTable') || (node.type.name === 'QtiInterpolationTable')) {
          return this.lookupTable = node.component.proxy
        }

        throw new QtiValidationException('[' + this.$options.name + '][Unhandled Child Node]: "' + node.type.name + '"')
      })
    }

  },

  created () {
    try {
      // Compute our context: TEST or ITEM
      this.computeDeclarationContext()

      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)
      
      this.validateChildren()

      // Convert normalMinimum, normalMaximum, masteryValue to floats or null
      this.normalMaximumValue = qtiAttributeValidation.validateFloatAttribute('normal-maximum', this.normalMaximum, false, null)
      if (this.normalMaximumValue !== null) {
        if (this.normalMaximumValue <= 0) {
          throw new QtiValidationException('Outcome declaration "' + this.identifier + '" has invalid normal-maximum attribute value.  Must be a positive value.')
        }
      }

      this.normalMinimumValue = qtiAttributeValidation.validateFloatAttribute('normal-minimum', this.normalMinimum, false, null)
      this.masteryValueValue = qtiAttributeValidation.validateFloatAttribute('mastery-value', this.masteryValue, false, null)

      // A little extra validation for the SCORE and MAXSCORE variables - because SCORE 
      // is frequently improperly defined.
      if ((this.identifier === 'SCORE') || (this.identifier === 'MAXSCORE')) {
        if ((typeof this.baseType === 'undefined') || (this.baseType !== 'float')) {
          throw new QtiValidationException('Outcome declaration "' + this.identifier + '" has invalid base-type.  Must be base-type="float".')
        }
        if ((typeof this.cardinality === 'undefined') || (this.cardinality !== 'single')) {
          throw new QtiValidationException('Outcome declaration "' + this.identifier + '" has invalid cardinality.  Must be cardinality="single".')
        }
      }

      // Notify store or teststore of our initial model.  We need this Initial
      // definition before we can properly parse outcome variable references
      // in the rest of the test or item.
      this.getStore().defineOutcomeDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          view: this.view,
          interpretation: this.interpretation,
          longInterpretation: this.longInterpretation,
          normalMaximum: this.getNormalMaximumValue(),
          normalMinimum: this.getNormalMinimumValue(),
          masteryValue: this.getMasteryValueValue(),
          externalScored: this.externalScored,
          variableIdentifierRef: this.variableIdentifierRef,
          value: null,
          defaultValue: null,
          node: this
        })

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
        this.processChildren()

        this.initializeValue()

        const obj = {
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            view: this.view,
            interpretation: this.interpretation,
            longInterpretation: this.longInterpretation,
            normalMaximum: this.getNormalMaximumValue(),
            normalMinimum: this.getNormalMinimumValue(),
            masteryValue: this.getMasteryValueValue(),
            externalScored: this.externalScored,
            variableIdentifierRef: this.variableIdentifierRef,
            value: this.getValue(),
            defaultValue: this.defaultValue,
            lookupTable: this.lookupTable,
            lookupTableType: this.lookupTableType,
            node: this
          }

        // Notify store or teststore of our updated model.
        if (this.declarationContext === 'TEST')
          teststore.defineOutcomeDeclaration(obj)
        else
          store.defineOutcomeDeclaration(obj)

        console.log('[' + this.$options.name + '][' + this.identifier + '][' + this.declarationContext + '][DefaultValue]', this.defaultValue, '[lookupTable]', this.lookupTable)
        } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  }
}
</script>

<style>
div.qti-outcome-declaration {
  display:none;
}
</style>
