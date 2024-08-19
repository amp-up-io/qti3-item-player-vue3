<template>
  <div class="qti-test-variables">
  </div>
</template>

<script>
/*
 * This expression, which can only be used in outcomes processing, simultaneously looks up the value 
 * of an item variable in a sub-set of the items referred to in a test. Only variables with single 
 * cardinality are considered, all NULL values are ignored. The result has cardinality multiple and 
 * base-type as specified below.
 */
import { teststore } from '@/store/teststore'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTestVariables',

  props: {
    /*
     * [0-1] multiplicity
     * If specified, only variables from items in the qti-assessment-section with matching 
     * identifier are matched. Items in sub-sections are included in this definition.
     */
    sectionIdentifier: {
      type: String,
      required: false,
      default: null
    },
    /*
     * [0-1] multiplicity
     * If specified, only variables from items with a matching category are included.
     */
    includeCategory: {
      type: String,
      required: false,
      default: null
    },
    /*
     * [0-1] multiplicity
     * If specified, only variables from items with no matching category are included.
     */
    excludeCategory: {
      type: String,
      required: false,
      default: null
    },
    /*
     * [1] multiplicity
     * The identifier of the variable to look up in each item. If a test brings together 
     * items with different variable naming conventions variable mappings may be used to 
     * reduce the complexity of outcomes processing and allow a single test variables 
     * expression to be used. Items with no matching variable are ignored.
     */
    variableIdentifier: {
      type: String,
      required: true
    },
    /*
     * [0-1] multiplicity
     * If specified, the defined weight is applied to each variable as described in the 
     * definition of weight-identifier for a single variable. The behaviour of this 
     * characterisic is only defined if the base-type attribute is float or omitted . 
     * When a weighting is specified the result of the expression always has base-type 
     * float. Note that this option is incomptable with base-type integer. This restriction 
     * ensures that the value of the base-type attribute remains consistent with the 
     * resulting container type.
     */
    weightIdentifier: {
      type: String,
      required: false,
      default: null
    },
    /*
     * [0-1] multiplicity
     * If specified, matches only variables declared with this base-type. This also becomes 
     * the base-type of the result (subject to type promotion through weighting, as described below). 
     * If omitted, variables declared with base-type integer or float are matched. The base-type of 
     * the result is integer if all matching values have base-type integer, otherwise it is float 
     * and integer values are subject to type promotion.
     */
    baseType: {
      type: String,
      required: false,
      default: null
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'multiple',
      includeCategoryValue: null,
      excludeCategoryValue: null,
      variableItemIdentifierValue: null,
      variableIdentifierValue: null,
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
      return qtiProcessing.isNullValue(this.value)
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

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },   

    processIncludeCategoryAttribute () {
      if (this.includeCategory === null) return null
      const category = this.includeCategory.trim()
      if (category.length === 0) return null
      return category
    },

    processExcludeCategoryAttribute () {
      if (this.excludeCategory === null) return null
      const category = this.excludeCategory.trim()
      if (category.length === 0) return null
      return category
    },

    processVariableIdentifierAttribute () {
      const identifier = this.variableIdentifier.trim()
      if (identifier.length === 0) {
        throw new QtiValidationException('"variable-identifier" attribute must be a valid identifier value')
      }

      const parts = identifier.split('.')
      if (parts.length === 1) {
        // TODO: proper identifier validation
        return this.variableIdentifierValue = parts[0]
      }

      if (parts.length === 2) {
        // TODO: proper identifier validation of each part
        this.variableItemIdentifierValue = parts[0]
        return this.variableIdentifierValue = parts[1]
      }

      throw new QtiValidationException('"variable-identifier" attribute contains an illegal identifier value')
    },

    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    /**
     * @description Retrieve all possible variable values, filtered by Section Identifier,
     * Include Category, Exclude Category, Item Identifier, Item Variable Identifier,
     * and baseType.
     * 
     * @param {String} sectionIdentifier - section identifier or null
     * @param {String} includeCategory - include category or null
     * @param {String} excludeCategory - exclude category or null
     * @param {String} itemIdentifier - item identifier (e.g., "ITEM1234" from "ITEM1234.SCORE") or null
     * @param {String} itemVariableIdentifier - an item variable identifier (e.g., "SCORE").
     * @return {Array} - array of variable values for all sections or for a specific section
     */
    getAllSectionVariableValuesByFilter(
        sectionIdentifier,
        includeCategory, 
        excludeCategory,
        itemIdentifier, 
        itemVariableIdentifier) {

      // A null sectionIdentifier indicates we want all sections
      if (sectionIdentifier === null) {
        const result = []

        // Loop through all parts and their immediate nested sections
        teststore.getTestParts().forEach((testPart) => {
          testPart.getSections().forEach((section) => {
            // Get values for this section
            let values = 
                  this.getSectionVariableValuesByFilter(
                          section.getIdentifier(),
                          includeCategory,
                          excludeCategory,
                          itemIdentifier,
                          itemVariableIdentifier)

            // Add values to the result
            values.forEach((value) => result.push(value))
          })
        })

        return result
      }
      
      // sectionIdentifier is specified
      return this.getSectionVariableValuesByFilter(
                    sectionIdentifier,
                    includeCategory,
                    excludeCategory,
                    itemIdentifier,
                    itemVariableIdentifier)
    },

    /**
     * @description Retrieve all possible variable values, filtered by Section Identifier,
     * Include Category, and Exclude Category.
     * 
     * @param {String} sectionIdentifier - section identifier or null
     * @param {String} includeCategory - include category or null
     * @param {String} excludeCategory - exclude category or null
     * @param {String} itemIdentifier - item identifier (e.g., "ITEM1234" from "ITEM1234.SCORE") or null
     * @param {String} itemVariableIdentifier - an item variable identifier (e.g., "SCORE").
     * @return {Array} array of variable values for the given sectionIdentifier
     */
    getSectionVariableValuesByFilter(
        sectionIdentifier,
        includeCategory,
        excludeCategory,
        itemIdentifier,
        itemVariableIdentifier) {

      const result = []

      if (sectionIdentifier === null) return result

      // Section identifier specified.  Scan only item states from the specified section.
      const section = this.findSectionByIdentifier(sectionIdentifier)
      const sectionItemState = teststore.getPartSectionMapBySectionIdentifier(sectionIdentifier)

      if (section === null) return result
      if (sectionItemState === null) return result

      return this.findSectionItemVariableValues(
                    section,
                    sectionItemState,
                    includeCategory,
                    excludeCategory,
                    itemIdentifier,
                    itemVariableIdentifier)
    },

    /**
     * @description Loop through all TestPart's, searching for a Section
     * with the provided identifier.
     * @param {*} sectionIdentifier - identifier of the section
     * @returns {Node} - a section node or null
     */
    findSectionByIdentifier (sectionIdentifier) {
      let foundSection = null

      teststore.getTestParts().forEach((testPart) => {
        testPart.getSections().forEach((section) => {
          if (section.getIdentifier() === sectionIdentifier) {
            foundSection = section
          }
        })
      })

      return foundSection
    },

    /**
     * @description For the given section node, examine each selected item for the 
     * given category.  Return an array of matching item nodes.
     * @param {Node} section - section node
     * @param {String} category - category to search for on each item node
     * @return {Array} array of item nodes with the provided category
     */
    findSectionItemsByCategory (section, category) {
      // Initialize an empty array
      const items = []

      if (section === null) return items

      // If no category, just return all items in the section.
      if (category === null) {
        for (let item of section.getSectionItemsMap().values()) { 
          items.push(item)  
        }
        return items
      }

      // Loop through the sectionItemsMap
      for (let item of section.getSectionItemsMap().values()) {

        // Move on if the item has no category attribute
        if (item.getCategory() === null) continue

        // The item has a category attribute
        const categoryTokens = item.getCategory().split(' ')
        for (let index = 0; index < categoryTokens.length; index++) {
          if (categoryTokens[index] === category) {
            // We have a hit!
            items.push(item)
            break
          }
        }
      }
      return items
    },

    /**
     * @description Retrieve all item variable values from a section item state, filtered
     * by section, includeCategory, excludeCategory, and variableIdentifier.
     * 
     * @param {Node} section - section node
     * @param {Map} sectionItemState - Map of all current item states for this section
     * @param {String} includeCategory - include category or null
     * @param {String} excludeCategory - exclude category or null
     * @param {String} itemIdentifier - item identifier (e.g., "ITEM1234" from "ITEM1234.SCORE") or null
     * @param {String} itemVariableIdentifier - an item variable identifier (e.g., "SCORE").
     * @return {Array} - array of variable values
     */
    findSectionItemVariableValues (
        section,
        sectionItemState, 
        includeCategory, 
        excludeCategory,
        itemIdentifier,
        itemVariableIdentifier) {
      let values = []

      if (section === null) return values
        
      //
      // We have a specific section.  Get a handle on the section's items.
      // If includeCategory is null, this will return all of the section's items.
      // If includeCategory is not null, this will return only the items with
      // a matching category.
      //
      let sectionItems = this.findSectionItemsByCategory(section, includeCategory)

      // Remove any section items with the exclude category
      if (excludeCategory !== null) {
        const excludedSectionItems = this.findSectionItemsByCategory(section, excludeCategory)
        excludedSectionItems.forEach((excludedItem) => {
          let foundIndex = -1
          for (let i = 0; i<sectionItems.length; i++) {
            if (sectionItems[i].getIdentifier() === excludedItem.getIdentifier()) {
              foundIndex = i
              break
            }
          }

          // Delete the item if we found it.
          if (foundIndex > -1) {
            sectionItems.splice(foundIndex, 1)
          }
        })
      }

      sectionItems.forEach((item) => {
        
        // Looking for a specific item when the itemIdentifier param is not null. 
        // If the item's identifier doesn't match the itemIdentifier param, bail.
        if ((itemIdentifier !== null) && (itemIdentifier !== item.getIdentifier())) return

        const itemState = sectionItemState.get(item.getIdentifier())
        
        // No state.  Bail.
        if (typeof itemState === 'undefined') return

        // Found a state.  Look for the variable with the given identifier
        const variable = teststore.findItemVariableValueByIdentifier(itemState, itemVariableIdentifier)

        if (variable !== null) {

          // Last part of the filter is baseType.
          if (this.baseType === null) {

            // If baseType is null, add a value if the variable's baseType is integer or float.
            if ((variable.baseType === 'integer') || (variable.baseType === 'float')) {
              values.push({
                itemIdentifier: item.getIdentifier(),
                value: variable.value,
                baseType: variable.baseType,
                cardinality: variable.cardinality
              })
            }
            return
          }

          // baseType is not null. The variable's baseType must match the given baseType.
          if (this.baseType !== variable.baseType) return
            
          values.push({
            itemIdentifier: item.getIdentifier(),
            value: variable.value,
            baseType: variable.baseType,
            cardinality: variable.cardinality
          })

        } // end variable != null

      })

      return values
    },

    evaluate () {
      try {
        // Init to an empty array
        let results = []
        let isInteger = 
          ((this.baseType === null) || (this.baseType === 'integer')) 
            ? true 
            : false

        // Retrieve all possible variable values by Section Identifier,
        // Include Category, Exclude Category, Item Identifier, and 
        // Item Variable Identifier.
        let variableResults = 
          this.getAllSectionVariableValuesByFilter(
            this.sectionIdentifier, 
            this.includeCategoryValue,
            this.excludeCategoryValue,
            this.variableItemIdentifierValue,
            this.variableIdentifierValue)

        if (variableResults != null) {
          variableResults.forEach((result) => {
            // Null values are ignored, as are variables that are not single cardinality
            if ((result.value === null) || (result.cardinality !== 'single')) return

            if ((this.baseType === null) || (this.baseType === result.baseType))
              results.push(result.value)

            if (result.baseType !== 'integer')
              isInteger = false
          })
        }

        this.setValue(results)

        // If there are results, and all results are baseType integer, and 
        // baseType is not specified, override the default baseType from 
        // float to integer.
        if (isInteger && (this.baseType === null) && (results.length > 0)) {
          this.setBaseType('integer')
        }

        console.log('[TestVariables][Identifier=' 
          + this.variableIdentifier 
          + '][BaseType=' 
          + this.getBaseType()
          + '] value:', this.getValue())

        return this.getValue()
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

  },

  created () {
    try {
      // If baseType is specified, validate that it conforms to one of the standard base-types.
      // NOTE: The baseType attribute is NOT necessarily the baseType of this expression.
      // See description of the baseType attribute.
      if (this.baseType !== null) {
        qtiAttributeValidation.validateBaseType(this.baseType)
        this.valueBaseType = this.baseType
      } else {
        // For now, set this to float as it must be either integer or float.
        this.valueBaseType = 'float'
      }

      // According to the specification, this expression is always multiple cardinality
      this.valueCardinality = 'multiple'

      // Prepare include-category attribute
      this.includeCategoryValue = this.processIncludeCategoryAttribute()
      // Prepare exclude-category attribute
      this.excludeCategoryValue = this.processExcludeCategoryAttribute()
      // Prepare variable-identifier attribute
      this.processVariableIdentifierAttribute()
 
      // @TODO: handle weight-identifier

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
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
