<template>
  <div class="test-controller-nav">
    <button ref="btnPrev" type="button" @click="handlePrevItem" class="btn btn-sm btn-outline-primary pull-left">Prev</button>
    <button ref="btnNext" type="button" @click="handleNextItem" class="btn btn-sm btn-outline-primary">Next</button>
    <!--
    <button ref="btnScore" type="button" @click="handleScoreItem" class="btn btn-sm btn-outline-primary">Score</button>
    -->
  </div>
</template>

<script>
export default {
  name: 'BottomBar',

  props: {
    isNavButtonsHidden: {
      type: Boolean,
      required: false,
      default: true
    },
    isPreviousDisabled: Boolean,
    isNextDisabled: Boolean,
    currentItem: Number,
    maxItems: Number
  },

  data () {
    return {
    }
  },

  methods: {

    initialize () {
    },

    handleNextItem () {
      this.$emit('nextItem')
    },

    handlePrevItem () {
      this.$emit('previousItem')
    },

    handleScoreItem () {
      this.$emit('scoreItem')
    }

  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
</style>