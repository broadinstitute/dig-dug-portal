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
                            <div class="f-col" style="width:250px;font-size:14px;gap:20px;padding:20px 0 0">
                                <span style="font-size:16px">Adipose tissue is a heterogeneous organ found in depots throughout the body.</span>

                                Explore the depots for an explanation of their utility and function, find datasets for that depot, then drill down deeper with our Cell Browser for more.
                            </div>
                            <div class="f-row" style="gap:50px">
                                <div class="anatomy">
                                    <div class="anatomy-item human-male">
                                        <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.male_.svg">
                                    </div>
                                </div>
                                <div class="f-row">
                                    <div class="depot-items">
                                        <div class="label underline">Adipose Tissue Depots</div>
                                        <div class="f-col" style="gap:5px; padding:20px 0 0">
                                            <div class="depot-item" v-for="value in $parent.filterOptions['depot']">{{ value.text }}</div>
                                        </div>
                                    </div>
                                    <div class="depot-info">
                                        In humans, adipose tissue is located beneath the skin (subcutaneous fat), around internal organs (visceral fat), in bone marrow (yellow bone marrow) and in breast tissue. Adipose tissue is found in specific locations, which are referred to as adipose depots. Adipose tissue contains several cell types, with the highest percentage of cells being adipocytes, which contain fat droplets. Other cell types include fibroblasts, macrophages, and endothelial cells. Adipose tissue contains many small blood vessels.; Mice have eight major adipose depots, four of which are within the abdominal cavity. The paired gonadal depots are attached to the uterus and ovaries in females and the epididymis and testes in males; the paired retroperitoneal depots are found along the dorsal wall of the abdomen, surrounding the kidney, and, when massive, extend into the pelvis. The mesenteric depot forms a glue-like web that supports the intestines, and the omental depot, which originates near the stomach and spleen, and, when massive, extends into the ventral abdomen.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
    opacity: 0.4;
}
.anatomy-item {
    width: 200px;
}
.anatomy-item img {
    height: 100%;
    width: 100%;
}
.depot-item {
    background: white;
    padding: 3px 10px;
    border-radius: 5px 0 0 5px;
    cursor: pointer;
    font-size: 14px;
}
.depot-item:hover {
    background: #dddddd;
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
</style>