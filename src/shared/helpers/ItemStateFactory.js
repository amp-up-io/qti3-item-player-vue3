import { RecordField } from '@/shared/helpers/RecordField'

export class ItemStateFactory {

  constructor(identifier, store) {
    // Sometimes we just use a raw constructor in order
    // to get access to this class's methods.
    if (typeof identifier === 'undefined') return this

    this.identifier = identifier
    this.guid = store.getItemContextGuid()
    this.contextVariables = store.getContextDeclarations()
    this.responseVariables = store.getResponseDeclarations()
    this.templateVariables = store.getTemplateDeclarations()
    this.outcomeVariables = store.getOutcomeDeclarations()
    this.validationMessages = store.getItemContextValidationMessages()
    return this
  }

  createStateFromState (state) {
    this.identifier = state.identifier
    this.guid = state.guid
    this.contextVariables = state.contextVariables
    this.responseVariables = state.responseVariables
    this.templateVariables = state.templateVariables
    this.outcomeVariables = state.outcomeVariables
    this.validationMessages = state.validationMessages

    return this.getSerializedState()
  }

  getSerializedState () {
    let state = {
      identifier: this.identifier,
      guid: this.guid,
      contextVariables: this.serializeVariables(this.contextVariables),
      responseVariables: this.serializeResponseVariables(this.responseVariables),
      outcomeVariables: this.serializeOutcomeVariables(this.outcomeVariables),
      templateVariables: this.serializeVariables(this.templateVariables),
      validationMessages: this.serializeValidationMessages(this.validationMessages)
    }

    return state
  }

  serializeResponseVariables (responseVariables) {
    let variableArray = []
    responseVariables.forEach((responseVariable) => {
      let obj = {
        identifier: responseVariable.identifier,
        cardinality: responseVariable.cardinality,
        baseType: this.resolveBaseType(responseVariable.baseType),
        value: this.serializeVariableValue(responseVariable.cardinality, responseVariable.value),
        state: this.serializeVariableState(responseVariable.state)
      }

      // Only a Response Variable may have an optional correct response
      if ('correctResponse' in responseVariable) {
        obj.correctResponse = this.serializeVariableValue(responseVariable.cardinality, responseVariable.correctResponse)
      }

      variableArray.push(obj)
    })

    return variableArray
  }

  serializeOutcomeVariables (outcomeVariables) {
    let variableArray = []
    outcomeVariables.forEach((outcomeVariable) => {
      variableArray.push({
        identifier: outcomeVariable.identifier,
        cardinality: outcomeVariable.cardinality,
        baseType: this.resolveBaseType(outcomeVariable.baseType),
        value: this.serializeVariableValue(outcomeVariable.cardinality, outcomeVariable.value),
        view: outcomeVariable.view,
        interpretation: outcomeVariable.interpretation,
        longInterpretation: outcomeVariable.longInterpretation,
        normalMaximum: outcomeVariable.normalMaximum,
        normalMinimum: outcomeVariable.normalMinimum,
        masteryValue: outcomeVariable.masteryValue,
        externalScored: outcomeVariable.externalScored,
        variableIdentifierRef: outcomeVariable.variableIdentifierRef    
      })
    })

    return variableArray
  }

  serializeVariables (variables) {
    let variableArray = []
    variables.forEach((variable) => {
      variableArray.push({
        identifier: variable.identifier,
        cardinality: variable.cardinality,
        baseType: this.resolveBaseType(variable.baseType),
        value: this.serializeVariableValue(variable.cardinality, variable.value)
      })
    })

    return variableArray
  }

  serializeValidationMessages (messages) {
    let messageArray = []
    messages.forEach((message) => {
      messageArray.push({
        identifier: message.identifier,
        message: message.message
      })
    })

    return messageArray
  }

  serializeVariableValue (cardinality, value) {
    if (cardinality !== 'record') return JSON.parse(JSON.stringify(value))

    // Records are Map's - special handling.
    return this.serializeRecordVariableValue(value)
  }

  serializeVariableState (state) {
    return JSON.parse(JSON.stringify(state))
  }

  resolveBaseType (baseType) {
    return (typeof baseType === 'undefined') ? null : baseType
  }

  /**
   * @description Special handling of variables with Record cardinality.
   * @param {Map} value - a raw Record value; i.e., null or a Map of RecordField's
   */
  serializeRecordVariableValue (value) {
    // Bail if the Record value is null; i.e., no fields.
    if (value === null) return null
    return this.objToStrMap(this.transformRecordFields(value))
  }

  /**
   * @description Takes a Record (a Map including all fields) and transforms the 
   * RecordFields into Objects that include 'baseType' and 'value'.  In prior
   * versions of the Player, a Record's RecordField's were stripped away, leaving only
   * the field's value.  This (the absence of a baseType) resulted in problems 
   * when restoring the Record's state.
   * 
   * @param {Map} recordMap - this should be a structure like:
   *   Map (
   *     fieldIdentifier1 => RecordField,
   *     fieldIdentifier2 => RecordField
   *   )
   * 
   * @returns {Object}
   *   {
   *     fieldIdentifier1: { baseType => string, float, etc, value => 'foo', 3.14165, etc},
   *     fieldIdentifier2: { baseType => <a baseType>, value => <a value> }
   *   }
   */
  transformRecordFields (recordMap) {
    let obj = Object.create(null)
    for (let [k,v] of recordMap) {
      if (v instanceof RecordField) {
        if (v === null) { // Shouldn't happen
          obj[k] = v
          continue
        }

        // Create a new Object of the RecordField that
        // includes just the baseType and value.
        obj[k] = {
          baseType: v.getBaseType(),
          value: v.getValue()
        }
        continue
      }

      // If the value is somehow NOT a RecordField, 
      // set the key (a fieldIdentifier) to null.
      obj[k] = v
    }
    return obj
  }

  objToStrMap (obj) {
    let strMap = new Map()
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k])
    }
    return strMap
  }

}
