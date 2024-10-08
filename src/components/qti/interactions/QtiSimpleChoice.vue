<template>
  <li
    ref="choice"
    :role="role"
    :aria-checked="checked"
    :tabindex="tabIndex"
    :data-identifier="identifier"
    @focus="handleFocus"
    @blur="handleBlur"
    @click="handleClick"
    @keydown="handleKeydown"
    class="qti-simple-choice"
    :class="{ source: role=='button' }">
    <div
      class="qti-simple-choice-wrapper"
      :class="{ draggable: role=='button' }"
      style="width:100%;">
      <div
        ref="label"
        class="qti-choice-label">
      </div>
      <div
        ref="description"
        class="qti-choice-description">
        <slot></slot>
      </div>
    </div>
  </li>
</template>

<script>
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiSimpleChoice',

  emits: [
    'setChecked',
    'setFocusPreviousChoice',
    'setFocusNextChoice',
    'setActiveDescendant'
  ],

  props: {
    identifier: {
      required: true,
      type: String
    },
    /*
     * If fixed is true for a choice then the position of this choice within the interaction must not be
     * changed by the delivery engine even if the immediately enclosing interaction supports the shuffling
     * of choices. If no value is specified then the choice is free to be shuffled. In Item Templates, the
     * visibility of choices can be controlled by setting the value(s) of an associated template variable
     * during template processing. For information about item templates see Item Templates.
     */
    fixed: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * The identifier of a template variable that must have a base-type of identifier and be either single
     * of multiple cardinality. When the associated interaction is part of an Item Template the value of the
     * identified template variable is used to control the visibility of the choice. When a choice is hidden
     * it is not selectable and its content is not visible to the candidate unless otherwise stated.
     */
    templateIdentifier: {
      required: false,
      type: String
    },
    /*
     * The showHide characteristic determines how the visibility of the choice is controlled. If set
     * to 'show' then the choice is hidden by default and shown only if the associated template variable
     * matches, or contains, the identifier of the choice. If set to 'hide' then the choice is shown by
     * default and hidden if the associated template variable matches, or contains, the choice's identifier.
     */
    showHide: {
      required: false,
      type: String,
      default: 'show'
    }
  },

  data () {
    return {
      id: null,
      checked: 'false',
      isRadio: true,
      role: 'radio',
      tabIndex: '-1',
      hasMath: false,
      isDisabled: false,
      parentCardinality: 'single'
    }
  },

  inheritAttrs: true,

  methods: {

    handleClick () {
      if (this.isDisabled) return

      if (this.isRadio) {
        this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': 'true' })
      } else {
        this.toggleChecked()

        if (this.parentCardinality === 'ordered') return

        this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
      }
    },

    handleKeydown (event) {
      let flag = false

      switch (event.code) {
        case 'Space':
          if (!this.isDisabled) {
            this.toggleChecked()

            if (this.parentCardinality === 'ordered') return

            this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
          }
          flag = true
          break

        case 'Enter':
        if (!this.isDisabled) {
            this.toggleChecked()

            if (this.parentCardinality === 'ordered') return

            this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
          }
          flag = true
          break

        case 'ArrowUp':
        case 'ArrowLeft':
          // Handle these keys if this is a radio button
          if (this.isRadio) {
            this.$parent.$emit('setFocusPreviousChoice', this.identifier)
            flag = true
          }
          break

        case 'ArrowDown':
        case 'ArrowRight':
          // Handle these keys if this is a radio button.
          if (this.isRadio) {
            this.$parent.$emit('setFocusNextChoice', this.identifier)
            flag = true
          }
          break

        default:
          break
      }

      if (flag) {
        event.stopPropagation()
        event.preventDefault()
      }
    },

    handleFocus () {
      if (this.parentCardinality === 'ordered') return
      // Notify parent that this choice has the focus.
      // In turn, this should set the aria-activedescendant attribute
      // on the choice container to this.id
      this.$parent.$emit('setActiveDescendant', this.id)
    },

    handleBlur () {
      // NOOP
    },

    setChecked (checked) {
      this.checked = (checked ? 'true' : 'false')
    },

    isChecked () {
      return (this.checked === 'true')
    },

    setTabIndex (tabIndex) {
      this.tabIndex = tabIndex
    },

    setFocus () {
      this.$refs.choice.focus()
    },

    setBlur () {
      this.$refs.choice.blur()
    },

    toggleChecked () {
      this.checked = this.checked === 'true' ? 'false' : 'true'
    },

    setLabel (label) {
      this.$refs.label.innerText = label
    },

    hideLabel () {
      this.$refs.label.classList.add('qti-hidden')
    },

    showLabel () {
      this.$refs.label.classList.remove('qti-hidden')
    },

    setLabelSbac (label) {
      this.$refs.choice.classList.add('sbac')
      this.$refs.choice.setAttribute('data-label', label)
      // For aria
      this.$refs.label.innerText = label
      this.$refs.label.classList.add('qti-visually-hidden')
    },

    setChoiceLrn () {
      this.$refs.choice.classList.add('lrn')
    },

    hideControl () {
      this.$refs.choice.classList.add('control-hidden')
    },

    setIsDisabled (isDisabled) {
      this.isDisabled = isDisabled
    },

    initializeChoice () {
      this.parentCardinality = this.$parent.cardinality
      switch (this.parentCardinality) {
        case 'ordered':
          this.role = 'button'
          this.isRadio = false
          this.tabIndex = 0
          break
        case 'multiple':
          this.role = 'checkbox'
          this.isRadio = false
          this.tabIndex = 0
          break
        default:
          // Default to radio.
          this.role = 'radio'
          this.isRadio = true
          this.tabIndex = -1
          break
      }
    },

    /**
     * @description For initializing a qti-simple-choice in an Order interaction.
     * For order simple choices we hide the label and the control, leaving only
     * the description.
     */
    initializeOrderChoice () {
      if (this.role === 'button') {
        this.hideLabel()
        this.hideControl()
      }
    },

    /**
     * @description Construct an id if the node has no defined id.
     * This is for accessibility.
     */
    createId () {
      if (this.$refs.choice.hasAttribute('id')) {
        // Node already has an authored id.  Use it.
        this.id = this.$refs.choice.getAttribute('id')
        return
      }

      // Node does not have an authored id.  Create one.
      this.id = 'choice_' + qtiAttributeValidation.randomString (5, 'a') + '_' + this.identifier
      this.$refs.choice.setAttribute('id', this.id)
    },
    
    setExpectedSolution () {
      this.$refs.choice.classList
        .add(
          'player-show-solution',
          'player-choice-expected')
    },

    setCorrectSolution () {
      this.$refs.choice.classList
        .add(
          'player-show-solution',
          'player-choice-correct')
    },

    setIncorrectSolution () {
      this.$refs.choice.classList
        .add(
          'player-show-solution',
          'player-choice-incorrect')
    },

    setIgnoreSolution () {
      this.$refs.choice.classList
        .remove(
          'player-show-solution',
          'player-choice-incorrect',
          'player-choice-correct',
          'player-choice-expected')
    }

  },

  created () {
    this.initializeChoice()
  },

  mounted () {
    // If this is an order choice, its role will be button
    this.initializeOrderChoice()

    this.createId()
  }
}
</script>

