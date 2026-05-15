<template>
    <div class="outer-wrapper">
        <div class="slide-container">
            <div class="sliders-control" :id="`filter_${safeSliderId}`" v-if="ready">
                <input style="padding:0;" class="slider from-slider" type="range" 
                    :id="`filter_${safeSliderId}_from_slider`"
                    :value="sliderRange.from" 
                    :min="sliderRange.min" 
                    :max="sliderRange.max" 
                    :step="sliderRange.step"
                    @input="setSliderTip($event, `filter_${safeSliderId}_from`,true)" 
                    @change="filterDataSlider($event)"/>
                <input style="padding:0;" class="slider to-slider" type="range" 
                    :id="`filter_${safeSliderId}_to_slider`"
                    :value="sliderRange.to" 
                    :min="sliderRange.min" 
                    :max="sliderRange.max" 
                    :step="sliderRange.step"
                    @input="setSliderTip($event, `filter_${safeSliderId}_to`,false)" 
                    @change="filterDataSlider($event)"/>

                    <output class="range-slider-tip range-from-value" 
                    :id="`filter_${safeSliderId}_from`" name="rangeFromValue"
                    >{{ Math.round(sliderRange.from * 10000) / 10000 }}</output>
                    <output class="range-slider-tip range-to-value" 
                    :id="`filter_${safeSliderId}_to`" name="rangeToValue"
                    >{{ Math.round(sliderRange.to * 10000) / 10000 }}</output>
            </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
export default Vue.component("dual-slider", {
    props: [
        "sliderId", "rangeMin", "rangeMax", "presetMin", "presetMax"
    ],
    data() {
        return {
            safeSliderId: this.sliderId.replaceAll(" ", "_"),
            sliderRange : {
                min: this.rangeMin,
                max: this.rangeMax,
                from: this.presetMin !== null ? Math.round(this.presetMin * 10000) / 10000
                    : Math.round(this.rangeMin * 10000) / 10000,
                to: this.presetMax !== null ? Math.round(this.presetMax * 10000) / 10000
                    : Math.round(this.rangeMax * 10000) / 10000,
                step: (this.rangeMax - this.rangeMin) / 10000
            },
            lastFilter: {},
            filtersIndex: {},
            ready: false
        };
    },
    mounted(){
        this.getRange();
    },
    computed: {
    },
    methods: {
        getRange() {
			if(!!document.getElementById(`filter_${this.safeSliderId}_from`)) {
				document.getElementById(`filter_${this.safeSliderId}_from`).value = range.from;
			}
			if (!!document.getElementById(`filter_${this.safeSliderId}_to`)) {
				document.getElementById(`filter_${this.safeSliderId}_to`).value = range.to;
			}
            this.ready = true;
		},
        setSliderTip(EVENT,ID,isFrom) {
            let newValue = EVENT.target.value;
            let element = document.getElementById(ID);
            let valid = this.validRange(isFrom, newValue);
            console.log(valid);
            if (!valid){
                // If you've slid too far, snap back until the sliders are the same
                newValue = isFrom ? this.sliderRange.to : this.sliderRange.from;
            }
            element.value = Math.round(newValue * 10000) / 10000;
			
		},
        validRange(isFrom, value){
            let currentFrom = this.sliderRange.from;
            let currentTo = this.sliderRange.to;
            if (isFrom){
                return Number(value) <= currentTo;
            }
            return Number(value) >= currentFrom;
        },
		filterDataSlider(EVENT) {
			let searchValueFrom = document.getElementById(`filter_${this.safeSliderId}_from`).value
            let searchValueTo = document.getElementById(`filter_${this.safeSliderId}_to`).value
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
    /*width: 100%;*/
    min-width: 175px;
    position: relative;
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
  width: 175px !important;
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
  border-radius: 15px;
  cursor: pointer;
}


.slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 15px;
  cursor: pointer;
}

.from-slider::-moz-range-thumb, .from-slider::-webkit-slider-thumb {
  width: 6px !important;
  height: 6px !important;
  background: #333333;
  border: 1px solid black;
  
}
.to-slider::-moz-range-thumb, .to-slider::-webkit-slider-thumb  {
  width: 12px !important;
  height: 12px !important;
  background: #999999;
  border: 1px solid black;
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
    display: inline-block !important;
    padding: 5px;
    background-color: #ffffff;
    border-radius: 5px;
    border: 1px solid lightgray;
}
</style>