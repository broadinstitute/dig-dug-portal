<script>
import Vue from "vue";
import InfoTip from "./InfoTip.vue";

// One gene program, as a two-line row in the programs list.
//
// Two lines is the hard constraint: the label on the first, the factor QC verdict on
// the second. Everything that used to make this a card is gone -- the program ID (the
// label already identifies it), the separate specificity track, and the decorative
// accent color.
//
// **Expression is not on this row.** The 10/02 call asked for it to come off: the
// expression data is far less validated than the structure it sits next to, and it
// barely varies between programs, so leading with it gave a weak signal the strongest
// position. The canvas foregrounds which programs the gene is in and which cell states
// they lead to; expression and specificity are in the detail card.
//
// Specificity survives only as the gutter: the arrow for its direction, the value
// under it, both explained by one tooltip on the gutter itself.
export default Vue.component("ProgramRow", {
    components: {
        InfoTip
    },

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
        },

        // The whole specificity explanation, on the one element that now carries it.
        // The denominator is named because it DIFFERS BY CARD -- cell types measure
        // against the other cell types in the tissue, programs against the parent
        // cell type -- and a generic "specificity" string is how those two come to
        // disagree with the data.
        specificityText() {
            if (!this.program.hasSpec) {
                return "Not reported for this program. That is a third case, not a zero,"
                    + " which is why the arrow is grey rather than pointing.";
            }

            let sign = this.direction === "up" ? "more" : "less";

            return `${this.program.specText} log₂ fold change.\n`
                + `How specific the gene's expression is to this program, measured against the`
                + ` rest of the parent cell type — this program expresses it ${sign} than the`
                + ` cell type as a whole.\n`
                + `Field: log2fc_weighted_vs_all_parent. It is a fold change, not a p-value.`;
        },

        // Display only. The verdict filters nothing -- what several of its inputs
        // mean is still an open question with the pipeline owner.
        verdictText() {
            if (!this.program.verdictLabel) {
                return "No factor QC report covers this program. That is not a failed check —"
                    + " the report simply has no row for this factor.";
            }

            let flags = (this.program.qcFlags || [])
                .map((flag) => flag.label + (flag.detail ? ` (${flag.detail})` : ""));

            return `${this.program.verdictLabel}.\n`
                + (flags.length ? `${flags.join("\n")}\n` : "")
                + "Open the program for the full report.";
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
        <!-- Left gutter: specificity, entirely. Direction as the arrow, magnitude
             under it, one tooltip over both. -->
        <info-tip class="gutter" display="block" title="Specificity" :text="specificityText">
            <div class="gutter-inner">
                <div class="gutter-arrow">{{ arrow }}</div>
                <div class="gutter-value">{{ program.specText }}</div>
            </div>
        </info-tip>

        <div class="row-body">
            <!-- Reveals a label too long for one line. Not `cursor: help` -- the row
                 is clickable and this is not an explanation. -->
            <info-tip class="row-label" display="block" cursor="inherit" :text="program.label">
                <span class="row-label-text">{{ program.label }}</span>
            </info-tip>

            <!-- Where the expression bar used to be. -->
            <div class="row-metrics">
                <info-tip title="Factor QC" :text="verdictText">
                    <span
                        class="verdict"
                        :class="'tone-' + (program.verdictLabel ? program.verdictTone : 'none')"
                    >{{ program.verdictLabel || "No QC report" }}</span>
                </info-tip>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* The gutter width and gap come from the panel as custom properties, because the
   canvas layout math and the list header share this geometry. Two copies of these
   numbers would drift. */
.program-row{
    display: grid;
    grid-template-columns: var(--ce-row-gutter, 34px) 1fr;
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
/* Dimming means "this is what the filter would remove" -- a program with no loading
   for the searched gene. On the canvas that only ever shows with `Loading > 0 only`
   off; in the card's lists, which never filter, it is how the two groups are told
   apart.

   Not the p-value (what it tests is still an open question) and not the QC verdict,
   which is reported as a pill on the row instead. A program whose loading request
   FAILED is not dimmed: missing is not absent. */
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
    color: var(--dir-color);
    line-height: 1;
}
.gutter-inner{
    width: 100%;
    text-align: center;
}
.gutter-arrow{
    font-size: 9px;
}
.gutter-value{
    margin-top: 2px;
    font-size: 9px;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
}
.dir-none .gutter-value{
    color: var(--ce-muted);
    font-weight: 400;
}

.row-body{
    min-width: 0;
}
.row-label{
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--ce-ink);
}
/* Line one, and only one -- program labels run long and the row height is the point
   of this layout. The full label is in the tooltip. The clipping is on this inner
   span rather than the InfoTip trigger, so the trigger still measures the full row
   width as a hover target. */
.row-label-text{
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.row-metrics{
    margin-top: 3px;
    line-height: 1;
}
/* Stated as a phrase, not encoded as a dot: this is the one quality signal on the
   row and a colored dot alone would need a legend to read. The color reinforces the
   word rather than replacing it. */
.verdict{
    display: inline-block;
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .02em;
}
.verdict.tone-ok{
    background: #e7f4ed;
    color: #1f6b47;
}
.verdict.tone-warn{
    background: #fdf1d6;
    color: #8a6100;
}
/* No report for this factor. Deliberately not styled as a pass or a failure -- it is
   the absence of a result. */
.verdict.tone-none{
    background: var(--ce-sunken);
    color: var(--ce-muted);
    font-weight: 400;
}
</style>
