import { RecordField } from '@/shared/helpers/RecordField'
import { PnpFactory } from '@/shared/helpers/PnpFactory'

export const teststore = {

  player: null,

  state: {
    test: null,
    identifier: '',
    title: '',
    /* duration is a built-in RD */
    responseDeclarations: [],
    /* [0..*] */
    contextDeclarations: [],
    /* [0..*] */
    outcomeDeclarations: [],
    /* [0..1] */
    timeLimit: null,
    /* [1..*] */
    testParts: [],
    /* [0..1] */
    outcomeProcessing: null,
    /* [0..*] */
    feedbacks: [],
    /* [0..*] */
    printedVariables: [],
    /* [0..*] */
    catalogs: [],
    /* [0..*] */
    scoringRubricBlocks: []
  },

  testContext: {
    guid: null,
    pnp: null
  },

  /*
   * Save/Restore a candidate's test item state here.
   * This is a Map of Maps.
   */
  sectionItemStates: new Map(),

  getTest () {
    return this.state.test
  },

  setTest (node) {
    this.state.test = node.test
  },

  getResponseDeclarations () {
    return this.state.responseDeclarations
  },

  getResponseDeclaration (identifier) {
    return this.state.responseDeclarations.find(rd => rd.identifier === identifier)
  },

  getOutcomeDeclarations () {
    return this.state.outcomeDeclarations
  },

  getOutcomeDeclaration (identifier) {
    return this.state.outcomeDeclarations.find(od => od.identifier === identifier)
  },

  getContextDeclarations () {
    return this.state.contextDeclarations
  },

  getContextDeclaration (identifier) {
    return this.state.contextDeclarations.find(cd => cd.identifier === identifier)
  },

  /**
   * @description Global search for a variable declaration.
   */
  getVariableDeclaration (identifier) {
    let declaration = this.state.outcomeDeclarations.find(od => od.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration

    declaration = this.state.contextDeclarations.find(cd => cd.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration
  
    declaration = this.state.responseDeclarations.find(rd => rd.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration
      
    return null
  },

  getTimeLimit () {
    return this.timeLimit;
  },

  getTestParts () {
    return this.state.testParts
  },

  getTestPart (identifier) {
    return this.state.testParts.find(p => p.identifier === identifier)
  },

  getOutcomeProcessing () {
    return this.state.outcomeProcessing
  },

  getFeedbacks () {
    return this.state.feedbacks
  },

  getPrintedVariables () {
    return this.state.printedVariables
  },

  getCatalog (id) {
    return this.state.catalogs.find(c => c.id === id)
  },

  getCatalogs () {
    return this.state.catalogs
  },

  getScoringRubricBlocks () {
    return this.state.scoringRubricBlocks
  },

  defineContextDeclaration (contextDeclaration) {
    let cdIndex = this.state.contextDeclarations.findIndex(cd => cd.identifier == contextDeclaration.identifier)

    if (cdIndex > -1) {
      // Found the context variable.
      this.state.contextDeclarations[cdIndex] = contextDeclaration
    } else {
      // New context variable.
      this.state.contextDeclarations.push(contextDeclaration)
    }
  },

  defineResponseDeclaration (responseDeclaration) {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == responseDeclaration.identifier)

    if (rdIndex > -1) {
      // Found the response variable. This is an error.  Update it for now.
      this.state.responseDeclarations[rdIndex] = responseDeclaration
    } else {
      // New response variable.
      this.state.responseDeclarations.push(responseDeclaration)
    }
  },

  defineOutcomeDeclaration (outcomeDeclaration) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == outcomeDeclaration.identifier)

    if (odIndex > -1) {
      // Found the outcome variable.
      this.state.outcomeDeclarations[odIndex] = outcomeDeclaration
    } else {
      // New outcome variable.
      this.state.outcomeDeclarations.push(outcomeDeclaration)
    }
  },

  defineTimeLimit (timeLimitNode) {
    this.state.timeLimit = timeLimitNode.node;
  },

  defineTestPart (node) {
    let partIndex = this.state.testParts.findIndex(p => p.identifier == node.identifier)

    if (partIndex < 0) {
        // New part
        this.state.testParts.push(node.testPart)
        return
    }

    // Found the part. Replace the old with the new
    this.state.testParts[partIndex] = node.testPart
  },

  defineProcessing (processingObject) {
    this.state.processing = processingObject
    console.log('[QtiOutcomeProcessing][Defined]', processingObject)
  },

  defineOutcomeProcessing (processingNode) {
    const processingObject = { processingType: 'outcome', node: processingNode.node }
    this.state.outcomeProcessing = processingObject
    console.log('[QtiOutcomeProcessing][Defined]', processingObject)
  },

  defineFeedback (feedback) {
    // New feedback element
    this.state.feedbacks.push(feedback)
    console.log('[DefineFeedback][' + feedback.outcomeIdentifier + '][' + feedback.identifier + ']')
  },

  definePrintedVariable (printedVariable) {
    this.state.printedVariables.push(printedVariable)
  },

  defineCatalog (catalog) {
    let catalogIndex = this.state.catalogs.findIndex(c => c.id == catalog.id)

    if (catalogIndex < 0) {
        // New catalog
        this.state.catalogs.push(catalog)
        return
    }

    // Found the catalog. Replace the old with the new
    this.state.catalogs[catalogIndex] = catalog
  },

  defineScoringRubricBlock (rubricBlock) {
    this.state.scoringRubricBlocks.push(rubricBlock)
  },

  resetAll () {
    this.state.test = null
    this.state.identifier = ''
    this.state.title = ''
    this.state.responseDeclarations.splice(0, this.state.responseDeclarations.length)
    this.state.outcomeDeclarations.splice(0, this.state.outcomeDeclarations.length)
    this.state.contextDeclarations.splice(0, this.state.contextDeclarations.length)
    this.state.timeLimit = null
    this.state.testParts.splice(0, this.state.testParts.length)
    this.state.outcomeProcessing = null
    this.state.feedbacks.splice(0, this.state.feedbacks.length)
    this.state.printedVariables.splice(0, this.state.printedVariables.length)
    this.state.catalogs.splice(0, this.state.catalogs.length)
    this.state.scoringRubricBlocks.splice(0, this.state.scoringRubricBlocks.length)
    // Reset testContext
    this.testContext.guid = null
    this.testContext.state = null
  },

  initializeBuiltInDeclarations () {
    // Function to stub out resetValue
    function reset() {
      return 0
    }

    const defaultValueMap = new Map()
    defaultValueMap.set('candidateIdentifier', new RecordField('candidateIdentifier', 'string', null))
    defaultValueMap.set('testIdentifier', new RecordField('testIdentifier', 'string', null))
    defaultValueMap.set('environmentIdentifier', new RecordField('environmentIdentifier', 'string', null))

    // QTI_CONTEXT is built-in QTI3 Context variable
    this.defineContextDeclaration({
      identifier: 'QTI_CONTEXT',
      baseType: null,
      cardinality: 'record',
      value: defaultValueMap,
      defaultValue: defaultValueMap
    })
    console.log('[QtiAssessmentTest][QTI_CONTEXT] initialized')

    // Test duration
    this.defineResponseDeclaration({
      identifier: 'duration',
      baseType: 'duration',
      cardinality: 'single',
      value: 0,
      resetValue: reset,
      defaultValue: 0,
      state: null
    })
    console.log('[QtiAssessmentTest][duration] initialized')
  },

  setOutcomeVariableValue (valueObject) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == valueObject.identifier)

    if (odIndex < 0) return

    // Found the outcome variable, update its value property
    this.state.outcomeDeclarations[odIndex].value = valueObject.value
  },

  resetOutcomeVariableValue (valueObject) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == valueObject.identifier)

    if (odIndex < 0) return

    // Found the outcome variable, reset its value property
    let declaration = this.state.outcomeDeclarations[odIndex]
    if (declaration.defaultValue !== null) {
      declaration.value = this.defaultValue
      return
    }

    // Record, multiple, ordered are set to null
    if ((declaration.cardinality === 'record') ||
        (declaration.cardinality === 'multiple') ||
        (declaration.cardinality === 'ordered')) {
      declaration.value = null
      return
    }

    // Single cardinality, set numeric (or duration?) to 0, else set to null
    if ((declaration.baseType === 'integer') ||
        (declaration.baseType === 'float')) {
      declaration.value = 0
      return
    }

    declaration.value = null
  },

  getTestContextGuid () {
    return this.testContext.guid
  },

  setTestContextGuid (guid) {
    this.testContext.guid = guid
  },

  initializeTestContextPnp () {
    this.testContext.pnp = new PnpFactory()
  },

  getTestContextPnp () {
    return this.testContext.pnp
  },

  setTestContextPnp (pnp) {
    // Should always be a PnpFactory in testContext, but check anyway.
    if (this.testContext.pnp === null) this.initializeTestContextPnp()
    this.testContext.pnp.setPnp(pnp)
  },

  getAllTestStateItemStatesMap () {
    // This is a map of maps - one map for each partSection 
    // identifier. Example: "partIdentifier~~sectionIdentifier"
    return this.sectionItemStates
  },

  setTestStateItemState (partIdentifier, sectionIdentifier, itemIdentifier, state) {
    console.log('[TestStore][SetState][Part:'
      + partIdentifier 
      + '][Section:' 
      + sectionIdentifier 
      + '][Item:'
      + itemIdentifier 
      + ']',state)

    const identifier = `${partIdentifier}~~${sectionIdentifier}`

    let sectionItemStateMap = this.getItemStateMapBySectionIdentifier(identifier)
    
    // Should never be null
    if (sectionItemStateMap != null) sectionItemStateMap.set(itemIdentifier, state)
  },

  getItemStateMapBySectionIdentifier (partSectionIdentifier) {
    if (this.sectionItemStates.has(partSectionIdentifier)) {
      return this.sectionItemStates.get(partSectionIdentifier)
    }

    return this.initializePartSectionItemStateMap(partSectionIdentifier)
  },

  getPartSectionMapBySectionIdentifier (sectionIdentifier) {
    for (let [k,v] of this.sectionItemStates) {
      if (k.endsWith(sectionIdentifier)) return v
    }
    return null
  },

  initializePartSectionItemStateMap (partSectionIdentifier) {
    this.sectionItemStates.set(partSectionIdentifier, new Map())
    return this.sectionItemStates.get(partSectionIdentifier)
  },

  findItemVariableValueByIdentifier (itemState, identifier) {
    const contextVariable = this.findVariableByIdentifier(itemState.contextVariables, identifier)
    if (typeof contextVariable !== 'undefined') return contextVariable
    const outcomeVariable = this.findVariableByIdentifier(itemState.outcomeVariables, identifier)
    if (typeof outcomeVariable !== 'undefined') return outcomeVariable
    const responseVariable = this.findVariableByIdentifier(itemState.responseVariables, identifier)
    if (typeof responseVariable !== 'undefined') return responseVariable
    const templateVariable = this.findVariableByIdentifier(itemState.templateVariables, identifier)
    if (typeof templateVariable !== 'undefined') return templateVariable

    return null
  },

  findVariableByIdentifier (variables, identifier) {
    return variables.find(v => v.identifier === identifier)
  },

  getSerializedState () {
    let state = {
      contextVariables: this.serializeVariables(this.getContextDeclarations()),
      outcomeVariables: this.serializeVariables(this.getOutcomeDeclarations())
    }

    return state
  },

  serializeVariables (variables) {
    let variableArray = []
    variables.forEach((variable) => {
      variableArray.push({
        identifier: variable.identifier,
        cardinality: variable.cardinality,
        baseType: variable.baseType,
        value: this.serializeVariableValue(variable.cardinality, variable.value)
      })
    })

    return variableArray
  },

  serializeVariableValue (cardinality, value) {
    if (cardinality !== 'record') return JSON.parse(JSON.stringify(value))

    // Records are Map's - special handling.
    return this.serializeRecordVariableValue(value)
  },

  serializeVariableState (state) {
    return JSON.parse(JSON.stringify(state))
  },

  serializeRecordVariableValue (value) {
    const jsonString = this.strMapToJson(value)
    return this.jsonToStrMap(jsonString)
  },

  strMapToJson (stringMap) {
    return JSON.stringify(this.strMapToObj(stringMap))
  },

  jsonToStrMap(jsonString) {
    return this.objToStrMap(JSON.parse(jsonString))
  },

  strMapToObj (strMap) {
    let obj = Object.create(null)
    for (let [k,v] of strMap) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      obj[k] = v
    }
    return obj
  },

  objToStrMap (obj) {
    let strMap = new Map()
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k])
    }
    return strMap
  },

  /**
   * @description Called when the Qti3TestPlayer is mounted.  Pass a copy
   * of itself in the playerNode parameter.
   * @param {Object} playerNode - object containing the player component (playerNode.player)
   */
  NotifyTestPlayerReady (playerNode) {
    this.player = playerNode.player
  },

  /**
   * @description This method should be called after the qti-assessment-test component
   * has been completely loaded and parsed.
   * @param {Object} testNode - an object containing the qti-assessment-test component itself.
   * e.g., { test: (reference to qti-assessment-test component) }
   */
  NotifyTestReady (testNode) {
    this.setTest(testNode)
  }

}
