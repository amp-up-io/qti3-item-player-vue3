import BigNumber from 'bignumber.js'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import { RecordField } from '@/shared/helpers/RecordField'


/**
 * @description Qti Processing class
 *
 */
export default class QtiProcessing {

  QTI_RESPONSE_RULES () {
    return [
      'qti-response-processing-fragment',
      'qti-response-condition',
      'qti-set-outcome-value',
      'qti-lookup-outcome-value',
      'qti-get-outcome-value',
      'qti-exit-response'
      // TODO: handle include
    ]
  }

  QTI_TEMPLATE_RULES () {
    return [
      'qti-set-template-value',
      'qti-exit-template',
      'qti-template-condition',
      'qti-set-default-value',
      'qti-set-correct-response',
      'qti-template-constraint'
    ]
  }

  QTI_EXPRESSIONS () {
    return [
      'qti-base-value',
      'qti-variable',
      'qti-correct',
      'qti-default',
      'qti-is-null',
      'qti-null',
      'qti-and',
      'qti-or',
      'qti-not',
      'qti-match',
      'qti-map-response',
      'qti-member',
      'qti-subtract',
      'qti-sum',
      'qti-random',
      'qti-random-float',
      'qti-random-integer',
      'qti-index',
      'qti-integer-divide',
      'qti-integer-modulus',
      'qti-integer-to-float',
      'qti-equal',
      'qti-equal-rounded',
      'qti-field-value',
      'qti-multiple',
      'qti-ordered',
      'qti-map-response-point',
      'qti-product',
      'qti-delete',
      'qti-string-match',
      'qti-pattern-match',
      'qti-substring',
      'qti-round',
      'qti-round-to',
      'qti-truncate',
      'qti-divide',
      'qti-gt',
      'qti-gte',
      'qti-lt',
      'qti-lte',
      'qti-max',
      'qti-min',
      'qti-custom-operator',
      'qti-math-operator',
      'qti-math-constant',
      'qti-repeat',
      'qti-gcd',
      'qti-lcm',
      'qti-stats-operator',
      'qti-power',
      'qti-any-n'
    ]
  }

  /**
   * @constructor QtiProcessing
   */
  constructor () {
  }

  isExpressionNode (nodeName) {
    return (this.QTI_EXPRESSIONS().includes(nodeName))
  }

  isResponseRuleNode (nodeName) {
    return (this.QTI_RESPONSE_RULES().includes(nodeName))
  }

  isTemplateRuleNode (nodeName) {
    return (this.QTI_TEMPLATE_RULES().includes(nodeName))
  }

  nullValue () {
    return null
  }

  isNullValue (v) {
    return ((typeof v === 'undefined') || (v === null))
  }

  isBaseTypeNumeric (baseType) {
    return ((baseType === 'float') || (baseType === 'integer'))
  }

  isSingleValuesMatch (baseType, firstValue, secondValue) {
    if (this.isBaseTypeNumeric(baseType)) {
      let firstNumber = new BigNumber(firstValue)
      let secondNumber = new BigNumber(secondValue)
      return (firstNumber.comparedTo(secondNumber) == 0)
    }
    return (firstValue === secondValue)
  }

