<!-- vue-typeahead-bootstrap 2.12.0 (MIT, see LICENSE.txt) for Vue 3: the configs alias the package to this file. -->
<template>
  <div
    :id="`typeahead-${id}`"
    role="combobox"
    aria-haspopup="listbox"
    :aria-owns="`result-list-${id}`"
    :aria-expanded="isListVisible ? 'true' : 'false'"
  >
    <div :class="inputGroupClasses">
      <div ref="prependDiv" v-if="$slots.prepend || prepend" class="input-group-prepend">
        <slot name="prepend">
          <span class="input-group-text">{{ prepend }}</span>
        </slot>
      </div>
      <input
        ref="input"
        :id="`typeahead-input-${id}`"
        type="text"
        role="searchbox"
        :class="`form-control ${inputClass}`"
        :aria-labelledby="ariaLabelledBy"
        aria-multiline="false"
        aria-autocomplete="list"
        :aria-controls="`result-list-${id}`"
        :aria-activedescendant="`selected-option-${id}`"
        :name="inputName"
        :placeholder="placeholder"
        :aria-label="(!ariaLabelledBy) ? placeholder : null"
        :value="inputValue"
        :disabled="disabled"
        @focus="isFocused = true"
        @blur="handleFocusOut"
        @input="handleInput($event.target.value)"
        @keydown.esc="handleEsc($event.target.value)"
        @keyup="handleKeyup"
      />
      <div v-if="$slots.append || append" class="input-group-append">
        <slot name="append">
          <span class="input-group-text">{{ append }}</span>
        </slot>
      </div>
    </div>
    <vue-typeahead-bootstrap-list
      :id="`result-list-${id}`"
      class="vbt-autcomplete-list"
      ref="list"
      :visible="isListVisible"
      :query="inputValue || ''"
      :data="formattedData"
      :background-variant="backgroundVariant"
      :background-variant-resolver="backgroundVariantResolver"
      :text-variant="textVariant"
      :maxMatches="maxMatches"
      :minMatchingChars="minMatchingChars"
      :disableSort="disableSort"
      :showOnFocus="showOnFocus"
      :showAllResults="showAllResults"
      @hit="handleHit"
      @listItemBlur="handleChildBlur"
      @activeListItemChange="handleActiveListItemChange"
      :highlightClass='highlightClass'
      :disabledValues="disabledValues"
      :vbtUniqueId="id"
      role="listbox"
    >
      <template v-if="$slots.suggestion" #suggestion="{ data, htmlText }">
        <slot name="suggestion" v-bind="{ data, htmlText }"></slot>
      </template>
    </vue-typeahead-bootstrap-list>
  </div>
</template>

<script>
import VueTypeaheadBootstrapList from './VueTypeaheadBootstrapList.vue'

