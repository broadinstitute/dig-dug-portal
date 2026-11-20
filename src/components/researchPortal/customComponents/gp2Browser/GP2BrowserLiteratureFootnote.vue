<template>
    <sup class="gp2-lit-footnote">
        <template v-for="(number, index) in numbers">
            <span :key="`wrap-${number}`" class="gp2-lit-footnote-wrap">
                <a
                    :ref="`ref${number}`"
                    href="#"
                    class="gp2-lit-footnote-ref"
                    :class="{ 'gp2-lit-footnote-ref-active': activeNumber === number }"
                    @click.stop.prevent="toggle(number)"
                    @mouseenter="onEnter(number)"
                    @mouseleave="onLeave(number)"
                    >{{ number }}</a
                ><span v-if="index < numbers.length - 1">,</span>
                <div
                    v-if="activeNumber === number && excerptsByNumber[number]"
                    class="gp2-lit-footnote-popover"
                    :style="popoverStyle"
                    @click.stop
                    @mouseenter="onEnter(number)"
                    @mouseleave="onLeave(number)"
                >
                    <blockquote class="gp2-lit-footnote-popover-quote">
                        &ldquo;{{ excerptsByNumber[number].quote }}&rdquo;
                    </blockquote>
                    <div class="gp2-lit-footnote-popover-meta">
                        <a
                            class="gp2-lit-footnote-popover-title"
                            :href="`https://pubmed.ncbi.nlm.nih.gov/${excerptsByNumber[number].pmid}/`"
                            target="_blank"
                            rel="noopener noreferrer"
                            @click.stop
                        >
                            {{ excerptsByNumber[number].title || `PMID ${excerptsByNumber[number].pmid}` }}
                        </a>
                        <div class="gp2-lit-footnote-popover-sub">
                            PMID: {{ excerptsByNumber[number].pmid
                            }}<span v-if="excerptsByNumber[number].journal">
                                · {{ excerptsByNumber[number].journal }}</span
                            ><span v-if="excerptsByNumber[number].pubdate">
                                · {{ excerptsByNumber[number].pubdate }}</span
                            >
                        </div>
                        <div
                            v-if="excerptsByNumber[number].authors.length"
                            class="gp2-lit-footnote-popover-sub"
                        >
                            {{ excerptsByNumber[number].authors.join(", ") }}
                        </div>
                    </div>
                    <div v-if="excerptsByNumber[number].abstract" class="gp2-lit-footnote-popover-abstract">
                        <span
                            class="gp2-lit-footnote-popover-abstract-text"
                            v-html="highlightedAbstractHtml(number)"
                        />
                        <button
                            v-if="excerptsByNumber[number].abstract.length > abstractExcerptLength"
                            type="button"
                            class="gp2-lit-footnote-popover-toggle"
                            @click.stop="toggleAbstract(number)"
                        >
                            {{ isExpanded(number) ? "Show less" : "Read full abstract" }}
                        </button>
                    </div>
                </div>
            </span>
        </template>
    </sup>
</template>

<script>
import { formatAbstractWithHighlightedQuote } from "./gp2BrowserLiteratureEvidence.js";