<style>
[role="radio"],
[role="checkbox"] {
  display: inline-block;
  position: relative;
  padding: 0.25rem 0.25rem 0.25rem 2.10rem;
  outline: none;
  border-top: 1px dashed transparent;
  border-bottom: 1px dashed transparent;
  border-left: 3px solid transparent;
  border-right: 1px dashed transparent;
  /* IMPORTANT: Must have following in order to work
     around Chrome-only column wrapping bug */
  -webkit-column-break-inside: avoid;
  cursor: pointer;
}

/* Take a little padding out of the bottom on writing mode vertical-rl */
.qti3-player-writing-mode-vertical-rl [role="radio"],
.qti3-player-writing-mode-vertical-rl [role="checkbox"] {
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-bottom: 0.25rem;
  border-left: 1px dashed transparent;
  border-top: 3px solid transparent;
}

[role="checkbox"]::before,
[role="checkbox"]::after,
[role="radio"]::before,
[role="radio"]::after {
  position: absolute;
  top: 1.1rem;
  left: .95rem;
  transform: translate(-50%, -50%);
  content: '';
}

.qti3-player-writing-mode-vertical-rl [role="checkbox"]:not(.control-hidden)::before,
.qti3-player-writing-mode-vertical-rl [role="checkbox"]:not(.control-hidden)::after,
.qti3-player-writing-mode-vertical-rl [role="radio"]:not(.control-hidden)::before,
.qti3-player-writing-mode-vertical-rl [role="radio"]:not(.control-hidden)::after {
  position: absolute;
  top: .95rem;
  left: auto;
  right: 0.15rem;
  transform: translate(-50%, -50%);
  content: '';
}

