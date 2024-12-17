<template>
    <div style="height:-webkit-fill-available; display:flex">
        <!-- if selector is dropdown-->
        <div v-if="layout==='dropdown'" class="dropdown-container">
            <div class="dropdown-group">
                <div class="colorize-option on" @click="colorOption($event, selectedOption)" v-b-tooltip:hover.left="'color all labels'">
                    <svg width="1em" viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                </div>
                <template v-if="showSelect">
                    <select style="width: 100%;" @change="selectOption($event)" v-model="selectedOption">
                        <option v-for="(value, key) of data" :value="key">
                            {{ key }}
                        </option>
                    </select>
                </template>
                <template v-else>
                    <div style="font-size:16px; font-weight: bold;">{{ selectedOption }}</div>
                </template>
            </div>
            <div class="dropdown-content">
                <div class="dropdown-option" v-for="label of data[selectedOption]" :key="label">
                    <div class="colorize-option" :class="labelIsolated(coloredOption, label)" @click="colorLabel($event, label)" v-b-tooltip:hover.left.window="'isolate label'">
                        <svg width="1em" viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="colors ? colors[selectedOption][label] : '#434343'"/></svg>
                    </div>
                    <div class="option-label" :title="label" @mouseover="emitHover(label)" @mouseout="emitHover('')">{{ label }}</div>
                </div>
            </div>
        </div>

        <!-- if selector is accordion-->
        <div v-if="layout==='accordion'" class="accordion-container">
            <template v-for="(value, key) of data">
                <div class="accordion-group"
                    :class="[key===selectedOption?'selected':'',
                             key===coloredOption?'colored':'']">
                    <div class="accordion-control">
                        <div class="colorize-option" @click="colorOption($event, key)" v-b-tooltip:hover.left="'color all labels'">
                            <svg width="1em" viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                        </div>
                        <div class="select-option" @click="selectOption($event, key)">
                            <div class="option-label" :title="key">{{ key }}</div>
                            <div class="arrow">
                                <svg height="1em" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg" stroke-width="0" style="font-size: 10px;"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-content" :data-key="key">
                        <div class="label-option" v-for="label of value" :key="label">
                            <button class="colorize-option" :disabled="key!==coloredOption" :class="labelIsolated(key, label)" @click="colorLabel($event, label)" v-b-tooltip:hover.left.window="'isolate label'">
                                <svg width="1em" viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="colors && key === coloredOption ? colors[key][label] : '#434343'"/></svg>
                            </button>
                            <div class="option-label" :title="label" @mouseover="emitHover(label)" @mouseout="emitHover('')">{{ label }}</div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
  
<script>
import * as d3 from 'd3';
import Vue from 'vue';

/*
notes:
-component will fill width/height of its parent container
-if height of container cuts off component, it will scroll overflowed content
*/

/*
props examples

data: {
    "field1": ["label1", "label2", ...],
    "field2": ["label1", "label2", ...],
    ...
}

layout: "dropdown", "accordion"

colors: {
    "field1": {
        "label1": "#xxxxxx",
        "label2": "#xxxxxx",
        ...
    }
    ...
}

defaultLabel: "cell_type"
*/

export default Vue.component('research-single-cell-selector', {
    props: {
        data: {                           
            type: (Object, null),
            required: true,
        },
        layout: {
            type: String,
            required: false,
            default: 'dropdown'
        },
        showSelect:{
            type: Boolean,
            required: false,
            default: true,
        },
        colors: {
            type: Object,
            required: false
        },
        defaultLabel: {
            type: String,
            required: false,
            default: ''
        }
    },
    data() {
        return {
            selectedOption: '',
            coloredOption: '',
            coloredLabels: []
        }
    },
    watch: {
        selectedOption(){
            this.emitUpdate();
        },
        coloredOption(){
            this.emitUpdate();
        },
        coloredLabels(){
            this.emitUpdate();
        }
    },
    mounted() {
        this.init();
    },
    computed: {
        
    },
    methods: {
        init(){
            this.selectOption(null, this.defaultLabel)
            if(this.layout === "accordion"){
                this.colorOption(null, this.defaultLabel);
            }
        },
        selectOption(e, key){
            const option = key ? key : e.target.value;
            this.coloredLabels = [];
            if(this.layout === 'dropdown') {
                this.selectedOption = option;
                this.coloredOption = option;
            }else{
                this.selectedOption = this.selectedOption === option ? '' : option;
            }
        },
        colorOption(e, option){
            this.coloredOption = option;
            this.coloredLabels = [];
        },
        colorLabel(e, label){
            const el = e.target;
            if(this.coloredLabels.includes(label)){
                this.coloredLabels.splice(this.coloredLabels.indexOf(label), 1);
                el.classList.remove('on')
            }else{
                this.coloredLabels.push(label);
            }
        },
        labelIsolated(key, label){
            if(key === this.coloredOption){
                if(this.coloredLabels.length===0 || this.coloredLabels.includes(label)){
                    return 'on';
                }
            }
            return '';
            
        },
        emitUpdate(){
            this.$emit('on-update', {
                selectedField: this.selectedOption, 
                coloredField: this.coloredOption, 
                coloredLabels: this.coloredLabels
            });
        },
        emitHover(label){
            if(this.selectedOption !== this.coloredOption) return;
            this.$emit('on-hover', {
                hoveredLabel: label
            });
        }
    },
});
</script>

<style scoped>
select {
    background: white;
    font-size: 14px;
}
.dropdown-container{
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: -webkit-fill-available;
}
.dropdown-group{
    display:flex;
    gap: 5px;
}
.dropdown-content{
    display: flex;
    flex-direction: column;
    flex-grow: 1; 
    overflow-x: hidden; 
    overflow-y: auto;
}
.dropdown-option{
    display: flex;
    gap: 5px;
}

.accordion-container {
    width: -webkit-fill-available;
    flex-grow: 1; 
    overflow-x: hidden; 
    overflow-y: auto;
}
.accordion-control{
    display: flex;
    gap: 5px;
    justify-content: space-between;
}
.accordion-content{
    height: 0;
    overflow-y: hidden;
}
.accordion-group.selected{
    .accordion-content{
        height: auto;
    }
    .arrow svg{
        transform: rotate(90deg);
    }
}
button.colorize-option{
    border:0;
    background: transparent;
    padding: 0;
    display: flex;
    align-items: center;
}
.colorize-option{
    display: flex;
    cursor: pointer;
    path{
        opacity: .25;
    }
}
.colorize-option.on{
    path{
        opacity: 1;
    }
}
.colorize-option:not(.on):hover{
    path{
        opacity: .5;
    }
}
.accordion-group.colored {
    .accordion-control .colorize-option{
        path{
            opacity: 1;
        }
    }
    .accordion-content .colorize-option.on{
        path{
            opacity: 1;
        }
    }
}
.select-option{
    display:flex; 
    justify-content: space-between; 
    flex-grow: 1;
    cursor: pointer;
    max-width: calc(100% - 20px);
}
.select-option .arrow{
    width: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.label-option{
    display: flex;
    margin: 0 0 0 15px;
    gap: 5px;
}
.option-label{
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
  