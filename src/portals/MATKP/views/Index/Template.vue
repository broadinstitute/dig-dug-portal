<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav glass></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <template>
                    <!-- HERO -->
                    <matkp-hero></matkp-hero>
                    <!-- CONTENT -->
                    <div class="content-wrap">
                        <div class="f-row align-h-center" style="gap:50px; margin:40px 0 0 0">
                            <div class="f-col" style="width:300px;font-size:14px;gap:20px;text-align: justify;">
                                <div style="font-size: 18px;line-height: 40px;font-weight: bold;">Where is adipose tissue found?</div>
                                <div>Adipose tissue is found throughout the body in different depots. While many depots have orthologs across all mammals, there are also some important species-specific differences in depot size, type, and location.</div>
                                <div>Depots can be classified in several ways. Many authors emphasize a distinction between subcutaneous (under the skin and outside of the major body cavities) vs. visceral depots (which includes fat in the peritoneal and thoracic cavities). A large amount of mammalian adipose tissue falls within one of these categories, but not all. As one example, fat in the bone marrow cannot be classified as subcutaneous or visceral. Depots can also be classified by their content of thermogenic adipocytes, identified as “white” or “brown”. Here again, many depots contain a mixture of brown and white adipocytes, which may vary even within the same depot, depending on the ambient temperature. </div>
                                <!--
                                <span style="font-size:16px">Adipose tissue is a heterogeneous organ found in depots throughout the body.</span>

                                Explore the depots for an explanation of their utility and function, find datasets for that depot, then drill down deeper with our Cell Browser for more.
                                -->
                            </div>
                            <div class="f-col" style="gap:10px">
                                <div class="f-row" style="gap:50px">
                                    <div class="f-col" style="gap:20px">
                                        <div :style="`width:${$parent.anatomyWidth}px`">
                                            <select @change="$parent.selectSpecies">
                                                <option value="Homo sapien" selected>Human</option>
                                                <option value="Mus musculus">Mouse</option>
                                            </select>
                                        </div>
                                        <div class="f-col anatomy" style="gap:10px">
                                            <div class="anatomy-item" :style="`width:${$parent.anatomyWidth}px`">
                                                <div class="anatomy-points" style="position:absolute; width:100%; height:100%; z-index: 1;">
                                                    <template v-for="depot in $parent.depots[$parent.selectedSpecies]">
                                                        <div v-if="depot.pos.length>0 && depot.pos[0].length===2" v-for="point in depot.pos" class="depot-point on" :data-depot="`${depot.ontology}`" :data-category="depot.category" style="position:absolute; width:15px; height:15px; transform:translate(-10%,-10%); border-radius: 50%; background:gold" :style="`left:${point[0]*$parent.anatomyImages[$parent.selectedSpecies].scale}px; top:${point[1]*$parent.anatomyImages[$parent.selectedSpecies].scale}px`"></div>
                                                    </template>
                                                </div>
                                                <div>
                                                    <div style="width: 50%;overflow: hidden;right: 0;">
                                                        <img :style="`width:${$parent.anatomyWidth}px`" :src="$parent.anatomyImages[$parent.selectedSpecies].male">
                                                    </div>
                                                    <div style="position: absolute;top:0;right:0;transform:scaleX(-1); width: 50%;overflow: hidden;border-right: 1px dashed black;">
                                                        <img :style="`width:${$parent.anatomyWidth}px`" :src="$parent.anatomyImages[$parent.selectedSpecies].female">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div :style="`width:${$parent.anatomyWidth}px`" style="text-align: center; font-size: 12px; height:40px">{{ $parent.depotDescription }}</div>
                                    </div>
                                    <div class="f-col" style="gap:15px">
                                        <div style="font-size: 18px;line-height: 40px;font-weight: bold;">Adipose tissue depots</div>
                                        <div class="depot-items" style="max-height:400px">
                                            <div class="f-row" style="gap:15px;">
                                                <template v-for="(depots, category) in $parent.depotsByCategory">
                                                    <div class="f-col" style="gap:5px;">
                                                        <div class="depot-category" style="font-weight:bold; text-transform: capitalize; padding:5px 0" @mouseover="$parent.highlightDepotCategory(category)">
                                                            {{ category }}
                                                        </div>
                                                        <div class="depot-item f-row spread-out" v-for="depot in depots" @mouseover="$parent.highlightDepot($event, depot)" @click="$parent.goToDatasets($event, depot)" :style="`cursor:${depot.count && depot.count > 0 ? 'pointer':'default'}`">
                                                            <div>{{ depot.name }}</div>
                                                            <div v-if="depot.count>0">({{ depot.count }})</div>
                                                        </div>
                                                    </div>
                                                </template>
                                            </div>
                                            <!--
                                            <div class="f-col" style="gap:5px; padding:20px 0 0; flex-wrap: wrap; height: -webkit-fill-available;">
                                                <div class="depot-item" v-for="depot in $parent.depots.human" @mouseover="$parent.highlightDepot(depot.ontology)">{{ depot.name }}</div>
                                            </div>
                                            -->
                                        </div>
                                        <!--
                                        <div class="depot-info">
                                            In humans, adipose tissue is located beneath the skin (subcutaneous fat), around internal organs (visceral fat), in bone marrow (yellow bone marrow) and in breast tissue. Adipose tissue is found in specific locations, which are referred to as adipose depots. Adipose tissue contains several cell types, with the highest percentage of cells being adipocytes, which contain fat droplets. Other cell types include fibroblasts, macrophages, and endothelial cells. Adipose tissue contains many small blood vessels.; Mice have eight major adipose depots, four of which are within the abdominal cavity. The paired gonadal depots are attached to the uterus and ovaries in females and the epididymis and testes in males; the paired retroperitoneal depots are found along the dorsal wall of the abdomen, surrounding the kidney, and, when massive, extend into the pelvis. The mesenteric depot forms a glue-like web that supports the intestines, and the omental depot, which originates near the stomach and spleen, and, when massive, extends into the ventral abdomen.
                                        </div>
                                        -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--
                    <div class="f-row">
                        <div v-if="$parent.adiposeInfo" v-html="$parent.adiposeInfo[0].body"></div>
                    </div>
                    -->
                </template>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>

<style scoped>
.logline {
    font-size: 20px;
    line-height: 26px;
    font-weight: bold;
    text-align: center;
    width: 650px;
    margin: 10px auto 40px;
}
.content-wrap{
    padding: 20px 20px 100px 20px;
    line-height: normal;
}
.anatomy-item {
    width: 200px;
    position:relative;
}
.anatomy-item img {
    height: 100%;
    width: 100%;
}
.depot-item {
    background: white;
    padding: 3px 10px;
    border-radius: 5px 0 0 5px;
    font-size: 14px;
    text-transform: capitalize;
}
.depot-item *{
    pointer-events: none;
}
.depot-item.on{
    background: gold;
}
.depot-items {
    flex: 1 0 auto;
}
.depot-info {
    flex: 0 1 auto;
    background: white;
    padding: 20px;
    width: 500px;
    font-size: 14px;
    height: fit-content;
    border-radius: 10px;
}
.depot-point{
    opacity: 0;
}
.depot-point.on{
    opacity: 1;
}
</style>