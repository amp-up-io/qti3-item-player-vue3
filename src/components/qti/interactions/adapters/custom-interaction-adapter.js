
const CUSTOM_INTERACTIONS = {
  AMP_LIKERT: 'amp:likert'
}

export function customInteractionAdapter(interaction) { //, props) {
  // Produce the Template for the interaction
  switch (interaction) {
    default:
      return {
        template: `<div>[Unsupported Custom Interaction: ${interaction}]</div>`
      }
  }
}

export function getCustomInteractionSubType(clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) return null

  // Return the first supported operator we find.
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    switch (clazzTokens[index]) {
      case CUSTOM_INTERACTIONS.AMP_LIKERT:
        return clazzTokens[index]
      default:
    }
  }
  return clazz
}
