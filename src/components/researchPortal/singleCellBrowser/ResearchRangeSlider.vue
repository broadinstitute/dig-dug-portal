<template>
    <div class="range-slider">
        <div class="range-readout">
            <span>{{ format(low) }}</span>
            <span class="range-readout-sep">&ndash;</span>
            <span>{{ format(high) }}</span>
            <span v-if="!atFullExtent" class="range-reset" title="Reset to the full range"
                @click="reset()">reset</span>
        </div>

        <!--
            two range inputs stacked on one track. there is no native two-thumb control, and
            this is the way to get one without a dependency: the inputs are transparent and
            pointer-events:none, and only the thumbs take pointer events, so each thumb stays
            independently grabbable even though the inputs overlap completely.
        -->
        <div class="range-track-area">
            <div class="range-track"></div>
            <div class="range-track-fill" :style="fillStyle"></div>
            <input
                type="range"
                class="range-input"
                :min="min"
                :max="max"
                :step="step"
                :value="low"
                @input="onInput('low', $event)"
                @change="commit()"
            />
            <input
                type="range"
                class="range-input"
                :min="min"
                :max="max"
                :step="step"
                :value="high"
                @input="onInput('high', $event)"
                @change="commit()"
            />
        </div>

        <div class="range-extent">
            <span>{{ format(min) }}</span>
            <span>{{ format(max) }}</span>
        </div>
    </div>
</template>

<script>
    import Vue from "vue";

    export default Vue.component('research-range-slider', {
        props: {
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            step: { type: Number, default: 1 },
            decimals: { type: Number, default: 0 },
            //[low, high]. null or an incomplete pair means the full extent
            value: { type: Array, default: null },
        },
        data() {
            return {
                low: this.min,
                high: this.max,
            };
        },
        computed: {
            span() {
                //guard the divisor: min === max would make every percentage NaN, and the
                //parent is not obliged to have screened for it
                return (this.max - this.min) || 1;
            },
            fillStyle() {
                const left = ((this.low - this.min) / this.span) * 100;
                const right = ((this.high - this.min) / this.span) * 100;
                return { left: `${left}%`, width: `${Math.max(0, right - left)}%` };
            },
            atFullExtent() {
                return this.low <= this.min && this.high >= this.max;
            },
        },
        watch: {
            //the parent owns the value; mirror it whenever it changes underneath us (a
            //Clear, a dataset switch, another filter being removed)
            value: {
                immediate: true,
                handler() {
                    this.syncFromValue();
                },
            },
            min() { this.syncFromValue(); },
            max() { this.syncFromValue(); },
        },
        methods: {
            syncFromValue() {
                const [low, high] = Array.isArray(this.value) ? this.value : [];
                this.low = this.clamp(Number.isFinite(low) ? low : this.min);
                this.high = this.clamp(Number.isFinite(high) ? high : this.max);
                if (this.low > this.high) {
                    this.low = this.min;
                    this.high = this.max;
                }
            },
            clamp(value) {
                return Math.min(this.max, Math.max(this.min, value));
            },
            format(value) {
                return Number(value).toFixed(this.decimals);
            },
            onInput(which, event) {
                const raw = this.clamp(Number(event.target.value));
                //the thumbs must not cross. clamping against the other thumb rather than
                //swapping them keeps a drag from inverting the range mid-gesture
                const next = which === 'low'
                    ? Math.min(raw, this.high)
                    : Math.max(raw, this.low);

                this[which] = next;
                /*
                    if the clamp changed the value, the prop bound to this input is already
                    `next` and Vue sees no change to re-render - so the DOM would keep the
                    raw value the user dragged to and the thumb would sit past the other
                    one. push it back by hand.
                */
                if (Number(event.target.value) !== next) {
                    event.target.value = next;
                }

                //live feedback only. the parent must not rebuild the filter on this: a mask
                //rebuild plus a full re-aggregation per pixel of drag is seconds of work at
                //1.5M cells. the commit happens on change (pointer release)
                this.$emit('input', [this.low, this.high]);
            },
            commit() {
                this.$emit('change', [this.low, this.high]);
            },
            reset() {
                this.low = this.min;
                this.high = this.max;
                this.$emit('input', [this.low, this.high]);
                this.commit();
            },
        },
    });
</script>

<style scoped>
.range-slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 0;
    min-width: 220px;
}

.range-readout {
    display: flex;
    gap: 4px;
    align-items: baseline;
    font-size: 12px;
    font-weight: bold;
}
.range-readout-sep {
    opacity: 0.5;
    font-weight: normal;
}
.range-reset {
    margin-left: auto;
    font-size: 11px;
    font-weight: normal;
    opacity: 0.6;
    cursor: pointer;
    text-decoration: underline;
}
.range-reset:hover {
    opacity: 1;
}

.range-track-area {
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
}

.range-track,
.range-track-fill {
    position: absolute;
    height: 4px;
    border-radius: 2px;
    pointer-events: none;
}
.range-track {
    left: 0;
    right: 0;
    background: #ddd;
}
.range-track-fill {
    background: #7aa7d0;
}

/*
    the inputs sit on top of the track, invisible. pointer-events:none on the input with
    pointer-events:auto on the thumb is what makes two overlapping sliders usable - without
    it the input drawn last would swallow every click and the other thumb would be dead.
*/
.range-input {
    position: absolute;
    left: 0;
    width: 100%;
    margin: 0;
    height: 20px;
    background: none;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
}
.range-input:focus {
    outline: none;
}

.range-input::-webkit-slider-thumb {
    pointer-events: auto;
    -webkit-appearance: none;
    appearance: none;
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #7f7f7f;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .3);
    cursor: pointer;
}
.range-input::-moz-range-thumb {
    pointer-events: auto;
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #7f7f7f;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .3);
    cursor: pointer;
}
.range-input::-moz-range-track {
    background: none;
    border: none;
}

.range-extent {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    opacity: 0.5;
}
</style>