[role="checkbox"]:not(.control-hidden)::before,
[role="radio"]:not(.control-hidden)::before {
  width: 1rem;
  height: 1rem;
  margin-top: 0;
  vertical-align: top;
  /* Default inner color of the control */
  background-color: var(--choice-control-bgc);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  /* The pale gray border around the control */
  border: var(--choice-control-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Used for order interaction */
.draggable {
  display: inline-block;
  position: relative;
  font-weight: 400;
  cursor: move;
  padding: .25rem;
  margin: 0;
  vertical-align: top;
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  overflow: hidden;
  text-decoration: none;
  border-radius: .25rem;
}

/* ============================================
   Overrides for narrower than iPad in portrait
   ============================================ */
@media (max-width:767px) {

  [role="radio"],
  [role="checkbox"] {
    /* padding: 0.25rem 0.25rem 0.25rem 1.5rem; */
    padding: 0.25rem 0.25rem 0.25rem 2rem;
  }

  [role="radio"].sbac {
    padding: 0.25rem 0.25rem 0.25rem 1.8rem;
  }

}

[role="radio"]:not(.control-hidden)::before {
  border-radius: 50%;
}

[role="checkbox"]:not(.control-hidden)::before {
  border-radius: 0.25rem;
}

[role="checkbox"]:not(.control-hidden):active::before,
[role="radio"]:not(.control-hidden):active::before {
  filter: brightness(90%);
}

/* Choice focus */
[role="checkbox"]:not(.control-hidden):focus,
[role="radio"]:not(.control-hidden):focus {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 3px solid transparent;
  border-right: 1px solid transparent;
  border-radius: 0.15rem;
  border-color: var(--choice-focus-border);
}

.qti3-player-writing-mode-vertical-rl [role="radio"]:not(.control-hidden):focus,
.qti3-player-writing-mode-vertical-rl [role="checkbox"]:not(.control-hidden):focus {
  border-top: 3px solid transparent;
  border-left: 1px solid transparent;
  border-color: var(--choice-focus-border);
}

/* Radio/Checkbox control focus */
[role="checkbox"]:not(.control-hidden):focus::before,
[role="radio"]:not(.control-hidden):focus::before {
  border-color: var(--choice-control-focus-border);
  outline: 0;
  /* Puts pale blue box shadow around the control */
  box-shadow: var(--choice-control-focus-shadow);
}

/* Radio/Checkbox control checked */
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::before,
[role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-color: var(--choice-control-checked-bg);
  border-color: var(--choice-control-checked-bc);
}

/* Radio control checked */
[role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='currentColor' /%3e%3c/svg%3e");
}

/* Radio control checked for default color scheme */
.qti3-player-color-default [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before,
.qti3-player-color-blackwhite [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23fff' /%3e%3c/svg%3e");
}

.qti3-player-color-blackrose [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23ffd0ff' /%3e%3c/svg%3e");
}

.qti3-player-color-mgraydgray [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23666' /%3e%3c/svg%3e");
}

.qti3-player-color-dgraymgray [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23e5e5e5' /%3e%3c/svg%3e");
}

.qti3-player-color-blueyellow [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23ffcc00' /%3e%3c/svg%3e");
}

.qti3-player-color-yellowblue [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23003398' /%3e%3c/svg%3e");
}

.qti3-player-color-blackcyan [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23add8e6' /%3e%3c/svg%3e");
}

.qti3-player-color-blackcream [role="radio"][aria-checked="true"]:not(.control-hidden):not(.sbac)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23fffacd' /%3e%3c/svg%3e");
}

/* Checkbox control checked */
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

/* Checkbox control checked for default color scheme */
.qti3-player-color-default [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before,
.qti3-player-color-defaultreverse [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before,
.qti3-player-color-blackwhite [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-blackrose [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffd0ff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-mgraydgray [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-dgraymgray [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23e5e5e5' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-blueyellow [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffcc00' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-yellowblue [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23003398' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-blackcyan [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23add8e6' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-blackcream [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fffacd' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

/* Radio/Checkbox control hover */
/*
[role="checkbox"]:not(.control-hidden):hover::before,
[role="radio"]:not(.control-hidden):hover::before {
  border: 1px solid var(--choice-control-hover-bc);
}
*/

/* ===========
   SBAC styles
   =========== */
[role="radio"].sbac::before {
  width: 1.25rem;
  height: 1.25rem;
  /* Default inner color of the control */
  background-color: var(--choice-control-bgc);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  /* The pale gray border around the control */
  border: var(--choice-control-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  print-color-adjust: exact;
}

[role="radio"].sbac::after {
  font-size: .85rem;
}

[role="radio"][data-label="A"].sbac::after {
  content: 'A'
}

[role="radio"][data-label="B"].sbac::after {
  content: 'B'
}

[role="radio"][data-label="C"].sbac::after {
  content: 'C'
}

[role="radio"][data-label="D"].sbac::after {
  content: 'D'
}

[role="radio"][data-label="E"].sbac::after {
  content: 'E'
}

[role="radio"][data-label="F"].sbac::after {
  content: 'F'
}

/*
[role="radio"][aria-checked="true"].sbac {
}
*/

[role="radio"][aria-checked="false"].sbac::before {
  background-color: var(--choice-sbac-control-unchecked-bg);
  border-color: var(--choice-sbac-control-unchecked-bc);
}

[role="radio"][aria-checked="true"].sbac::before {
  background-color: var(--choice-sbac-control-checked-bg);
  border-color: var(--choice-sbac-control-checked-bc);
}

[role="radio"][aria-checked="false"].sbac::after {
  color: var(--choice-sbac-unchecked-color);
}

[role="radio"][aria-checked="true"].sbac::after {
  color: var(--choice-sbac-checked-color);
}

/* =====================
   Control Hidden styles
   ===================== */

[role="radio"].control-hidden,
[role="checkbox"].control-hidden {
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  border-radius: .25rem;
  margin-bottom: .5rem;
  padding-left: .2rem;
}

.qti3-player-writing-mode-vertical-rl [role="radio"].control-hidden,
.qti3-player-writing-mode-vertical-rl [role="checkbox"].control-hidden {
  padding-top: .3rem;
  margin-left: .75rem;
}

[role="radio"][aria-checked="true"].control-hidden,
[role="checkbox"][aria-checked="true"].control-hidden {
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
  border: 1px solid var(--choice-ctrlh-checked-bgc);
}

[role="checkbox"].control-hidden:focus,
[role="radio"].control-hidden:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-focus-bc);
  color: var(--choice-ctrlh-color);
  box-shadow: var(--choice-control-focus-shadow);
}

[role="checkbox"][aria-checked="true"].control-hidden:focus,
[role="radio"][aria-checked="true"].control-hidden:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-checked-color);
  color: var(--choice-ctrlh-checked-color);
}

[role="checkbox"].control-hidden:hover,
[role="radio"].control-hidden:hover {
  filter: var(--choice-ctrlh-hover-brightness);
}

/* ================
   LRN Block Styles
   ================ */

[role="radio"].control-hidden.lrn,
[role="checkbox"].control-hidden.lrn {
  color: var(--foreground);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  border-radius: 0;
  margin-bottom: 0;
  padding: 0;
}

[role="radio"].control-hidden.lrn .qti-choice-label:not(.qti-hidden),
[role="checkbox"].control-hidden.lrn .qti-choice-label:not(.qti-hidden) {
  display: table-cell;
  padding-top: .55em;
  padding-left: .65em;
  padding-right: .65em;
  padding-bottom: .55em;
  font-size: 1.8em;
  width: 2.1em;
  min-width: 2.1em;
  height: 100%;
  min-height: 2.0em;
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-lblbgc);
  border-right: 2px solid rgba(0,0,0,0.1);
}

[role="radio"].control-hidden.lrn .qti-choice-description,
[role="checkbox"].control-hidden.lrn .qti-choice-description {
  display: table-cell;
  width: 100%;
  padding-top: .85em;
  padding-right: 0;
  padding-bottom: .8em;
  padding-left: .7em;
  vertical-align: middle;
  color: var(--choice-ctrlh-desccolor);
}

[role="radio"][aria-checked="true"].control-hidden.lrn .qti-choice-label:not(.qti-hidden),
[role="checkbox"][aria-checked="true"].control-hidden.lrn .qti-choice-label:not(.qti-hidden) {
  border-right: 2px solid rgba(0,0,0,0.3);
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
}

[role="radio"][aria-checked="true"].control-hidden.lrn .qti-choice-description,
[role="checkbox"][aria-checked="true"].control-hidden.lrn .qti-choice-description {
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
}

/* ===============
   Disabled styles
   ===============*/

[role="radio"].disabled:not(.control-cell),
[role="checkbox"].disabled:not(.control-cell) {
  pointer-events: none;
  filter: none;
  opacity: 0.6;
}

[role="radio"].control-hidden.disabled,
[role="checkbox"].control-hidden.disabled {
  pointer-events: none;
  filter: none;
  opacity: 0.75;
}

/* ============================
   Label and Description styles
   ============================ */

.qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 1.5rem;
}

.qti-choice-interaction.qti-labels-cjk-ideographic .qti-choice-label {
  width: 2rem;
}

/* When writing mode is vertical-rl and labels cjk-ideographic, add more height */
.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-labels-cjk-ideographic:not(.qti-labels-suffix-none) .qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 2rem;
  height: 2.15rem;
  writing-mode: horizontal-tb;
  text-align: right;
  padding-right: 0.15rem;
}

/* When writing mode is vertical-rl and labels cjk-ideographic, add more height */
.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-labels-cjk-ideographic.qti-labels-suffix-none .qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 2rem;
  height: 2.15rem;
  writing-mode: horizontal-tb;
  text-align: right;
  padding-right: .4rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction:not(.qti-labels-cjk-ideographic):not(.qti-labels-suffix-none) .qti-choice-label,
.qti3-player-writing-mode-vertical-rl .qti-choice-interaction:not(.qti-labels-cjk-ideographic).qti-labels-suffix-none .qti-choice-label {
  margin-top: 1.65rem;
  margin-bottom: .75rem;
  width: 2rem;
  height: 1.5rem;
  writing-mode: horizontal-tb;
  text-align: center;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction:not(.qti-labels-cjk-ideographic):not(.qti-labels-suffix-none) .qti-choice-label {
  padding-left: .4rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction:not(.qti-labels-cjk-ideographic).qti-labels-suffix-none .qti-choice-label {
  padding-left: .15rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-label {
  display: inline-block;
  vertical-align: top;
  margin-top: 1.75rem;
  height: 1.5rem;
}

/* Add some top padding when vertical-rl and labels none */
.qti3-player-writing-mode-vertical-rl .qti-labels-none:not(.qti-input-control-hidden) .qti-choice-description {
  margin-top: 1.95rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction:not(.qti-labels-cjk-ideographic).qti-input-control-hidden .qti-choice-label {
  margin-top: 0;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-labels-cjk-ideographic.qti-input-control-hidden .qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 2rem;
  height: 2rem;
  margin-top: 0;
  text-align: center;
  padding-right: 0.25rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-labels-cjk-ideographic.qti-input-control-hidden.qti-labels-suffix-none .qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 2rem;
  height: 2rem;
  margin-top: .25rem;
  text-align: center;
  padding-right: 0.5rem;
}

.qti-choice-label.qti-hidden {
  display: none;
  width: 0px;
}

.qti-choice-label.sbac {
  position: fixed !important;
  overflow: hidden;
  clip: rect(1px 1px 1px 1px);
  height: 1px;
  width: 1px;
  border: 0;
  margin: -1px;
}

.qti-choice-description {
  display: inline-block;
  vertical-align: top;
  width: calc(100% - 1.5em);
}

.qti-choice-interaction.qti-labels-cjk-ideographic .qti-choice-description {
  width: calc(100% - 2rem);
}

.player-show-solution .qti-simple-choice-wrapper::after {
  display: inline-block;
  content: " ";
  width: 26px;
  height: 26px;
  vertical-align: middle;
  margin-top: -1px;
}

.player-show-solution.player-choice-incorrect .qti-simple-choice-wrapper::after {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' height='26' width='26' viewBox='0 0 384 512'%3e%3cpath fill='%23dd002f' stroke='%23dd002f' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z'/%3e%3c/svg%3e");
}

.player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%234a700a' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-whiteblack .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-whiteblack .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-defaultreverse .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-defaultreverse .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-roseblack .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-roseblack .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-creamblack .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-creamblack .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-cyanblack .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-cyanblack .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-yellowblue .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-yellowblue .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after,
.qti3-player-color-mgraydgray .player-show-solution.player-choice-correct .qti-simple-choice-wrapper::after,
.qti3-player-color-mgraydgray .player-show-solution.player-choice-expected .qti-simple-choice-wrapper::after {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%2398fb98' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.player-show-solution.player-choice-correct {
  border-left: 3px solid #4a700a;
  /*background-color: #f0f8ed;*/
}

.player-show-solution.player-choice-incorrect {
  border-left: 3px solid #dd002f;
  /*background-color: #fbc3e3;*/
}

.player-show-solution.player-choice-expected {
  border-left: 3px solid #888;
  /*background-color: #fcfcd3;*/
}

.control-hidden .qti-choice-label,
.control-hidden .qti-choice-description {
  padding-left: 0.25rem;
}

.qti3-player-writing-mode-vertical-rl .control-hidden .qti-choice-label {
  margin-top: 0;
}

.qti3-player-writing-mode-vertical-rl .control-hidden .qti-choice-label,
.qti3-player-writing-mode-vertical-rl .control-hidden .qti-choice-description {
  padding-right: 0.25rem;
}

[role="button"].control-hidden .qti-choice-description {
  display: inline-block;
  vertical-align: top;
  width: 100%;
  overflow-wrap: break-word;
}

[role="button"].control-hidden .qti-choice-label,
[role="button"].control-hidden .qti-choice-description {
  padding: 0;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-labels-none.qti-input-control-hidden .qti-choice-description {
  padding-top: .25rem;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-interaction.qti-input-control-hidden .qti-choice-description {
  padding-bottom: .25rem;
}

/* ======================
   Special utility styles
   ====================== */
.qti-choice-description.lrn code {
  background-color: #e4e4e4;
}
</style>
