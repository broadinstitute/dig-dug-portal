<template>
    <div ref="tooltip" class="mouse-tooltip"></div>
</template>
  
<script>
import Vue from 'vue';

/*
adds a tooltip attached to mouse cursor
tooltip will always stay within bounds of viewport
and will follow cursor until hidden.

usage: import component and add to template
<research-mouse-tooltip ref="tooltip" />

call showTooltip on your component ref and pass it some content
this.tooltip.showTooltip("some content <div> can be html </div>");

call hideTooltip to hide the tooltip
this.tooltip.hideTooltip();
*/

export default Vue.component('research-mouse-tooltip', {
    props: {
        
    },
    data() {
        return {
            tt: null,
            content: null,
            mousePos: {x: 0, y: 0},
            showing: false,
        }
    },
    watch: {
    },
    mounted() {
        this.tt = this.$refs.tooltip;
    },
    created() {
        //TODO: store mouse position in vuex 
        //so multiple components can access it and not have each create its own listener
        window.addEventListener("mousemove", this.updateMousePosition);
    },
    beforeDestroy(){
        window.removeEventListener("mousemove", this.updateMousePosition);
    },
    methods: {
        showTooltip(content){
            this.content = content;
            this.tt.innerHTML = this.content;
            this.positionToolip();
            this.tt.classList.add('show');
        },
        positionToolip(){
            const tt = this.tt;

            // get tooltip dimentions
            const tooltipWidth = tt.offsetWidth;
            const tooltipHeight = tt.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            //ideal tooltip position next to mouse
            let top = this.mousePos.y - 10;
            let left = this.mousePos.x + 10;

            // adjust to keep the tooltip inside the viewport
            if (left + tooltipWidth > viewportWidth) {
                left = this.mousePos.x - tooltipWidth - 10;
            }
            if (top + tooltipHeight > viewportHeight) {
                top = viewportHeight - tooltipHeight - 10;
            }

            // avoid moving out of the top edge
            if (top < 0) {
                top = 10; 
            }

            tt.style.top = `${top}px`;
            tt.style.left = `${left}px`;

            this.showing = true;
        },
        hideTooltip(){
            this.tt.classList.remove('show');
            this.tt.style.top = -10000 + "px";
            this.tt.style.left = -10000 + "px";
            this.showing = false;
        },
        updateMousePosition(e){
            this.mousePos = {x: e.clientX, y: e.clientY}
            if(this.showing){
                this.positionToolip();
            }
        }
    },
});
</script>

<style scoped>
.mouse-tooltip{
    position:fixed;
    top:-10000px;
    left:-10000px;
    background: white;
    padding: 5px 10px;
    box-shadow: rgba(0, 0, 0, 0.5) -4px 9px 25px -6px;
    z-index: 5000;
}
.mouse-tooltip.show{
    opacity: 1;
}
</style>
  