export default {
  name: 'VueTypeaheadBootstrap',

  // Plain Vue 3: @vue/compat must not turn the v-model of a parent into value/input.
  compatConfig: { MODE: 3 },

  components: {
    VueTypeaheadBootstrapList
  },

  props: {
    ariaLabelledBy: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: null,
      validator: size => ['lg', 'md', 'sm'].indexOf(size) > -1
    },
    modelValue: {
      type: String
    },
    // declared to keep it off the root element
    modelModifiers: Object,
    disabled: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      required: true,
      validator: d => d instanceof Array
    },
    serializer: {
      type: Function,
      default: (d) => d,
      validator: d => d instanceof Function
    },
    // Don't call this method, use _screenReaderTextSerializer()
    // Using _screenReaderTextSerializer allows for defaulting based on .serializer
    screenReaderTextSerializer: {
      type: Function,
      validator: d => d instanceof Function
    },
    backgroundVariant: String,
    backgroundVariantResolver: {
      type: Function,
      default: (d) => d,
      validator: d => d instanceof Function
    },
    disabledValues: {
      type: Array,
      default: () => []
    },
    textVariant: String,
    inputClass: {
      type: String,
      default: ''
    },
    inputName: {
      type: String,
      default: undefined
    },
    maxMatches: {
      type: Number,
      default: 10
    },
    minMatchingChars: {
      type: Number,
      default: 2
    },
    disableSort: {
      type: Boolean,
      default: false
    },
    showOnFocus: {
      type: Boolean,
      default: false
    },
    showAllResults: {
      type: Boolean,
      default: false
    },
    autoClose: {
      type: Boolean,
      default: true
    },
    ieCloseFix: {
      type: Boolean,
      default: true
    },
    placeholder: String,
    prepend: String,
    append: String,
    highlightClass: String
  },

  emits: ['hit', 'update:modelValue', 'keyup'],

  computed: {
    id() {
      return Math.floor(Math.random() * 100000)
    },
    inputGroupClasses() {
      return this.size ? `input-group input-group-${this.size}` : 'input-group'
    },

    isListVisible() {
      return this.isFocused && this.data.length > 0
    },

    formattedData() {
      if (!(this.data instanceof Array)) {
        return []
      }
      return this.data.map((d, i) => {
        return {
          id: i,
          data: d,
          screenReaderText: this._screenReaderTextSerializer(d),
          text: this.serializer(d)
        }
      })
    }
  },

  methods: {
    _screenReaderTextSerializer(d){
      if ( typeof d === "object" && !Array.isArray(d) && d !== null){
       if (this.screenReaderTextSerializer){
          return this.screenReaderTextSerializer(d)
        } else {
          return this.serializer(d)
        }
      } else {
        return d
      }
    },
    resizeList(el) {
      const rect = el.getBoundingClientRect()
      const listStyle = this.$refs.list.$el.style

      // Set the width of the list on resize
      listStyle.width = rect.width + 'px'

      // Set the margin when the prepend prop or slot is populated
      // (setting the "left" CSS property doesn't work)
      if (this.$refs.prependDiv) {
        const prependRect = this.$refs.prependDiv.getBoundingClientRect()
        listStyle.marginLeft = prependRect.width + 'px'
      }
    },

    // If v-model is being used, emit its event and reset the list's active entry. The package's list reset itself
    // on that event, which it got only with a v-model: without one the entry stays active, as in the package.
    emitInput(newValue) {
      if (typeof this.modelValue !== 'undefined') {
        this.$emit('update:modelValue', newValue)
        this.$refs.list.resetActiveListItem()
      }
    },

    handleHit(evt) {
      this.emitInput(evt.text)

      this.inputValue = evt.text
      this.$emit('hit', evt.data)

      if (this.autoClose) {
        this.$refs.input.blur()
        this.isFocused = false
      }
    },

    handleChildBlur() {
      // Unmounting blurs a focused entry; Vue 3 has cleared the refs by then
      if (this.$refs.input) {
        this.$refs.input.focus()
      }
      this.isFocused = false
    },

    handleActiveListItemChange() {
      if (!this.autoClose) {
        this.isFocused = true
      }
    },

    runFocusOut(tgt) {
      if (tgt && tgt.classList.contains('vbst-item')) {
        return
      }
      this.isFocused = false
    },

    handleFocusOut(evt) {
      const tgt = evt.relatedTarget
      if (!!navigator.userAgent.match(/Trident.*rv:11\./) && this.ieCloseFix) {
        setTimeout(() => { this.runFocusOut(tgt) }, 300)
      } else {
        this.runFocusOut(tgt)
      }
    },

    handleInput(newValue) {
      this.isFocused = true
      this.inputValue = newValue

      this.emitInput(newValue)
    },

    // The parent first: Autocomplete clears its text on Enter before the list picks an entry
    handleKeyup(evt) {
      this.$emit('keyup', evt)
      this.$refs.list.handleParentInputKeyup(evt)
    },

    handleEsc(inputValue) {
      if (inputValue === '') {
        this.$refs.input.blur()
        this.isFocused = false
      } else {
        this.inputValue = ''
      }
    }
  },

  data() {
    return {
      isFocused: false,
      inputValue: this.modelValue || ''
    }
  },

  mounted() {
    this.$_ro = new ResizeObserver(e => {
      this.resizeList(this.$refs.input)
    })
    this.$_ro.observe(this.$refs.input)
    this.$_ro.observe(this.$refs.list.$el)
  },

  beforeUnmount() {
    this.$_ro.disconnect()
  },

  watch: {
    modelValue: function(val) {
      this.inputValue = val
    }
  }
}
</script>

<style scoped>
  .vbt-autcomplete-list {
    padding-top: 5px;
    position: absolute;
    max-height: 350px;
    -ms-overflow-style: -ms-autohiding-scrollbar;
    overflow-y: auto;
    z-index: 999;
  }
  .vbt-autcomplete-list :deep(.vbt-matched-text){
    font-weight: bold;
  }
</style>
