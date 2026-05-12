<template>
    <div class="outer-wrapper">
        <div class="slider-label">{{ label }}</div>
        <div class="slide-container">
            <div class="sliders-control" :id="`filter_${sliderId}`">
                <input style="padding:0;" class="slider from-slider" type="range" 
                    :id="`filter_${sliderId}_from_slider`"
                    :value="sliderRange.from" 
                    :min="sliderRange.min" 
                    :max="sliderRange.max" 
                    :step="sliderRange.step"
                    @input="setSliderTip($event, `filter_${sliderId}_from`)" 
                    @change="filterDataSlider($event, field)"/>
                <input style="padding:0;" class="slider to-slider" type="range" 
                    :id="`filter_${sliderId}_to_slider`"
                    :value="sliderRange.to" 
                    :min="sliderRange.min" 
                    :max="sliderRange.max" 
                    :step="sliderRange.step"
                    @input="setSliderTip($event, `filter_${sliderId}_to`)" 
                    @change="filterDataSlider($event, field)"/>

                    <output class="range-slider-tip range-from-value" 
                    :id="`filter_${sliderId}_from`" name="rangeFromValue"
                    >{{ Math.round(sliderRange.from * 10000) / 10000 }}</output>
                    <output class="range-slider-tip range-to-value" 
                    :id="`filter_${sliderId}_to`" name="rangeToValue"
                    >{{ Math.round(sliderRange.to * 10000) / 10000 }}</output>
            </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
export default Vue.component("dual-slider", {
    props: [
        "field", "sliderId", "unfilteredDataset", "label", "rangeMin", "rangeMax"
    ],
    data() {
        return {
            sliderRange : {},
            lastFilter: {},
            filtersIndex: {},
        };
    },
    mounted(){
        this.getRange(this.field);
    },
    computed: {
    },
    methods: {
        getRange(FIELD) {
			let data = this.unfilteredDataset;
				
			if(!this.sliderRange) { this.sliderRange = {} };
			let range = { min: null, max: null, step:0, from: null, to: null };

			data.map(d=>{
				
				if(!!d[FIELD] && typeof d[FIELD] === 'number') {
					range.min = (!range.min)? d[FIELD] : (d[FIELD] < range.min)? d[FIELD] : range.min;
					range.max = (!range.max) ? d[FIELD] : (d[FIELD] > range.max) ? d[FIELD] : range.max;
				}
			})
			range.from = Math.round(range.min * 10000) / 10000;
			range.to = Math.round(range.max * 10000) / 10000;
			range.step = (range.max - range.min) / 10000;

			if(!!document.getElementById(`filter_${this.sliderId}_from`)) {
				document.getElementById(`filter_${this.sliderId}_from`).value = range.from;
			}
			if (!!document.getElementById(`filter_${this.sliderId}_to`)) {
				document.getElementById(`filter_${this.sliderId}_to`).value = range.to;
			}

			this.sliderRange = range;
		},
        setSliderTip(EVENT,ID) {
			document.getElementById(ID).value = Math.round(EVENT.target.value * 10000) / 10000;
		},
		filterDataSlider(EVENT, FIELD) {
			let searchValueFrom = document.getElementById(`filter_${this.sliderId}_from`).value
            let searchValueTo = document.getElementById(`filter_${this.sliderId}_to`).value
            this.sliderRange.from = Number(searchValueFrom);
            this.sliderRange.to = Number(searchValueTo);
            
            let searchRange = [searchValueFrom, searchValueTo];
            this.$emit("filterChanged", searchRange);
		},
    },
});
</script>
<style scoped>
/* slider UI from DK's BYOR slider*/
.slide-container {
  width: 175px;
    position: relative;
    margin: 10px;
}

.sliders-control {
    position: relative;
    min-height: 30px;
    border-top: solid 2px #cccccc;
    margin-top: 10px;
    margin-bottom: -10px;
}

.slider {
	position: absolute;
	left: 0;
	top: 0px;
  -webkit-appearance: none;
  width: 100%;
  height: 2px !important;
  background: #d3d3d300;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
  border-radius: 5px;
  z-index:1;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -10px;
  background: #666666;
  border-radius: 15px;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  margin-top: -10px;
  background: #666666;
  border-radius: 15px;
  cursor: pointer;
}

.range-slider-tip {
	position: absolute;
	top: 5px;
	font-size: 12px;
}

.range-from-value {
	left: 0;
}

.range-to-value {
	right: 0;
}
.outer-wrapper {
    display: flex;
    padding: 5px;
    background-color: #ffffff;
    border-radius: 5px;
    border: 1px solid lightgray;
}
.slider-label {
    font-weight: bold;
    margin: 5px;
}
</style>