  isMultipleValuesMatch (baseType, firstValue, secondValue) {
    // derived from stackoverflow issue: https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
    if (!Array.isArray(firstValue) || !Array.isArray(secondValue) || firstValue.length !== secondValue.length) {
      return false
    }

    // .concat() to not mutate arguments
    const arr1 = firstValue.concat().sort()
    const arr2 = secondValue.concat().sort()

    if (!this.isBaseTypeNumeric(baseType)) {
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false
        }
      }
    } else {
      // numeric ... so we need to be more precise
      for (let i = 0; i < arr1.length; i++) {
        if (!this.isSingleValuesMatch(baseType, arr1[i], arr2[i])) {
          return false
        }
      }
    }
    return true
  }

  isOrderedValuesMatch (baseType, arr1, arr2) {
    // derived from stackoverflow issue: https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
    if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
      return false
    }

    if (!this.isBaseTypeNumeric(baseType)) {
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false
        }
      }
    } else {
      // numeric ... so we need to be more precise
      for (let i = 0; i < arr1.length; i++) {
        if (!this.isSingleValuesMatch(baseType, arr1[i], arr2[i])) {
          return false
        }
      }
    }
    return true
  }

  mapResponse (declaration) {
    if (this.isNullValue(declaration.value)) {
      return declaration.mapping.getDefaultValue()
    }

    const mapping = declaration.mapping.getValue()
    const len = mapping.length

    if (declaration.cardinality === 'single') {

      // Coerce source numeric to string
      let sourceValue = (this.isBaseTypeNumeric(declaration.baseType) ? new BigNumber(declaration.value).toString() : declaration.value)

      for (let i = 0; i < len; i++) {
        const mapEntry = mapping[i]
        if (this.isSingleValuesMatch(
          'string',
          (mapEntry.caseSensitive ? mapEntry.mapKey : mapEntry.mapKey.toLowerCase()),
          (mapEntry.caseSensitive ? sourceValue : sourceValue.toLowerCase()))) {
          // Apply mapping constraints to our mappedValue and bail.
          return declaration.mapping.applyConstraints(new BigNumber(mapEntry.mappedValue))
        }
      }

    } else if ((declaration.cardinality === 'multiple') || (declaration.cardinality === 'ordered')) {
      // Init a running total
      let sum = new BigNumber(0)
      let containerValues = declaration.value

      // Coerce source numerics to strings
      if (this.isBaseTypeNumeric(declaration.baseType)) {
        for (let i = 0; i < containerValues.length; i++) {
          if (containerValues[i] !== null) {
            containerValues[i] = new BigNumber(containerValues[i]).toString()
          }
        }
      }

      // If a container contains multiple instances of the same value then that value is counted once only.
      // Remove duplicate values.
      containerValues = this.mappingEliminateNullsAndDuplicates(containerValues)

      // Iterate through the keys and the containerValues.
      // When we find a match, augment running total with the associated mappedValue.
      for (let i = 0; i < len; i++) {
        const mapEntry = mapping[i]
        for (let j = 0; j < containerValues.length; j++) {
          if (this.isSingleValuesMatch(
            'string',
            (mapEntry.caseSensitive ? mapEntry.mapKey : mapEntry.mapKey.toLowerCase()),
            (mapEntry.caseSensitive ? containerValues[j] : containerValues[j].toLowerCase()))) {
            sum = sum.plus(mapEntry.mappedValue)
          }
        }
      }
      // Apply mapping constraints to our final sum
      return declaration.mapping.applyConstraints(sum)
    } // end cardinality=multiple

    // No key matches, bail with defaultValue
    return declaration.mapping.getDefaultValue()
  } // end mapResponseValues

  mappingEliminateNullsAndDuplicates (arr) {
    let len = arr.length
    let result = []
    let obj = {}

    for (let i = 0; i < len; i++) {
      if (arr[i] !== null) {
        obj[arr[i]] = 0
      }
    }
    for (let o in obj) {
      result.push(o)
    }
    return result
  }

  mapValueFromLookupTable (declaration, value) {
    if (this.isNullValue(declaration.lookupTable)) {
      return this.nullValue()
    }
    if (this.isNullValue(value)) {
      return declaration.lookupTable.getDefaultValue()
    }

    const lookupTable = declaration.lookupTable.getValue()
    const lookupTableType = declaration.lookupTable.getTableType()
    // Set up our incoming value to be a BigNumber
    value = new BigNumber(value)

    if (lookupTableType === 'interpolation') {
      // sort ascending by sourceValue
      lookupTable.sort(function (a, b) {
        return a.sourceValue - b.sourceValue
      })

      for (let i = 0; i < lookupTable.length; i++) {
        let entry = lookupTable[i]
        const sourceValue = new BigNumber(entry.sourceValue)
        if ((value.comparedTo(sourceValue) < 0) || (entry.includeBoundary && (value.comparedTo(sourceValue) === 0))) {
          return entry.targetValue
        }
      }
    } else if (lookupTableType === 'match') {
      value = new BigNumber(value)
      for (let i = 0; i < lookupTable.length; i++) {
        let entry = lookupTable[i]
        const sourceValue = new BigNumber(entry.sourceValue)
        if (value.comparedTo(sourceValue) === 0) {
          return entry.targetValue
        }
      }
    }

    // No table matches, bail with defaultValue - which may be null
    return declaration.lookupTable.getDefaultValue()
  }

  /**
   * @description Randomize array in-place using Durstenfeld shuffle algorithm
   * Algorithm runtime is O(n).
   * Note that the shuffle is done in-place so if you don't want to modify the original array,
   * first make a copy of it with .slice(0).
   */
  shuffleArray (array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))
      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  /**
   * @description Randomize array in-place using Durstenfeld shuffle algorithm with Fixed elements
   * Algorithm runtime is O(n).
   * Note that the shuffle is done in-place so if you don't want to modify the original array,
   * first make a copy of it with .slice(0).
   */
  shuffleArrayFixed (array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))

      // skip shuffling of fixed elements
      // requires array elements to be objects with a fixed attribute.
      if (array[i].fixed || array[j].fixed) {
        continue
      }

      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  generalizedLcm (arrLength, arr) {
    let value = arr[0]

    for (let i = 1; i < arrLength; i++) {
      // If any value is 0, the result is 0
      if ((value === 0) || (arr[i] === 0)) {
        return 0
      }
      value = this.lcm(value, arr[i])
    }

    return value
  }

  lcm (a, b) {
    return (new BigNumber(a).multipliedBy(b).dividedBy(this.gcd(a, b)).toNumber())
  }

  generalizedGcd (arrLength, arr) {
    let value = arr[0]

    for (let i = 1; i < arrLength; i++) {
      value = this.gcd(value, arr[i])
    }

    return value
  }

  gcd (a, b) {
    b = new BigNumber(b)
    if (b.isZero()) {
      return a
    }

    return this.gcd(b.toNumber(), new BigNumber(a).modulo(b).toNumber())
  }

  getParametersFromDefinition (definition) {
    let params = new Map()

    if (typeof definition === 'undefined') return params
    definition = definition.trim()
    if (definition.length === 0) return params

    // Each key value pair is delimited by  a triple bar
    let pairs = definition.split('|||')

    for (let i = 0; i < pairs.length; i++) {
      // Each key is separated from its value by an "="
      const pair = pairs[i].split('=')
      // If there are inner key value pairs then they are separated by &equals; entity
      params.set(pair[0], (pair.length < 2) ? '' : pair[1].replaceAll('&equals;', '='))
    }

    return params
  }

  /**
   * @description Calculate the number of words in a string.
   * @param {String} s
   * @return {Integer} words
   */
  computeWordCount (s) {
    // Match on any sequence of non-whitespace characters
    const words = s.match(/\S+/g)
    return (words === null) ? 0 : words.length
  }

  /**
   * @description Convert a variable value to a PCI json representation.
   *              The json definition may be found at
   *              https://www.imsglobal.org/spec/qti/v3p0/impl#h.1mc9puik2ft6
   * @param {*} value 
   * @param {*} baseType 
   * @param {*} cardinality 
   * @returns 
   */
  valueToPciJson (value, baseType, cardinality) {
    if (value === null) {
      return { "base": null }
    }

    if (cardinality === 'single') {
      return { "base": this.baseValueToPciJson(value, baseType) }
    }

    if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
      return { "list": this.baseValueToPciJson(value, baseType) }
    }

    if (cardinality === 'record') {
      return { "record": this.recordValueToPciJson(value) }
    }
    
    // How did we get here?  Return null.
    return { "base": null }
  }

  /**
   * @description Builds a PCI-compliant object representation
   *              of a value according to its baseType.
   * @param {*} value
   * @param {String} baseType
   * @returns {Object} { "<baseType>": value }
   */
  baseValueToPciJson (value, baseType) {
    let result = {}
    switch (baseType) {
      case 'string':
      case 'identifier':
      case 'integer':
      case 'float':
      case 'duration':
      case 'boolean':
      case 'point':
      case 'directedPair':
      case 'pair':
      case 'uri':
        result[baseType] = value
        return result

      case 'intOrIdentifier':
      case 'file':
        // These are unsupported in QTI 3 Player as of 3/9/2023
        result[baseType] = null
        return result

      default:
        // What else is there?
        result[baseType] = null
        return result
    }
  }

  /**
   * @description Builds a PCI "Record" Json representation of the value.
   * @param {Map} value - Map of record field value objects in the record.
   * @returns {Array} [
   *   { name: "fieldIdentifier1", base: { fieldIdentifier1_baseValue } }, 
   *   { name: "fieldIdentifier2", base: { fieldIdentifier2_baseValue } },
   *   ...
   * ]
   */
  recordValueToPciJson (value) {
    let result = []

    for (let fieldValue of value.values()) {
      result.push({
        "name": fieldValue.fieldIdentifier, 
        "base": (fieldValue.value === null 
            ? null 
            : this.valueToPciJson(fieldValue.value, fieldValue.baseType, fieldValue.cardinality))        
      })
    }

    return result
  }

  /**
   * Transform an interaction's response into a proper QTI response
   * @param {Object} interaction 
   * @returns response - a proper QTI response
   */
  processInteractionResponse (interaction, responseVariable) {
    return (interaction.interactionType === 'PortableCustom')
              ? this.getValueFromPciJson(interaction.node.getResponse(), responseVariable)
              : interaction.node.getResponse()
  }

  /**
   * @description Convert a PCI-compliant json value to a native QTI value.
   * 
   * @param {Object} value - A PCI Type Definition-compliant value that follows 
   * the PCI Type Definition Specification 
   * https://www.imsglobal.org/spec/pci/v1p0#baseTypes
   * 
   * @param {Object} variable - A Response Variable definition which 
   * follows the following schema, which includes baseType, cardinality,
   * and defaultValue definitions.  In the case of a record, baseType 
   * will be null, and the value + defaultValue will be a Map of field 
   * definitions.
   * 
   * {
   *   identifier: 'RESPONSE',
   *   baseType: 'float',
   *   cardinality: 'single',
   *   value: 0,
   *   defaultValue: 0
   * }
   * 
   * @returns Native QTI value
   */
  getValueFromPciJson (value, variable) {
    console.log('[GetValueFromPciJson][Value]',value, variable)
    if ((value === null) || (typeof variable === 'undefined')) return this.nullValue()

    try {
      // Must be an Object.
      if (typeof value !== 'object') {
        throw new QtiEvaluationException(`Improper value encoding.  Must be an Object.`)
      }

      // In JavaScript, Arrays are also Objects.  Make sure it's not an Array.
      if (Array.isArray(value)) {
        throw new QtiEvaluationException(`Improper value encoding.  Found Array.  Must be an Object.`)
      }

      // It's a proper Object.  Transform it.
      if (value['base'] !== undefined) {
        if (variable.cardinality === 'single') {
          // It's a single cardinality primitive
          return this.baseValueFromPciJson(value.base, variable.baseType)
        }
        throw new QtiEvaluationException(`Inconsistent value cardinality [base] for this variable.  Variable must be single cardinality.`)
      }

      if (value['list'] !== undefined) {
        // Variable must be multiple or ordered
        if ((variable.cardinality === 'multiple') || (variable.cardinality === 'ordered')) {
          return this.baseValueFromPciJson(value.list, variable.baseType)
        }
        throw new QtiEvaluationException(`Inconsistent value cardinality [list] for this variable.  Variable must be multiple or ordered cardinality.`)
      }

      if (value['record'] !== undefined) {
        if (variable.cardinality === 'record') {
          return this.recordValueFromPciJson(value.record, variable)
        }
        throw new QtiEvaluationException(`Inconsistent value cardinality [record] for this variable.  Variable must be record cardinality.`)
      }
    
      throw new QtiEvaluationException(`Improper value encoding.  Must be one of "base", "list", "record".`)
    } catch ({ name, message }) {
      console.log('[PciDecodingException][ValueFromJson] ', message)
      return this.nullValue()
    }
  }

  baseValueFromPciJson (value, baseType) {
    if (value === null) return this.nullValue()

    try {
      // Must be an Object.
      if (typeof value !== 'object') {
        throw new QtiEvaluationException(`Invalid value. Must be an Object.`)
      }

      // In JavaScript, Arrays are also Objects.  Make sure it's not an Array.
      if (Array.isArray(value)) {
        throw new QtiEvaluationException(`Invalid value. Found Array. Must be an Object.`)
      }

      if (value[baseType] !== undefined) return value[baseType]

      throw new QtiEvaluationException(`Value does not have the required base-type. Expecting ${baseType}.`)
    
    } catch ({ name, message }) {
      console.log('[PciDecodingException][BaseValueFromJson] ', message, value)
      return this.nullValue()
    }
  }
  
  recordValueFromPciJson (value, variable) {
    try {
      // Try to get the variable's field definition.
      let recordFieldMap = this.getRecordVariableFieldDefinition(variable)

      // if recordFieldMap is not found, what should we do?
      if (recordFieldMap === null) {
        throw new QtiEvaluationException(`Unable to retrieve ${variable.identifier} record field definition.`)
      }

      if (typeof value !== 'object') {
        throw new QtiEvaluationException(`Improper record value encoding.  Must be an Array.`)
      }
  
      if (!Array.isArray(value)) {
        throw new QtiEvaluationException(`Improper record value encoding.  Must be an Array.`)
      }

      const valueMap = new Map()

      for (let [fieldIdentifier, fieldDefinition] of recordFieldMap) {
        // Loop through all elements of the JSON record array.
        for (let i=0; i<value.length; i++) {
          if ((value[i].name !== undefined) && (value[i].base !== undefined)) {
            // 
            if (value[i].name === fieldIdentifier) {
              const fieldValue = this.baseValueFromPciJson(value[i].base, fieldDefinition.getBaseType())
              const recordField = new RecordField(fieldIdentifier, fieldDefinition.getBaseType(), fieldValue)
              valueMap.set(fieldIdentifier, recordField)
              break
            }
          }
        }
      }

      return valueMap

    } catch ({ name, message }) {
      console.log('[VariableDecodingException][RecordValueFromJson] ', message)
      return new Map()
    }
  }

  getRecordVariableFieldDefinition (variable) {
    if (variable == null) return null
    // Check defaultValue first
    if (variable.defaultValue !== null) return variable.defaultValue
    // Must be in correctResponse
    return variable.correctResponse    
  }

}
