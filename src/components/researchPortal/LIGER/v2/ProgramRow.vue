<script>
import Vue from "vue";

// One gene program, as a two-line row in the programs list.
//
// Two lines is the hard constraint: the label on the first, the expression bar and
// the numbers on the second. Everything that used to make this a card is gone --
// the program ID (the label already identifies it), the separate specificity track,
// and the decorative accent color.
//
// Specificity is now carried entirely by the arrow in the left gutter: blue for
// positive, red for negative, its magnitude printed on the second line. That is the
// same information the second bar showed, in a gutter that was already there.
export default Vue.component("ProgramRow", {
    props: {
        // one item from buildProgramItems()
        program: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        },
        // true while some other row is hovered, so unrelated rows recede with their
        // edges instead of staying at full strength
        dimmed: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        // null when the API reports no specificity for the row, which is a third
        // state -- not "zero". It renders neutral and armless rather than picking a
        // direction we do not have.
        direction() {
            return this.program.specDirection;
        },

        arrow() {
            if (!this.direction) {
                return "–";
            }

            return this.direction === "up" ? "▲" : "▼";
        }
    }
});
</script>

<template>
    <div
        class="program-row"
        :class="[direction ? 'dir-' + direction : 'dir-none', { selected, muted: program.muted, dimmed }]"
        @click="$emit('select', program)"
        @mouseenter="$emit('hover', program)"
        @mouseleave="$emit('hover', null)"
    >
        <!-- Left gutter: direction of specificity against the parent cell type. -->
        <div class="gutter" :title="program.hasSpec ? 'Specificity ' + program.specText : 'Specificity not reported'">
            {{ arrow }}
        </div>

        <div class="row-body">
            <div class="row-label" :title="program.label">{{ program.label }}</div>

            <div class="row-metrics">
                <div class="track">
                    <div
                        class="fill"
                        :class="{ ['overflow-' + program.expressionOverflow]: !!program.expressionOverflow }"
                        :style="{ width: program.expressionWidth }"
                    ></div>
                </div>
                <div class="value expression" :title="'log10_cpk ' + program.absRawText">{{ program.absText }}</div>
                <div class="value spec">{{ program.specText }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* The gutter width, the gaps and the two value-column widths come from the panel as
   custom properties, because the list header draws EXP / SPEC headings over those
   same columns. Two copies of these numbers would drift and the headings would stop
   lining up with the values. */
.program-row{
    display: grid;
    grid-template-columns: var(--ce-row-gutter, 22px) 1fr;
    align-items: center;
    gap: var(--ce-row-gutter-gap, 6px);
    /* Fixed, and shared with the canvas layout math: the edge anchors are computed
       from this height rather than measured, so a row that grew would point every
       line at the wrong place. `--ce-row-height` is set from the one JS constant. */
    height: var(--ce-row-height, 46px);
    padding: 0 var(--ce-row-pad, 10px);
    border-top: 1px solid var(--ce-line);
    cursor: pointer;
    transition: opacity .12s ease;
}
.program-row:first-child{
    border-top: none;
}
.program-row:hover{
    background: var(--ce-sunken);
}
.program-row.selected{
    background: var(--ce-accent-soft);
    box-shadow: inset 2px 0 0 var(--ce-accent);
}
/* A program whose p-value fails the threshold is dimmed rather than hidden -- it is
   still a real row. Rows with no p-value at all are NOT dimmed: missing is not the
   same as non-significant. */
.program-row.muted{
    opacity: .55;
}
/* Something else is hovered. Separate from `.muted`, which is about the data. */
.program-row.dimmed{
    opacity: .3;
}

/* Blue up / red down, so the gutter is the whole specificity encoding. */
.dir-up{ --dir-color: #2f5bea; }
.dir-down{ --dir-color: #d92d20; }
.dir-none{ --dir-color: var(--ce-line); }

.gutter{
    font-size: 9px;
    line-height: 1;
    text-align: center;
    color: var(--dir-color);
    cursor: help;
}

.row-body{
    min-width: 0;
}
.row-label{
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--ce-ink);
    /* Line one, and only one -- program labels run long and the row height is the
       point of this layout. The full label is on the title attribute. */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.row-metrics{
    display: grid;
    grid-template-columns: 1fr var(--ce-col-exp, 38px) var(--ce-col-spec, 42px);
    align-items: center;
    gap: var(--ce-col-gap, 7px);
    margin-top: 3px;
}
.track{
    position: relative;
    height: 5px;
    border-radius: 3px;
    background: var(--ce-sunken);
    overflow: hidden;
}
.program-row:hover .track{
    background: #e6ecee;
}
.fill{
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    /* The expression bar is not the specificity color: it is a magnitude with a true
       zero, and tinting it by the sign of a different metric would read as though
       the bar itself were signed. */
    background: var(--ce-accent);
}
/* A clamped value gets a squared-off edge rather than being silently squashed. */
.fill.overflow-high{
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}
.value{
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
}
.value.expression{
    color: var(--ce-ink);
    cursor: help;
}
.value.spec{
    color: var(--dir-color);
    font-weight: 700;
}
.dir-none .value.spec{
    color: var(--ce-muted);
    font-weight: 400;
}
</style>
