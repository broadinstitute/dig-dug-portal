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
                        v-model="$store.state.patient"
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
                                $store.state.patient
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
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-9 gene-page-header-title">
                        Patient
                        <tooltip-documentation
                            name="variant.alleles.tooltip.hover"
                            :isHover="true"
                        ></tooltip-documentation>
                    </div>
                   
                    <div class="col-md-9 gene-page-header-body">
                        <span>
                            {{ $store.state.patient }}
                        </span>
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.patient"
                    >
                        <h4 class="card-title">
                            Patient Diagnosis
                        </h4>
                        <patient-diagnosis-card
                            v-bind:patientId="
                                $store.state.patient
                            ">
                        </patient-diagnosis-card>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.patient"
                    >
                        <h4 class="card-title">
                            Patient Admin Medicine
                        </h4>
                        <patient-admin_medicine-card
                            v-bind:patientId="
                                $store.state.patient
                            ">
                        </patient-admin_medicine-card>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.patient"
                    >
                        <h4 class="card-title">
                            Patient Home Medicine
                        </h4>
                        <patient-home_medicine-card
                            v-bind:patientId="
                                $store.state.patient
                            ">
                        </patient-home_medicine-card>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.patient"
                    >
                        <h4 class="card-title">
                            Patient Laboratory
                        </h4>
                        <patient-laboratory-card
                            v-bind:patientId="
                                $store.state.patient
                            ">
                        </patient-laboratory-card>
                        
                    </div>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="$store.state.patient"
                    >
                        <h4 class="card-title">
                            Patient Vital
                        </h4>
                        <patient-vital-card
                            v-bind:patientId="
                                $store.state.patient
                            ">
                        </patient-vital-card>
                        
                    </div>
                    
                </div>
            </div>
        </div> 
        
        
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
