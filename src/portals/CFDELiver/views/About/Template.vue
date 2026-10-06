<template>
    <div class="main-content">
        <div class="f-col" style="width:100%">
            <!-- CONTENT -->
             <div v-if="$parent.page === 'about'">
                <h1 class="page-title">{{ $parent.pageTitleAbout }}</h1>
                <div v-html="$parent.pageContentAbout"></div>
             </div>
             <div v-if="$parent.page === 'governance'">
                <h1 class="page-title">{{ $parent.pageTitleGovernance }}</h1>
                <div v-html="$parent.pageContentGovernance"></div>
             </div>
             <div v-if="$parent.page === 'consortium'">
                <h1 class="page-title">Consortium</h1>
                <div>
                    <p>The CFDE Liver Resource is developed by a multidisciplinary team from the 
                        CFDE Data Resource Center (DRC) and the CFDE Knowledge Center (KC). 
                        The collaboration includes investigators and staff from the University of California San Diego,
                        the Icahn School of Medicine at Mount Sinai, and the Broad Institute of MIT and Harvard.
                        The resource also benefits from scientific input and support from CFDE program staff, 
                        participating Common Fund programs, and the liver research community. The CFDE 
                        Liver Resource is supported by the United States National Institutes of Health (NIH)
                        Common Fund under Award Numbers OT2OD036435 and OT2OD036440.</p>
                    <p>Below is a schematic of all CFDE DCCs that have generated liver data to-date.</p>
                    <img src="https://hugeampkpncms.org/sites/default/files/users/user32/cfde_wheel_blue.png"
                        title="The CFDE Wheel diagram highlighting contributors to the CFDE Liver Resource: 4DN, GlyGen, HMP, HuBMAP, LINCS, MoTrPAC, Metabolomics Workbench, SCGE, SenNet. In the center of the wheel are CFDE Workbench and CFDE KC."/>
                </div>
             </div>
        </div>
    </div>
</template>
<style scoped>
h1.page-title {
    margin-bottom: 25px;
}
</style>