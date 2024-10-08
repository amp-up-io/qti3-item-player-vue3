<template>
  <div ref="root">
    <EditorQuill
      ref="editor"
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
import EditorQuill from '@/components/qti/interactions/standard/EditorQuill.vue'

export default {
  name: 'ExtendedTextXhtmlDefault',

  emits: [
    'extendedTextReady',
    'extendedTextUpdate'
  ],

  components: {
    EditorQuill
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
      if (this.heightClass === 'qti-height-lines-15') return '22.9rem'
      if (this.heightClass === 'qti-height-lines-6') return '10.1rem'
      if (this.heightClass === 'sbac-height-lines-95') return '136.6rem'
      // If anything else, return Height for qti-height-lines-3
      return '5.8rem'
    },

    labelHeight () {
      if (this.heightClass === 'qti-height-lines-15') return '29.4rem'
      if (this.heightClass === 'qti-height-lines-6') return '12.1rem'
      if (this.heightClass === 'sbac-height-lines-95') return '29.4rem'
      // If anything else, return Height for qti-height-lines-3
      return '6.4rem'
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
.ext-text-editor-counter {
  height: 1.5rem;
  line-height: 1.5rem;
  text-align: right;
  font-size: .875rem;
  color: var(--foreground);
  padding-right: .25rem;
}
</style>