export default {
    name: "GP2BrowserLiteratureFootnote",
    props: {
        numbers: {
            type: Array,
            default: () => [],
        },
        /** Map of excerpt number -> { quote, pmid, title, journal, pubdate, authors, abstract }. */
        excerptsByNumber: {
            type: Object,
            default: () => ({}),
        },
        /** Popover width in px — matched by the panel to its claims/gaps column width. */
        popoverWidth: {
            type: Number,
            default: null,
        },
    },
    data() {
        return {
            hovered: null,
            pinned: null,
            popoverStyle: {},
            abstractExcerptLength: 220,
            expandedNumbers: {},
        };
    },
    computed: {
        activeNumber() {
            return this.pinned != null ? this.pinned : this.hovered;
        },
    },
    mounted() {
        document.addEventListener("click", this.onDocumentClick);
        this.scrollParent = this.findScrollParent(this.$el);
        if (this.scrollParent) {
            this.scrollParent.addEventListener("scroll", this.onScroll, { passive: true });
        }
    },
    beforeDestroy() {
        document.removeEventListener("click", this.onDocumentClick);
        if (this.scrollParent) {
            this.scrollParent.removeEventListener("scroll", this.onScroll);
        }
    },
    methods: {
        onEnter(number) {
            this.hovered = number;
            this.positionPopover(number);
        },
        onLeave(number) {
            if (this.hovered === number) {
                this.hovered = null;
            }
        },
        toggle(number) {
            if (this.pinned === number) {
                this.pinned = null;
                return;
            }
            this.pinned = number;
            this.positionPopover(number);
        },
        /** A click anywhere outside this footnote's own links/popover unpins it. */
        onDocumentClick() {
            this.pinned = null;
        },
        /** Scrolling the panel disconnects a fixed-position popover from its trigger — just close it. */
        onScroll() {
            this.hovered = null;
            this.pinned = null;
        },
        findScrollParent(el) {
            let node = el && el.parentElement;
            while (node) {
                const style = window.getComputedStyle(node);
                if (/(auto|scroll)/.test(style.overflowY)) {
                    return node;
                }
                node = node.parentElement;
            }
            return null;
        },
        /**
         * Fixed positioning (viewport-relative, computed from the trigger's
         * bounding rect) so the popover escapes the modal body's own
         * `overflow: auto` instead of being clipped by it; flips to opening
         * upward when there isn't enough room below.
         */
        positionPopover(number) {
            const ref = this.$refs[`ref${number}`];
            const anchor = Array.isArray(ref) ? ref[0] : ref;
            if (!anchor) {
                return;
            }
            const rect = anchor.getBoundingClientRect();
            const width = this.popoverWidth || 280;
            let left = rect.left;
            const maxLeft = window.innerWidth - width - 12;
            if (left > maxLeft) {
                left = Math.max(12, maxLeft);
            }
            const style = { position: "fixed", left: `${left}px`, width: `${width}px` };
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const spaceAbove = rect.top - 8;
            // Open downward unless there's meaningfully more room above —
            // either way, cap height to whichever side was picked so the
            // popover scrolls internally instead of running off the
            // viewport (content varies a lot once the abstract is shown).
            if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
                style.top = `${rect.bottom + 4}px`;
                style.maxHeight = `${Math.max(120, Math.min(420, spaceBelow))}px`;
            } else {
                style.bottom = `${window.innerHeight - rect.top + 4}px`;
                style.maxHeight = `${Math.max(120, Math.min(420, spaceAbove))}px`;
            }
            this.popoverStyle = style;
        },
        isExpanded(number) {
            return Boolean(this.expandedNumbers[number]);
        },
        toggleAbstract(number) {
            this.expandedNumbers = {
                ...this.expandedNumbers,
                [number]: !this.expandedNumbers[number],
            };
        },
        highlightedAbstractHtml(number) {
            const entry = this.excerptsByNumber[number] || {};
            const expanded = this.isExpanded(number);
            const { html } = formatAbstractWithHighlightedQuote(entry.abstract, entry.quote, {
                maxLength: expanded ? null : this.abstractExcerptLength,
                markClass: "gp2-lit-abstract-mark",
            });
            return html;
        },
    },
};
</script>

<style scoped>
.gp2-lit-footnote {
    white-space: nowrap;
}

.gp2-lit-footnote-wrap {
    display: inline-block;
}

.gp2-lit-footnote-ref {
    color: var(--cfde-blue, #2c5c97);
    text-decoration: none;
    font-weight: 700;
}

.gp2-lit-footnote-ref:hover,
.gp2-lit-footnote-ref-active {
    text-decoration: underline;
}

.gp2-lit-footnote-popover {
    /* The popover is nested inside a <sup>, whose Bootstrap Reboot style
       (font-size: 75%; line-height: 0 — meant to keep a footnote marker from
       stretching its paragraph's line height) would otherwise cascade into
       all of the popover's own text, collapsing every line to zero height
       and overlapping them. Reset both back to normal here. */
    font-size: 13px;
    line-height: 1.5;
    z-index: 30;
    max-height: min(420px, 70vh);
    overflow-y: auto;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 6px 20px rgba(20, 22, 30, 0.18);
    white-space: normal;
    text-align: left;
    cursor: text;
    user-select: text;
}

.gp2-lit-footnote-popover-quote {
    margin: 0 0 6px;
    padding: 0;
    border: none;
    font-size: 13px;
    line-height: 1.5;
    font-style: italic;
    font-weight: 400;
    color: var(--cfde-ink, #33363d);
    white-space: normal;
}

.gp2-lit-footnote-popover-meta {
    /* flex column, not relying on block/inline flow, so the title and the
       PMID/journal/authors lines can never render on top of each other
       regardless of anything inherited from the surrounding claim text. */
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    white-space: normal;
}

.gp2-lit-footnote-popover-title {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    text-decoration: none;
    white-space: normal;
}

.gp2-lit-footnote-popover-title:hover {
    text-decoration: underline;
}

.gp2-lit-footnote-popover-sub {
    color: var(--cfde-muted, #6b6b6b);
    font-weight: 400;
    white-space: normal;
}

.gp2-lit-footnote-popover-abstract {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
    white-space: pre-line;
}

.gp2-lit-footnote-popover-abstract-text >>> .gp2-lit-abstract-mark {
    padding: 0 2px;
    border-radius: 3px;
    background: #ffe08a;
    color: inherit;
    font-style: normal;
    font-weight: 600;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
}

.gp2-lit-footnote-popover-toggle {
    display: inline;
    margin-left: 4px;
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
    text-decoration: underline;
}
</style>
