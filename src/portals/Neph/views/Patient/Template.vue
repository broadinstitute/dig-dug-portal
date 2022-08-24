<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div class="col filter-col-md">
                    <div class="label">Patient</div>
                    <input
                        v-model="$store.state.newPatientId"
                        type="text"
                        class="form-control"
                        placeholder="Search Patient"
                        id="patient_search_input"
                    />
                </div>
                <div class="col filter-col-sm">
                    <button
                        id="patientSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="
                            $store.dispatch(
                                'queryPatient',
                                $store.state.newPatientId
                            )
                        "
                    >
                        GO
                    </button>
                </div>
                <div class="col divider"></div>
                <div class="col filter-col-md search-example">
                    <div class="label">Search format examples</div>
                    <div>
                        BCH-20-69209-01
                    </div>
                </div>
            </search-header-wrapper>

            
            
        </div> 

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
