<template>
    <div :id="`${tooltipProperty}-results-global-tooltip`">
        <h6><slot name="header"></slot></h6>
        <slot name="subheader"></slot>
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
    props: ['identifier'],
    data() {
        return {
            currentData: 'hello'
        }
    },
    computed: {
        // hyphenated properties are referenced as camel-case in the DOM
        // so appending a string onto another camel-case string must imply that it is capitalized
        formattedIdentifier() {
            const capitalize = (s) => {
                // get the first character, capitalize, concatenate it with the rest
                return s.charAt(0).toUpperCase() + s.slice(1)
            }
            // if it's neither undefined nor empty, can capitalize it
            if (!(typeof this.identifier === 'undefined' || this.identifier === '')) {
                return capitalize(this.identifier)
            }
            return '';
        },
        tooltipProperty() {
            return `globalTooltip${this.formattedIdentifier}`
        }
    },
    mounted() {
        const self = this;

        // add and remove global tooltip, if hovering on or exiting, tooltip compatible item
        window.addEventListener('mouseover', function (event) {
            if (event.target.dataset.hasOwnProperty(self.tooltipProperty)) {
                console.log('tooltip property',self.tooltipProperty)
                self.currentData = event.target.dataset[self.tooltipProperty];

                const tooltipTargetCoords = event.target.getBoundingClientRect();
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.left = (tooltipTargetCoords.x + window.scrollX + tooltipTargetCoords.width)+'px';
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.top = (tooltipTargetCoords.y + + window.scrollY + tooltipTargetCoords.height)+'px';
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.display = 'block';

            }
        })
        window.addEventListener('mouseout', function (event) {
            if (event.target.dataset.hasOwnProperty(self.tooltipProperty) && event.target.dataset[self.tooltipProperty] === self.currentData) {
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.display = 'none';
            }
        })

        // add and remove global tooltip, if hovering on or exiting the global tooltip itself
        // this is required to allow the user to hover into the tooltip, and turn it off when the user's cursor exits its boundaries
        // jQuery is used because 'document' is not a concept in vue scope (is there an alternative?)
        $(`#${self.tooltipProperty}-results-global-tooltip`).hover(
            () => {
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.display = 'block';
            },
            () => {
                document.getElementById(`${self.tooltipProperty}-results-global-tooltip`).style.display = 'none';
            }
        );

    }
})
</script>
<style scoped>
[id*=-results-global-tooltip] {
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
[id*=-results-global-tooltip]:hover {
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
