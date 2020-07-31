<template>
    <div id="results-global-tooltip">
        <slot v-bind:currentData="currentData">
            <p>
                {{ currentData }}
            </p>
        </slot>
    </div>
</template>
<script>
import Vue from "vue"
import $ from "jquery"

export default Vue.component('results-global-tooltip', {
    data() {
        return {
            currentData: 'hello'
        }
    },
    mounted() {
        const self = this;

        // add and remove global tooltip, if hovering on or exiting, tooltip compatible item
        window.addEventListener('mouseover', function (event) {
            if (event.target.dataset.hasOwnProperty('globalTooltip')) {
                self.currentData = event.target.dataset.globalTooltip;

                const tooltipTargetCoords = event.target.getBoundingClientRect();
                // console.log(tooltipTargetCoords)
                // console.log(event.target.offsetTop, document.getElementById('results-global-tooltip').offsetTop )
                document.getElementById('results-global-tooltip').style.left = (tooltipTargetCoords.x + window.scrollX + tooltipTargetCoords.width)+'px';
                document.getElementById('results-global-tooltip').style.top = (tooltipTargetCoords.y + + window.scrollY + tooltipTargetCoords.height)+'px';
                document.getElementById('results-global-tooltip').style.display = 'block';

            }
        })
        window.addEventListener('mouseout', function (event) {
            if (event.target.dataset.hasOwnProperty('globalTooltip') && event.target.dataset.globalTooltip === self.currentData) {
                document.getElementById('results-global-tooltip').style.display = 'none';
            }
        })

        // add and remove global tooltip, if hovering on or exiting, global tooltip itself
        $("#results-global-tooltip").hover(
            () => {
                document.getElementById('results-global-tooltip').style.display = 'block';
            },
            () => {
                document.getElementById('results-global-tooltip').style.display = 'none';
            }
        );

    }
})
</script>
<style scoped>
#results-global-tooltip {
    min-width:200px;
    /*max-width:400px;*/
    top:40px;
    left:50%;
    transform:translate(-50%, 0);
    padding:20px;
    color:#666666;
    background-color:#EEEEEE;
    font-weight:normal;
    font-size:13px;
    border-radius:8px;
    position:absolute;
    z-index:99999999;
    box-sizing:border-box;
    box-shadow:0 1px 8px rgba(0,0,0,0.5);
    display:none;
}
#results-global-tooltip:hover {
    display: block;
}
.results-global-tooltip-default {
    min-width:200px;
    /*max-width:400px;*/
    top:40px;
    left:50%;
    transform:translate(-50%, 0);
    padding:20px;
    color:#666666;
    background-color:#EEEEEE;
    font-weight:normal;
    font-size:13px;
    border-radius:8px;
    position:absolute;
    z-index:99999999;
    box-sizing:border-box;
    box-shadow:0 1px 8px rgba(0,0,0,0.5);
    display:none;
}

.tooltip {
    display:inline-block;
    position:relative;
    border-bottom:1px dotted #666;
    text-align:left;
}

.tooltip h3 {margin:12px 0;}

.tooltip .bottom {
    min-width:200px;
    /*max-width:400px;*/
    top:40px;
    left:50%;
    transform:translate(-50%, 0);
    padding:20px;
    color:#666666;
    background-color:#EEEEEE;
    font-weight:normal;
    font-size:13px;
    border-radius:8px;
    position:absolute;
    z-index:99999999;
    box-sizing:border-box;
    box-shadow:0 1px 8px rgba(0,0,0,0.5);
    display:none;
}

.tooltip:hover .bottom {
    display:block;
}

.tooltip .bottom img {
    width:400px;
}

.tooltip .bottom i {
    position:absolute;
    bottom:100%;
    left:50%;
    margin-left:-12px;
    width:24px;
    height:12px;
    overflow:hidden;
}

.tooltip .bottom i::after {
    content:'';
    position:absolute;
    width:12px;
    height:12px;
    left:50%;
    transform:translate(-50%,50%) rotate(45deg);
    background-color:#EEEEEE;
    box-shadow:0 1px 8px rgba(0,0,0,0.5);
}



</style>
