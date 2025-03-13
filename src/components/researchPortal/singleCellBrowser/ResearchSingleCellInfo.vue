<template>
    <div v-if="data" style="height:100%; display:flex; width:100%; flex-direction:column; gap:10px; margin:0 0 10px 0;"">
        <div style="display:flex; gap:20px; background: #f8f8f8; padding: 20px;">
            <div style="display:flex; flex-direction:column; flex:1">
                <strong style="font-size:20px">{{ data["datasetName"] }}</strong>
                <em>{{ data["authors"] || '' }}</em>
                <div style="flex:1; position: relative;">
                    <div style="position: absolute; top:0; right:0; bottom:0; left:0; max-height:-webkit-fill-available; overflow:scroll; text-overflow: ellipsis; margin:10px 0 0">
                        {{ data["summary"] || '' }}
                    </div>
                </div>
            </div>
            <div style="display:flex; flex-direction: column; border-left: 1px solid #ccc; padding-left: 20px; width:25%;">
                <div class="metadata-item">
                    <div style="font-weight: bold; min-width: 100px;">Species</div>
                    <div>{{ data["species"] }}</div>
                </div>
                <div class="metadata-item">
                    <div style="font-weight: bold; min-width: 100px;">Tissue</div>
                    <div>{{ data["tissue"]}}</div>
                </div>
                <div  class="metadata-item" v-if="data['depot']">
                    <div style="font-weight: bold; min-width: 100px;">Depot</div>
                    <div>{{ data["depot"] }}</div>
                </div>
                <div  class="metadata-item" v-if="data['depot2']">
                    <div style="font-weight: bold; min-width: 100px;">Sub-Depot</div>
                    <div>{{ data["depot2"] }}</div>
                </div>
                <div  class="metadata-item" v-if="data['totalCells']">
                    <div style="font-weight: bold; min-width: 100px;">Cell Count</div>
                    <div>{{ data["totalCells"]?.toLocaleString() }}</div>
                </div>
                <div  class="metadata-item" v-if="data['method']">
                    <div style="font-weight: bold; min-width: 100px;">Method</div>
                    <div>{{ data["method"] }}</div>
                </div>
                <div  class="metadata-item" v-if="data['platform']">
                    <div style="font-weight: bold; min-width: 100px;">Platform</div>
                    <div>{{ data["platform"] }}</div>
                </div>
                <div  class="metadata-item" v-if="data['disease__ontology_label']">
                    <div style="font-weight: bold; min-width: 100px;">Disease</div>
                    <template v-if="Array.isArray(data['disease__ontology_label'])">
                        <div v-for="item in data['disease__ontology_label']">{{ item }}</div>
                    </template>
                    <template v-else>
                        <div>{{ data['disease__ontology_label'] }}</div>
                    </template>
                </div>
                <!--<div style="border-top:1px solid #ccc; margin:5px 0;"></div>-->
                <div  class="metadata-item" v-if="data['contact']">
                    <div style="font-weight: bold; min-width: 100px;">Contact</div>
                    <div style="overflow: hidden; overflow-wrap: break-word;">{{ data["contact"] }}</div>
                </div>
                <div  class="metadata-item" v-if="data['doi']">
                    <div style="font-weight: bold; min-width: 100px;">DOI</div>
                    <div style="overflow: hidden; overflow-wrap: break-word;"><a :href="data['doi']">{{ data["doi"] }}</a></div>
                </div>
                <div  class="metadata-item" v-if="data['download']">
                    <div style="font-weight: bold; min-width: 100px;">Download</div>
                    <div style="overflow: hidden; overflow-wrap: break-word;"><a :href="data['download']">click here</a></div>
                </div>
            </div>
            
        </div>
    </div>
</template>
  
<script>
import Vue from 'vue';

export default Vue.component('research-single-cell-info', {
    props: {
        data: {                           
            type: (Object, null),
            required: true,
        },
        displayDirection:{
            type: String,
            required: false,
            default: 'horizontal'
        }
    },
    data() {
        return {
            
        }
    },
    watch: {
    },
    mounted() {
    },
    computed: {
        
    },
    methods: {
    },
});
</script>

<style scoped>
.metadata-item{
    display: grid;
    grid-template-columns: 1fr 1fr;
}
</style>
  