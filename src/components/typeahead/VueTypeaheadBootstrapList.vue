<template>
  <div class="list-group shadow" ref="suggestionList" v-show="visible">
    <vue-typeahead-bootstrap-list-item
      v-for="(item, id) in matchedItems" :key="id"
      :active="isListItemActive(id)"
      :id="(isListItemActive(id)) ? `selected-option-${vbtUniqueId}` : null"
      :data="item.data"
      :html-text="highlight(item.text)"
      role="option"
      :aria-selected="(isListItemActive(id)) ? 'true' : 'false'"
      :screen-reader-text="(item.screenReaderText) ? item.screenReaderText : item.text"
      :disabled="isDisabledItem(item)"
      :background-variant="backgroundVariant"
      :background-variant-resolver="backgroundVariantResolver"
      :text-variant="textVariant"
      @click="handleHit(item, $event)"
      @listItemBlur="$emit('listItemBlur')"
      @selectNext="selectNextListItem"
      @selectPrevious="selectPreviousListItem"
    >
      <template v-if="$slots.suggestion" #suggestion="{ data, htmlText }">
        <slot name="suggestion" v-bind="{ data, htmlText }" />
      </template>
    </vue-typeahead-bootstrap-list-item>
  </div>
</template>

<script>
import VueTypeaheadBootstrapListItem from './VueTypeaheadBootstrapListItem.vue'
import { isEmpty } from '@/utils/lodashUtils'

const BEFORE_LIST_INDEX = -1

function sanitize(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// lodash's findIndex: a negative start counts from the end
function findIndex(items, predicate, fromIndex = 0) {
  const start = fromIndex < 0 ? Math.max(items.length + fromIndex, 0) : fromIndex
  return items.findIndex((item, index) => index >= start && predicate(item))
}

export default {
  name: 'VueTypeaheadBootstrapList',

  // Plain Vue 3, as the parent: the same under compat and without it
  compatConfig: { MODE: 3 },

  components: {
    VueTypeaheadBootstrapListItem
  },

  props: {
    data: {
      type: Array,
      required: true,
      validator: d => d instanceof Array
    },
    query: {
      type: String,
      default: ''
    },
    vbtUniqueId: {
      type: Number,
      required: true
    },
    visible: {
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
    disableSort: {
      type: Boolean
    },
    textVariant: {
      type: String
    },
    maxMatches: {
      type: Number,
      default: 10
    },
    minMatchingChars: {
      type: Number,
      default: 2
    },
    disabledValues: {
      type: Array,
      default: () => []
    },
    showOnFocus: {
      type: Boolean,
      default: false
    },
    showAllResults: {
      type: Boolean,
      default: false
    },
    highlightClass: {
      type: String,
      default: 'vbt-matched-text'
    }
  },

  emits: ['hit', 'listItemBlur', 'activeListItemChange'],

  data() {
    return {
      activeListItem: -1
    }
  },

  computed: {
    highlight() {
      return text => {
        text = sanitize(text)
        if (this.query.length === 0) {
          return text
        }

        const re = new RegExp(this.escapedQuery, 'gi')
        return text.replace(re, `<span class='${this.highlightClass}'>$&</span>`)
      }
    },

    escapedQuery() {
      return escapeRegExp(sanitize(this.query))
    },

    actionableItems() {
      return this.matchedItems.filter(matchedItem => !this.isDisabledItem(matchedItem))
    },

    matchedItems() {
      if (!this.showOnFocus && (isEmpty(this.query) || this.query.length < this.minMatchingChars)) {
        return []
      }

      const re = new RegExp(this.showAllResults ? '' : this.escapedQuery, 'gi')

      // Filter, sort, and concat
      return this.data
        .filter(i => i.text.match(re) !== null)
        .sort((a, b) => {
          if (this.disableSort) return 0

          const aIndex = a.text.indexOf(a.text.match(re)[0])
          const bIndex = b.text.indexOf(b.text.match(re)[0])

          if (aIndex < bIndex) { return -1 }
          if (aIndex > bIndex) { return 1 }
          return 0
        }).slice(0, this.maxMatches)
    }
  },

  methods: {
    handleParentInputKeyup(e) {
      switch (e.keyCode) {
        case 40: // down arrow
          this.selectNextListItem()
          break
        case 38: // up arrow
          this.selectPreviousListItem()
          break
        case 13: // enter
          this.hitActiveListItem()
          break
      }
    },

    handleHit(item, evt) {
      this.$emit('hit', item)
      evt.preventDefault()
    },
    hitActiveListItem() {
      if (this.activeListItem < 0) {
        this.selectNextListItem();
      }
      if (this.activeListItem >= 0) {
        this.$emit('hit', this.matchedItems[this.activeListItem])
      }
    },
    isDisabledItem(item) {
      return (this.disabledValues || []).includes(item.text)
    },

    isListItemActive(id) {
      return this.activeListItem === id
    },
    resetActiveListItem() {
      this.activeListItem = -1
    },

    findIndexForNextActiveItem(itemsToSearch, currentSelectedItem) {
      if (!itemsToSearch) {
        itemsToSearch = this.matchedItems
      }
      if (currentSelectedItem === undefined) {
        currentSelectedItem = this.activeListItem
      }

      let nextActiveIndex = findIndex(
        itemsToSearch,
        o => !this.isDisabledItem(o),
        currentSelectedItem + 1
      )

      if (nextActiveIndex === BEFORE_LIST_INDEX) {
        nextActiveIndex = findIndex(
          itemsToSearch,
          o => !this.isDisabledItem(o)
        )
      }

      return nextActiveIndex
    },

    selectNextListItem() {
      if (this.actionableItems.length <= 0) {
        this.activeListItem = BEFORE_LIST_INDEX
        return true
      }

      this.activeListItem = this.findIndexForNextActiveItem()
    },

    selectPreviousListItem() {
      if (this.actionableItems.length <= 0) {
        this.activeListItem = BEFORE_LIST_INDEX
        return true
      } else if (this.activeListItem === 0) {
        this.activeListItem = BEFORE_LIST_INDEX
      }

      let reversedList = [...this.matchedItems].reverse()
      let currerntReversedIndex = ((this.matchedItems.length - 1) - this.activeListItem)
      let nextReverseIndex = this.findIndexForNextActiveItem(reversedList, currerntReversedIndex)

      this.activeListItem = (this.matchedItems.length - 1) - nextReverseIndex
    }
  },
  watch: {
    // Show or hide before the `activeListItem` watcher below focuses an entry (v-show acts after it on Vue 3, before it
    // on Vue 2): a closing list must not take the focus (Enter without a v-model).
    visible: {
      flush: 'sync',
      handler(newValue) {
        this.$el.style.display = newValue ? '' : 'none'
      }
    },
    activeListItem(newValue, oldValue) {
      this.$emit('activeListItemChange')
      if (newValue >= 0) {
        const scrollContainer = this.$refs.suggestionList
        const listItem = scrollContainer.children[this.activeListItem]
        const scrollContainerlHeight = scrollContainer.clientHeight
        const listItemHeight = listItem.clientHeight
        const visibleItems = Math.floor(
          scrollContainerlHeight / (listItemHeight + 20)
        )
        if (newValue >= visibleItems) {
          scrollContainer.scrollTop = listItemHeight * this.activeListItem
        } else {
          scrollContainer.scrollTop = 0
        }
        listItem.focus()
      }
    }
  }
}
</script>
