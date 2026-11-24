<template>
  <a
    @keydown.tab="$emit('listItemBlur')"
    @keydown.esc.stop.prevent="$emit('listItemBlur')"
    @keydown.down.prevent
    @keydown.up.prevent
    @keyup.down="$emit('selectNext')"
    @keyup.up="$emit('selectPrevious')"
    @blur="processFocusOut"
    tabindex="0"
    href="#"
    :class="textClasses"
  >
    <div class="sr-only">{{screenReaderText}}</div>
    <div aria-hidden="true">
      <slot name="suggestion" v-bind="{ data: data, htmlText: htmlText }">
        <span v-html="htmlText"></span>
      </slot>
    </div>
  </a>
</template>

<script>
export default {
  name: 'VueTypeaheadBootstrapListItem',

  compatConfig: { MODE: 3 },

  props: {
    active: {
      type: Boolean
    },
    data: {},
    screenReaderText: {
      type: String
    },
    htmlText: {
      type: String
    },
    disabled: {
      type: Boolean
    },
    backgroundVariant: {
      type: String
    },
    backgroundVariantResolver: {
      type: Function,
      default: (d) => null,
      validator: d => d instanceof Function
    },
    textVariant: {
      type: String
    }
  },
  // click is not declared: it reaches the link as a native listener
  emits: ['listItemBlur', 'selectNext', 'selectPrevious'],
  data: function() {
    return {
      baseTextClasses: ['vbst-item', 'list-group-item', 'list-group-item-action']
    }
  },

  computed: {
    textClasses() {
      const classes = [...this.baseTextClasses]
      const backgroundVariantResolverResult = this.backgroundVariantResolver(this.data)
      const backgroundVariant =
          (typeof backgroundVariantResolverResult === 'string' && backgroundVariantResolverResult.trim()) ||
          this.backgroundVariant
      if (backgroundVariant) classes.push(`list-group-item-${backgroundVariant}`)
      if (this.textVariant) classes.push(`text-${this.textVariant}`)
      if (this.disabled) classes.push('disabled')
      return classes.join(' ')
    }
  },

  methods: {
    processFocusOut(evt) {
      const tgt = evt.relatedTarget
      if (tgt && tgt.classList.contains('vbst-item')) {
        return
      }

      this.$emit('listItemBlur')
    }
  }
}
</script>

<style scoped>
  a:not(.disabled){
    cursor: pointer;
  }
  a.disabled{
    cursor: default;
    pointer-events: none;
  }
</style>
