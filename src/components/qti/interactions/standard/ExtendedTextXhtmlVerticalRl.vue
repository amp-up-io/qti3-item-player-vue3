<template>
  <div ref="root">
    <EditorQuillVerticalRl
      :content="content"
      :placeholder="placeholder"
      :editorHeight="editorHeight"
      :labelHeight="labelHeight"
      :counterStyle="counterStyle"
      :expectedLength="computedExpectedLength"
      :disabled="disabled"
      @input="handleInput"
      @editorReady="handleEditorReady"
    />
  </div>
</template>

<script>
import { store } from '@/store/store'
import EditorQuillVerticalRl from '@/components/qti/interactions/standard/EditorQuillVerticalRl.vue'

export default {
  name: 'ExtendedTextXhtmlVerticalRl',

  components: {
    EditorQuillVerticalRl
  },

  props: {

    responseIdentifier: {
      required: true,
      type: String
    },

    expectedLength: {
      required: false,
      type: String
    },

    placeholder: {
      required: false,
      type: String,
      default: ''
    },

    heightClass: {
      required: false,
      type: String,
      default: ''
    },

    counterStyle: {
      required: false,
      type: String,
      default: 'none'
    }

  },

  computed: {

    computedExpectedLength () {
      return (typeof this.expectedLength !== 'undefined') ? this.expectedLength : '400'
    },

    colorStyle () {
      const pnp = store.getItemContextPnp()
      return pnp.getColorStyle()
    },

    editorHeight () {
      if (this.heightClass === 'qti-height-lines-15') return '25.9rem'
      if (this.heightClass === 'qti-height-lines-6') return '11.5rem'
      // If anything else, return Height for qti-height-lines-3
      return '6.7rem'
    },

    labelHeight () {
      if (this.heightClass === 'qti-height-lines-15') return '29.7rem'
      if (this.heightClass === 'qti-height-lines-6') return '12.3rem'
      // If anything else, return Height for qti-height-lines-3
      return '6.6rem'
    },

    maxLength () {
      return 10000
    },

    disabled () {
      return this.isDisabled
    }

  },

  data () {
    return {
      response: '',
      content: '',
      state: null,
      editor: null,
      isDisabled: false
    }
  },

  inheritAttrs: false,

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String} response string or null
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string
     */
    setResponse (response) {
      if (response === null) {
        this.response = ''
        this.setContent('')
        return
      }

      this.setContent(response)
      this.response = response
    },

    /**
     * @description Method to use when we want to update the response but
     * not trigger any content model updates.
     * @param {String} response - html of the editor
     */
    updateResponse (response) {
      this.response = response
    },

    /**
     * @description Get this interaction's state.
     * @return {Object} state
     */
    getState () {
      return this.state
    },

    /**
     * @description Set/restore this interaction's state.
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    getContent () {
      return this.content
    },

    /**
     * @description This is bound to the editor's model.
     * Triggers an editor update.
     * @param {String} content string of html
     */
    setContent (content) {
      this.content = content
    },

    computeState (text) {
      const state = {
        text: text
      }
      return state
    },

    setIsDisabled (isDisabled) {
      this.isDisabled = isDisabled
    },
    
    /**
     * @description Handle the input event from Quill.  With 1.3.7 Quill, the input
     * event is fired twice:  Once with html and text properties in the data object;
     * e.g., {
     *         html: "<p>hello world</p>"",
     *         text: "hello world"
     *       }
     * 
     * ...and once with just a simple InputEvent.
     * Skip the input event if it does not contain an html property.
     * @param {*} data 
     */
    handleInput (data) {
      // Bail when data is missing the html property
      if (!data.html) return

      // IMPORTANT: Do not use setResponse here
      this.updateResponse(data.html)
      // Save the raw text in state
      this.setState(this.computeState(data.text))

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
        })
    },

    handleEditorReady (data) {
      // Keep a handle on the editor component
      this.node = data.node

      // Notify parent that we are ready.
      // Pass ourselves to parent.
      this.$parent.$emit('extendedTextReady', {
          node: this
        })
    }

  },

  mounted () {
  }
}
</script>

<style>
.ext-text-xhtml-vert-rl-counter {
  margin: .25rem 0 .25rem .5rem;
  width: 1.5rem;
  line-height: 1.5rem;
  text-align: right;
  font-size: .875rem;
  color: var(--foreground);
  padding-bottom: .25rem;
  text-orientation: upright;
  letter-spacing: -2px;
}
</style>
