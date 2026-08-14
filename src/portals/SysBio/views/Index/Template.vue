<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>

        <div class="section hero f-row grow-children align-v-center"
             style="gap: 70px; flex-wrap: wrap;"
        >
            <div class="f-col" style="flex: 1 1 300px; gap:20px; z-index: 1; max-width: 100%;">
                <div class="hero-title">Accelerate<br/>Cross-Disease<br/>Discovery</div>
                <div class="f-col" style="gap:20px; width: 60ch; max-width: 100%;">
                    <h3 style="line-height: 1.2;">
                        Search, filter, and analyze harmonized clinical and multi-omic datasets across traditional 
                        disease silos instantly, securely, and from a single interface.
                    </h3>
                    <div class="f-col" style="gap: 20px">
                        <a
                            role="button"
                            href="about.html?page=about"
                            class="loud"
                            style="width: fit-content;"
                            >Learn more ❯</a
                        >
                        <div class="f-col" style="gap:25px">
                            <div class="rfa-note">
                                <div class="rfa-title">Explore our Beta</div> 
                                <div class="rfa-body">
                                    The foundational framework for unified cross-disease 
                                    discovery. Review our proof-of-concept analytical applications and evaluate multi-repository 
                                    data from Accelerating Medicines Partnership<sup>®</sup> (AMP<sup>®</sup>) from a single interface to power upcoming 
                                    research proposals.
                                </div>
                            </div>
                            <div class="rfa-note">
                                <div class="rfa-title">Targeting Request for Applications (RFA)-AI-28-014?</div> 
                                <div class="rfa-body">
                                    If you are applying for the forecasted 
                                    National Institute of Allergy and Infectious Diseases (NIAID) Precision and Systems Biology 
                                    to Uncover the Link Between Chronic and Infectious Diseases initiative, use SysBio FAIRplex 
                                    to demonstrate immediate project feasibility, proof-of-concept data standardization and 
                                    harmonization for cross-disease discovery.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="f-col align-v-center" style="flex: 1 1 300px; min-height: 150px; position: relative; height:stretch">
                <div class="circles">
                    <div class="circle blue"></div>
                    <div class="circle pink"></div>
                </div>
                <gene-selectpicker @onGeneChange="(gene) => $parent.highlight(gene)" class="hero-search" style="margin:auto 0;" />
            </div>
        </div>

        <!-- BODY -->
        <div class="sysbio-body" style="gap: 100px; padding-bottom: 0">


            <div class="section f-col" style="gap:20px">
                <div class="f-col" style="gap:5px">
                    <h2 class="bold">The SysBio FAIRplex Ecosystem at a Glance</h2>
                    <div class="h2-sub muted">
                        What is available as part of our proof-of-concept today?
                    </div>
                </div>
                <div class="counters">
                    <div class="counter">
                        <div class="counter-num" data-count="4931">
                        </div>
                        <div class="counter-label">
                            Harmonized Participants
                        </div>
                    </div>
                    <div class="counter">
                        <div class="counter-num" data-count="8">
                        </div>
                        <div class="counter-label">
                            Diseases
                        </div>
                    </div>
                    <div class="counter">
                        <div class="counter-num" data-count="909">
                        </div>
                        <div class="counter-label">
                            Gene Expression Profiles
                        </div>
                    </div>
                    <div class="counter">
                        <div class="counter-num" data-count="3">
                        </div>
                        <div class="counter-label">
                            Data Modalities
                        </div>
                    </div>
                    <div class="counter">
                        <div class="counter-num" data-count="3">
                        </div>
                        <div class="counter-label">
                            Tools Available
                        </div>
                    </div>
                    <div class="counter">
                        <div class="counter-num" data-count="4">
                        </div>
                        <div class="counter-label">
                            Participating Program Repositories
                        </div>
                    </div>
                </div>
                <div class="f-col" style="gap:5px; margin-top:10px">
                    <div class="bold" style="font-size:16px">Program repositories currently undergoing integration</div>
                    <div class="f-row" style="gap:5px; flex-wrap: wrap;">
                        <div class="amp">AMP Alzheimer's Disease (AD)</div>
                        <div class="amp">AMP Common Metabolic Diseases (CMD)</div>
                        <div class="amp">AMP Parkinson's Disease and Related Disorders (PDRD)</div>
                        <div class="amp">AMP Rheumatoid Arthritis</div>
                        <div class="amp">Systemic Lupus Erythematosus (RA/SLE)</div>
                    </div>
                </div>
            </div>

            <div class="section f-col" style="gap:20px">
                <div class="f-col" style="gap:5px">
                    <h2 class="bold">Available Open Discovery Tools (Beta)</h2>
                    <div class="h2-sub muted">
                        Launch open-access gateway tools to explore our proof-of-concept harmonized cross-disease transcriptomic and genetic data. Select a tool to begin exploration.
                    </div>
                </div>
                <div class="section-items f-row">
                    <div class="section-item medium">
                        <div class="item-copy">
                            <div class="item-title">
                                Ecosystem Data Finder
                            </div>
                            <div class="item-body">
                                Learn about datasets that are currently available, track active data standardization 
                                and harmonization across participating program repositories (such as AMP projects), 
                                and find direct pathways to request partner repository data access.<br/>
                                <a href="/about.html?page=access" style="font-size: 0.9em;">How to Directly Access Partner Repository Data</a>
                            </div>
                            <div class="item-btn">
                                <a role="button" class="loud" href="/about.html?page=datasets">View Datasets</a>
                            </div>
                        </div>
                        <div class="item-bg contain">
                            <img src="images/sysbio/images/sysbio_data.png" />
                        </div>
                    </div>
                    <div class="section-item medium">
                        <div class="item-copy">
                            <div class="item-title">
                                Data Summary Browser
                            </div>
                            <div class="item-body">
                                View interactive demographic and phenotypic summaries from the participating program 
                                repositories. 
                            </div>
                            <div class="item-btn">
                                <a role="button" class="loud" href="/datasetsSummary.html">View Data Summary Browser</a>
                            </div>
                        </div>
                        <div class="item-bg contain">
                            <img src="images/sysbio/images/sysbio_summary.png" />
                        </div>
                    </div>
                    <div class="section-item medium">
                        <div class="item-copy">
                            <div class="item-title">
                                Gene Expression Browser
                            </div>
                            <div class="item-body">
                                Interact with visualizations of differential gene expression within human 
                                tissues derived across participating program repositories. 
                            </div>
                            <div class="item-btn">
                                <a role="button" class="loud" href="/diffexp.html">View Gene Expression Browser</a>
                            </div>
                        </div>
                        <div class="item-bg contain">
                            <img src="images/sysbio/images/sysbio_diffexp.png" />
                        </div>
                    </div>
                    <div class="section-item medium">
                        <div class="item-copy">
                            <div class="item-title">
                                Genetic Studies
                            </div>
                            <div class="item-body">
                                Explore analysis outputs and summary statistics from case-versus-case 
                                Genome-Wide Association Studies (GWAS) across distinct diseases. 
                            </div>
                            <div class="item-btn">
                                <a role="button" class="loud" href="/gwas.html">View Genetic Studies</a>
                            </div>
                        </div>
                        <div class="item-bg contain">
                            <img src="images/sysbio/images/manhattan.png" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="section f-col" style="gap:20px">
                <div class="f-col" style="gap:5px">
                    <h2 class="bold">How It Works</h2>
                    <div class="h2-sub muted">
                        Bridging the gap between traditional disease silos through a pipeline of ingestion, standardization, harmonization, and federated cross-repository discovery.
                    </div>
                </div>
                <div class="f-col" style="gap:20px">
                    <!--
                    <div class="f-col">
                        <h4>Your Accelerated Research Path: From Months to Minutes</h4>
                        <div>SysBio FAIRplex provides a single entry point for cross-disease discovery, hypothesis formulation, cohort building, and cloud analysis, and access to select cross AMP harmonized -omics datasets.</div>
                    </div>
                    -->
                    <div class="f-row" style="gap:20px; flex-wrap: wrap;">
                        <div class="f-col" style="gap:10px; flex: 1 1 0; min-width: 300px;">
                            <h4 class="f-row spread-out" style="border-bottom: 5px solid var(--sysbio-light-blue); padding: 5px 0">
                                What you can do today <span class="badge muted" style="color:var(--sysbio-light-blue)">Beta features live now</span>
                            </h4>
                            <div>
                                <strong>Cross-Disease Exploration:</strong> Cross-examine proof-of-concept aggregate summary statistics and map dataset availability for cross-disease discovery to spark novel hypotheses, eliminating the need to manually access, extract, and generate baseline summary statistics yourself
                            </div>
                        </div>
                        <div class="f-col" style="gap:10px; flex: 3 1 0; min-width: 300px;">
                            <h4 class="f-row spread-out" style="border-bottom: 5px solid var(--sysbio-pink); padding: 5px 0">
                                Full platform capabilities <span class="badge muted" style="color:var(--sysbio-pink)">Multi-year program scope</span>
                            </h4>
                            <div class="f-row" style="gap:20px; flex-wrap: wrap;">
                                <div style="flex: 1 1 300px">
                                    <strong>No-Code Cohort Building:</strong> Build custom virtual cohorts code-free by filtering multi-repository participant data down to your exact inclusion criteria, rather than entering each individual source repository to manually identify cross-disease cohorts
                                </div>
                                <div style="flex: 1 1 300px">
                                    <strong>Unified Access Requests:</strong> Participate in a manual pilot of a single data access request process for participating repositories, eliminating the need to navigate unique compliance hoops for each distinct source repository
                                </div>
                                <div style="flex: 1 1 300px">
                                    <strong>Streamlined Participant-Level Cloud Analyses:</strong> Transition and analyze individual-participant-level files seamlessly by launching analysis-ready assets into a secure, high-performance computing space using existing source repository authorizations
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="f-col" style="max-width: 60ch; align-self: flex-end; padding: 15px; background: #eee; border-radius: 10px; font-size: .8rem;">
                        <h4>The Value</h4>
                        <div>A centralized hub to rapidly identify, cross-analyze, and securely request the precise harmonized multi-repository assets needed to accelerate your cross-disease research projects. SysBio FAIRplex turns months of silo-hopping into minutes of cross-disease discovery.</div>
                    </div>
                </div>
            </div>

            <div class="section f-col" style="gap:20px">
                <div class="f-col" style="gap:20px; flex:1">
                    <div class="f-col" style="gap:5px">
                        <h2 class="bold">Technical Data Foundation</h2>
                        <div class="h2-sub muted">
                            SysBio FAIRplex establishes a unified entry point for cross-disease data discovery by standardizing and harmonizing heterogeneous datasets from multiple disease-focused participating program repositories into a single framework.
                        </div>
                    </div>
                    <div>
                        <div class="tech-layers f-col" style="--count: 5">
                            <div class="tech-layer" style="--index: 0">
                                <h4 class="f-col align-v-center">Ingestion Scope</h4>
                                <div>Multi-program clinical phenotypes, biospecimen/assay metadata, and multi-omic data outputs from across participating programs</div>
                            </div>
                            <div class="tech-layer" style="--index: 1">
                                <h4 class="f-col align-v-center">Standardization</h4>
                                <div>Clinical data and metadata mapped to Common Data Elements (CDEs) mapped to the SysBio FAIRplex Common Data Model (SysBio CDM).</div>
                            </div>
                            <div class="tech-layer" style="--index: 2">
                                <h4 class="f-col align-v-center">Pipeline Execution</h4>
                                <div>Individual-participant-level data and -omic summary statistics generated via fully documented, reproducible public pipelines.</div>
                            </div>
                            <div class="tech-layer" style="--index: 3">
                                <h4 class="f-col align-v-center">Storage Architecture</h4>
                                <div>Harmonized individual-participant-level files are exported to self-describing formats (HDF5) and routed back to source repositories to maintain data integrity.</div>
                            </div>
                            <div class="tech-layer" style="--index: 4">
                                <h4 class="f-col align-v-center">Discovery Mechanism</h4>
                                <div>Global cross-program indexing of metadata summary statistics for immediate open-access querying.</div>
                            </div>
                        </div>
                        <!--
                        <table class="tech-table">
                            <thead>
                                <tr>
                                    <td><h3>Layer</h3></td>
                                    <td style="width:60ch"><h3>Technical implementation</h3></td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Ingestion Scope</td>
                                    <td>Multi-program clinical phenotypes, biospecimen/assay metadata, and multi-omic data outputs from across participating programs</td>
                                </tr>
                                <tr>
                                    <td>Standardization</td>
                                    <td>Clinical data and metadata mapped to Common Data Elements (CDEs) mapped to the SysBio FAIRplex Common Data Model (SysBio CDM).</td>
                                </tr>
                                <tr>
                                    <td>Pipeline Execution</td>
                                    <td>Individual-participant-level data and -omic summary statistics generated via fully documented, reproducible public pipelines.</td>
                                </tr>
                                <tr>
                                    <td>Storage Architecture</td>
                                    <td>Harmonized individual-participant-level files are exported to self-describing formats (HDF5) and routed back to source repositories to maintain data integrity.</td>
                                </tr>
                                <tr>
                                    <td>Discovery Mechanism</td>
                                    <td>Global cross-program indexing of metadata summary statistics for immediate open-access querying.</td>
                                </tr>
                            </tbody>
                        </table>
                        -->
                    </div>
                </div>
            </div>

            <div class="section f-col" style="gap:20px">
                <div class="f-col" style="gap:5px">
                    <h2 class="bold">Platform Capabilities Rollout Guide</h2>
                    <div class="h2-sub muted">
                        Track our platform development phases to align your upcoming research plans with our live data releases, active pilots, and analytical tools.
                    </div>
                </div>
                <div class="f-row align-h-center" style="flex:1">
                    <div class="f-col" style="flex:1; gap:100px; padding:40px 40px 40px 0">
                        <div class="timeline-item timeline-left timeline-blue f-col" style="gap:10px; border-right: 3px solid var(--sysbio-blue);">
                            <div class="timeline-header">
                                <div class="f-row spread-out muted" style="flex-wrap: wrap">
                                    <div>Phase 1</div> 
                                    <div>Q3 2024 – Q2 2026</div>
                                </div>
                                <div class="f-row spread-out" style="flex-wrap: wrap">
                                    <div>Alpha & Early Beta</div>  
                                    <div class="timeline-pill nowrap" style="background: var(--sysbio-blue)">Completed</div>
                                </div>
                            </div>
                            <div class="timeline-body">
                                <div>
                                    <strong>Harmonization</strong> Ingested and conducted a proof-of-concept multi-omic dataset harmonization from four AMP projects.
                                </div>
                                <div>
                                    <strong>Standardization</strong> Initiated a mapping of clinical and assay data and metadata common data elements (CDEs) into the unified Common Data Model (CDM).
                                </div>
                            </div>
                        </div>
                        <div  class="timeline-item timeline-left f-col" style="gap:10px; border-right: 3px solid #ccc">
                             <div class="timeline-header">
                                <div class="f-row spread-out muted" style="flex-wrap: wrap">
                                    <div>Phase 3</div> 
                                    <div>Q4 2026 – Q3 2027</div>
                                </div>
                                <div class="f-row spread-out" style="flex-wrap: wrap">
                                    <div>Production</div>  
                                    <div class="timeline-pill " style="background:#ccc">Upcoming</div>
                                </div>
                            </div>
                            <div class="timeline-body">
                                <div>
                                    <strong>Ecosystem Search</strong>: Global rollout of fully optimized federated search across all participating repositories.
                                </div>
                                <div>
                                    <strong>Ecosystem Scaling Deployment</strong>: Scheduled deployment of the cohort-filtering frameworks and integrated analytical secure environments.
                                </div>
                            </div>
                        </div>
                        <div>

                        </div>
                    </div>
                    <div class="helix-container dna-animation">
                        <!--
                        <svg style="height:100%" viewBox="0 0 27.458 9.816" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" transform="translate(27.458 0) rotate(90)">
                        -->
                        <svg style="height:100%" viewBox="0 0 9.816 27.458" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none">
                                <path id="path1" pathLength="1" d="M1.475 26.708q.256-.235.578-.412c1.212-.675 3.05-.812 4.54-1.248 1.375-.402 2.455-1.058 2.473-2.628h0c.05-4.354-8.365-2.15-8.316-6.503h0c.018-1.603 1.144-2.254 2.562-2.654" stroke="#ff00c6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path id="line1" pathLength="1" d="m4.035 16.87 1.96.016" stroke="#00b9ff" stroke-linecap="round" stroke-linejoin="bevel"/>
                                <path id="line2" pathLength="1" d="m4.035 23.182 1.96.017" stroke="#00b9ff" stroke-linecap="round" stroke-linejoin="bevel"/>
                                <path id="path2" pathLength="1" d="M1.487 25.857 c-.076-.113-.463-.576-.583-.9 -.096-.261-.15-.559-.154-.901 -.049-4.353 8.366-2.149 8.316-6.502 -.035-3.062-4.66-2.754-7.092-3.754" stroke="#0000c6" stroke-width="1.5" stroke-linejoin="round"/>
                                <path id="path3" pathLength="1" d="M1.475 14.167q.256-.235.578-.412c1.212-.675 3.05-.812 4.54-1.248 1.375-.402 2.455-1.059 2.473-2.629h0C9.116 5.525.701 7.73.75 3.376h0C.768 1.773 1.894 1.122 3.312.722" stroke="#ff00c6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path id="line3" pathLength="1" d="m4.035 4.33 1.96.015" stroke="#00b9ff" stroke-linecap="round" stroke-linejoin="bevel"/>
                                <path id="line4" pathLength="1" d="m4.035 10.64 1.96.017" stroke="#00b9ff" stroke-linecap="round" stroke-linejoin="bevel"/>
                                <path id="path4" pathLength="1" d="M1.487 13.316 c-.076-.113-.463-.576-.583-.9 -.096-.261-.15-.56-.154-.901 -.049-4.353 8.366-2.149 8.316-6.502 -.035-3.062-4.66-2.753-7.092-3.753" stroke="#0000c6" stroke-width="1.5" stroke-linejoin="round"/>
                            </g>
                        </svg>
                    </div>
                    <div class="timeline-list f-col" style="flex:1; gap:100px; padding:40px 0 40px 40px">
                        <div>

                        </div>
                        <div class="timeline-item timeline-right timeline-pink f-col" style="gap:10px; border-left: 3px solid var(--sysbio-pink)">
                             <div class="timeline-header">
                                <div class="f-row spread-out muted" style="flex-wrap: wrap">
                                    <div>Phase 2</div> 
                                    <div>Q2 2026 – Q3 2026</div>
                                </div>
                                <div class="f-row spread-out" style="flex-wrap: wrap">
                                    <div>Live Beta</div>  
                                    <div class="timeline-pill " style="background: var(--sysbio-pink);">Active</div>
                                </div>
                            </div>
                            <div class="timeline-body">
                                <div>
                                    <strong>Open Discovery Portal</strong> Live deployment of user-facing data summary, gene expression, and genetic studies browsers based on data harmonization proof-of-concept.
                                </div>
                                <div>
                                    <strong>Ecosystem Scaling</strong> Active scaling of cross-disease clinical and multi-omic data harmonization pipelines.
                                </div>
                                <div>
                                    <strong>Federated Queries</strong> Piloting cross-site repository search tools.
                                </div>
                            </div>
                        </div>
                        <div class="timeline-item timeline-right f-col" style="gap:10px; border-left: 3px solid #ccc;">
                            <div class="timeline-header">
                                <div class="f-row spread-out muted" style="flex-wrap: wrap">
                                    <div>Phase 4</div> 
                                    <div>Q4 2027 and beyond</div>
                                </div>
                                <div class="f-row spread-out" style="flex-wrap: wrap">
                                    <div>Future</div>  
                                    <div class="timeline-pill " style="background: #ccc;">Upcoming</div>
                                </div>
                            </div>
                            <div class="timeline-body">
                                <div>
                                    <strong>Grant Alignment</strong> Fully operational production platform ready for Fiscal Year 2028 project launch.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section f-row" style="gap:20px; flex-wrap: wrap;''">
                <div class="f-col" style="gap:20px; flex:1 1 400px">
                    <div class="f-col" style="gap:5px;">
                        <h2 class="bold">Reference SysBio FAIRplex in Your Application</h2>
                        <div class="h2-sub muted">
                            Utilizing this portal to demonstrate project feasibility or infrastructure alignment for an upcoming proposal (such as RFA-AI-28-014)?<br/>
                            To validate project feasibility, you may reference the platform's established framework directly in your application text.<br/>
                            See example text that you can adapt for your application:
                        </div>
                    </div>
                </div>
                <div class="f-col" style="gap:20px; flex:1 1 400px">
                    <div class="cite copy-paste">
                        The proposed project will leverage SysBio FAIRplex to utilize cross-disease cohort mapping, standardization, and harmonization. The platform operates under National Institutes of Health Common Fund Award Number OT2OD037975, providing an active baseline framework for metadata indexing and cross-disease discovery. The project will utilize the platform’s federated data framework and standardization and harmonization pipelines to isolate and analyze harmonized assets across participating program repositories, eliminating infrastructure duplication and maximizing multi-institutional utility.
                    </div>
                    <div class="muted" style="padding:0 40px">
                        <strong>Are you currently publishing a manuscript using data derivatives from SysBio FAIRplex?</strong><br/>
                        Formal attribution is required by policy. <a href="/about.html?page=policies">View Policies Page</a>
                    </div>
                </div>
            </div>

            <div class="section f-row" style="gap:40px; flex-wrap: wrap;">
                <div class="f-col" style="gap:20px; flex:1 1 400px">
                    <div class="f-col" style="gap:5px; flex:1">
                        <h2 class="bold">Collaborate With Us</h2>
                        <div class="h2-sub muted">
                            As we scale our data standardization and harmonization pipelines across our network of participating program repositories, we want to tailor our interface to your specific investigative workflows. Your insights can directly influence our engineering roadmap and maximize the platform's utility for your future cross-disease discovery projects.
                        </div>
                    </div>
                    <a role="button" class="loud" href="https://www.google.com/url?q=https://redcap.vumc.org/surveys/?s%3D4FPLKJEYAWFCHRNL&sa=D&source=docs&ust=1785261217863919&usg=AOvVaw0ITAMCZZOUnNYgecifYavD" style="width:fit-content">Share Your Feedback</a>
                </div>
                <div class="f-col" style="gap:20px; flex:1 1 400px">
                    <div class="f-col" style="gap:5px; flex:1">
                        <h2 class="bold">Consortium & Governance</h2>
                        <div class="h2-sub muted">
                            The SysBio FAIRplex Ecosystem is engineered, governed, and managed by a multidisciplinary consortium of domain experts with an established international track record of building premier data platforms. Our infrastructure operates in strict adherence to federal and institutional data compliance frameworks, accelerating public-interest science while preserving the absolute data sovereignty of our participating program repositories.
                        </div>
                    </div>
                    <a role="button" class="loud" href="/about.html?page=team" style="width:fit-content">View About Us</a>
                </div>
            </div>
            
            <div class="section" style="display:none">
                <h2>Visualizations and Tools</h2>
                <div>
                    Explore open-access summary visualizations from the
                    Accelerating Medicines Partnership (AMP) projects here.
                    Visualizations are derived from FAIRplex harmonization of
                    just a subset of the data available from the AMPs.
                    Additional harmonization efforts are underway; stay tuned
                    for updates! Learn more about how to request access to each
                    AMP's underlying data
                    <a href="about.html?page=access">here</a>.
                </div>
                <div class="section-body">
                    <div class="f-row">
                        <div class="tabs f-col">
                            <div
                                class="tab f-col active"
                                data-tab="composition"
                                @click="$parent.showTab($event)"
                            >
                                <div class="tab-title">Data Composition</div>
                                <div class="tab-body">
                                    Demographics and phenotypes within AMP
                                    programs for which FAIRplex has generated
                                    harmonized RNA-sequencing data
                                </div>
                            </div>
                            <div
                                class="tab f-col"
                                data-tab="expression"
                                @click="$parent.showTab($event)"
                            >
                                <div class="tab-title">Gene Expression</div>
                                <div class="tab-body">
                                    Differential gene expression from bulk
                                    RNA-seq and harmonized pseudobulked
                                    single-cell or single nucleus RNA-seq data
                                    from human tissues from AMP AD, AMP CMD, AMP
                                    PDRD, and AMP RA/SLE
                                </div>
                            </div>
                            <div
                                class="tab f-col"
                                data-tab="clustering"
                                @click="$parent.showTab($event)"
                            >
                                <div class="tab-title">Genetic Studies</div>
                                <div class="tab-body">
                                    Visualizations of case versus case
                                    Genome-Wide Association Studies (GWAS) of
                                    individuals with Alzheimer's Disease (AMP
                                    AD) versus Parkinson's Disease and Related Disorders (AMP PDRD)
                                </div>
                            </div>
                        </div>
                        <div class="tab-contents f-col">
                            <div
                                class="tab-content active f-col"
                                data-tab="composition"
                            >
                                <!--<research-bar-in-cell-plot v-if="!!$parent.dataComposition.data"
                                    :plotData="$parent.dataComposition.data"
                                    :plotMargin="$parent.dataComposition.plotMargin"
                                    :plotConfig="$parent.dataComposition.plotConfig"
                                    :canvasId="$parent.dataComposition.id" :utils="null" />-->
                                <research-multi-bar-graphs
                                    v-if="
                                        $parent.multiBarGraphs &&
                                        $parent.multiBarGraphs.data &&
                                        $parent.multiBarGraphs.data.length
                                    "
                                    :plotData="$parent.multiBarGraphs.data"
                                    :plotConfig="
                                        $parent.multiBarGraphs.plotConfig
                                    "
                                    :plotMargin="
                                        $parent.multiBarGraphs.plotMargin
                                    "
                                    :canvasId="$parent.multiBarGraphs.id"
                                    :utils="null"
                                />
                            </div>
                            <div
                                class="tab-content f-col"
                                data-tab="expression"
                            >
                                <div class="multi-bar-top-row">
                                    <div></div>
                                    <a
                                        role="button"
                                        class="loud"
                                        href="diffexp.html"
                                        >Browse full gene expression data</a
                                    >
                                </div>
                                <div>
                                    Explore visualizations of differential gene
                                    expression within human tissues derived from
                                    the Accelerating Medicines Partnership (AMP)
                                    programs. Differential expression analyses
                                    were performed on blood-derived bulk RNA
                                    sequencing datasets from individuals with
                                    common metabolic disorders versus
                                    blood-derived pseudobulk RNA sequencing
                                    datasets from individuals with Parkinson's
                                    disease. The volcano plot shows all
                                    differentially expressed genes between the
                                    two groups.
                                </div>
                                <div class="tab-content-img-wrapper">
                                    <img
                                        style="width: 450px"
                                        :src="'images/sysbio/images/sysbio_volcano.jpg'"
                                    />
                                </div>
                            </div>
                            <div
                                class="tab-content f-col"
                                data-tab="clustering"
                            >
                                <div class="multi-bar-top-row">
                                    <div></div>
                                    <a
                                        role="button"
                                        class="loud"
                                        href="gwas.html"
                                        >Browse genetic studies</a
                                    >
                                </div>
                                <div class="tab-content-img-wrapper">
                                    <img
                                        style="width: 90%"
                                        src="images/sysbio/images/manhattan.png"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" style="display:none">
                <h2>
                    Accelerating Medicines Partnership<sup>®</sup>
                    (AMP<sup>®</sup>) Programs
                </h2>
                <div>FAIRplex provides cross-program summary-level analyses and visualizations from harmonized data from the AMP<sup>®</sup> programs, which are managed through the Foundation for the National Institutes of Health (FNIH). See the AMP<sup>®</sup> programs below.</div>
                <div class="section-body">
                    <div class="section-items f-row">
                        <div
                            class="section-item"
                            v-for="item in $parent.content.amps.rows"
                            :class="[item.type, item.comingSoon ? 'soon' : '']"
                        >
                            <div class="item-copy">
                                <div class="item-title">{{ item.title }}</div>
                                <div class="item-body" v-html="item.body"></div>
                                <!--
                                <a
                                    class="item-btn"
                                    role="button"
                                    :href="item.linkUrl"
                                    style="margin-top: auto"
                                    >{{ item.linkLabel }} ❯</a
                                >
                                -->
                            </div>
                            <div class="item-bg contain">
                                <img :src="item.bgImage" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-body">
                    <div class="partners">
                        <h2 class="bold" style="width: 100%; text-align: center">
                            SysBio FAIRplex Consortium
                        </h2>
                        <div
                            class="partner-logo"
                            v-for="item in $parent.content.partners.list"
                        >
                            <a :href="item.url || null" target="_blank">
                                <img :src="item.logo" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="f-row grow-children"
                style="gap: 40px"
                v-if="!$parent.hideNews"
            >
                <div class="section">
                    <h2>News</h2>
                    <div class="section-body">
                        <div class="news-items" v-if="$parent.newsFeed">
                            <div
                                class="news-item f-row"
                                v-for="item in $parent.newsFeed"
                            >
                                <div
                                    class="news-thumbnail contain"
                                    v-html="item.field_thumbnail_image"
                                ></div>
                                <div class="f-col">
                                    <a
                                        :href="`${$parent.content.news.newsItemUrl}${item.nid}`"
                                    >
                                        <div class="">{{ item.title }}</div>
                                    </a>
                                    <div class="" v-html="item.body"></div>
                                </div>
                            </div>
                            <a
                                style="align-self: flex-end"
                                :href="`${$parent.content.news.newsUrl}`"
                                >See All News ❯</a
                            >
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Releases</h2>
                    <div class="section-body"></div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
import ResearchBarInCellPlot from "@/components/researchPortal/ResearchBarInCellPlot.vue";
import ResearchMultiBarGraphs from "@/components/researchPortal/ResearchMultiBarGraphs.vue";
import { BASE_URL } from "@/utils/runtimeConfig";

export default {
    name: "SysBioIndexTemplate",
    components: {
        ResearchBarInCellPlot,
        ResearchMultiBarGraphs,
    },
    computed: {
        heroBackgroundStyle() {
            const normalizedBaseUrl = BASE_URL.endsWith("/")
                ? BASE_URL
                : `${BASE_URL}/`;
            return {
                backgroundImage: `url(${normalizedBaseUrl}images/sysbio/images/sysbio_hero.png)`,
            };
        },
    },
    mounted() {
        //animate counters
        this.$nextTick(() => {
            requestAnimationFrame(() =>{
                requestAnimationFrame(() =>{
                    this.$el.querySelectorAll(".counter-num")
                    .forEach(el => el.style.setProperty("--num", el.dataset.count))
                });
            });
        })
    }
};
</script>

<style scoped>
.sysbio-body{
    min-width: 0 !important;
}

.hero {
    position: relative;
    background: #4b00ff;
    padding: 70px 70px 90px;
    background-size: auto 100%;
    background-repeat: no-repeat;
    background-position: bottom right;
    color: white;
    margin: 0 20px;
    border-radius: 0 0 40px 40px;
    box-shadow: 0 6px 2px 0px black;
}

.hero a {
    color: white !important;
}
.hero-title {
    font-size: 3rem;
    letter-spacing: -.03rem;
    font-weight: bold;
    line-height: 1;
}
.hero-search {

}
.rfa-note{
    position:relative;
    width: 60ch;
    max-width: 100%;
    line-height: 1.3;
    z-index: 1;
}
.rfa-title{
    position:absolute;
    z-index:1;
    font-weight: bold;
    text-decoration: underline dashed;
}
.rfa-body{
    display:none;
    position:absolute;
    top: -15px;
    left: -15px;
    padding:40px 15px 15px;
    background:white;
    color: black;
    box-shadow: 0 2px 2px 0px black;
    border-radius: 5px;
}
.rfa-note:hover{
    color:black;
    z-index: 2;
}
.rfa-note:hover .rfa-body{
    display:block;
}

.counters {
    display: grid;
    /*grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));*/
    grid-template-columns: repeat(6, auto);
}
.counter {
    display: flex;
    align-items: flex-end;
    gap: 5px;
}
@property --num {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}

.counter-num {
    font-size: 5em;
    font-weight: 900;
    line-height: 1;
    border-bottom: 1px solid #ccc;
    --num: 0;
    counter-reset: value var(--num);
    transition: --num 1.5s ease-out;
}
.counter-num::after {
  content: counter(value, decimal-leading-zero);
}

.counter-label {
    padding: 10px 0;
    width: 100px;
    line-height: 1;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    color: #949494;
}

.amp {
    padding: 5px 10px;
    background: #eee;
    border-radius: 10px;
    white-space: nowrap;
}

.tech-table td {
    padding: 10px;
}

.stat {
    gap: 5px;
}
.stat-num {
    font-size: 50px;
    line-height: 35px;
    font-weight: bold;
}
.stat-txt {
    width: min-content;
    line-height: 14px;
    display: flex;
    align-items: flex-end;
    font-weight: bold;
    color: #e6e6e6;
}

.section-body {
    padding: 20px 0 0;
}
.section-items {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}
.section-item {
    display: flex;
    background: #fbfbfb;
    border: 1px solid #eee;
    flex: 1;
    position: relative;
    min-width: 250px;
}
.item-copy {
    width: -webkit-fill-available;
    max-width: 200px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.item-title {
    font-weight: bold;
    font-size: 1.1em;
}
.item-bg {
    width: 100%;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    mix-blend-mode: darken;
    overflow: hidden;
    background-color: #eee;
}
.item-bg img{
    mix-blend-mode: darken;
}
.item-btn {
    width: fit-content;
    margin-top: auto;
}
::v-deep .contain img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 15px;
}

::v-deep .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tech-layer {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 200px) 1fr;
    width: min(600px, 100%);
    min-height: 100px;
    padding: 15px;
    background: white;
    border-radius: 10px;
    margin-top: -10px;
    border-bottom: 2px solid black;
    box-shadow: 0 0 20px -5px rgba(0, 0, 0, 0.5);
    --progress: calc(var(--index) / (var(--count) - 1));
    /*
    left is relative to the parent width.
    translateX is relative to this child's width.
    */
    left: calc(var(--progress) * 100%);
    transform: translateX(calc(var(--progress) * -100%));
}

.timeline-item{
    padding: 20px;
    position: relative;
    z-index: -1;
}
.timeline-left::after {
    content: '';
    background: linear-gradient(45deg, #ccc, transparent);
    height: 1px;
    width: 50px;
    position: absolute;
    top: 50%;
    left: 100%;
}
.timeline-blue:after{
    background: linear-gradient(45deg, var(--sysbio-blue), transparent);
}
.timeline-right::after {
    content: '';
    background: linear-gradient(45deg, transparent, #ccc);
    height: 1px;
    width: 50px;
    position: absolute;
    top: 50%;
    right: 100%;
}
.timeline-pink:after{
    background: linear-gradient(45deg, var(--sysbio-pink), transparent);
}
.timeline-header{
    text-transform: uppercase;
    font-size: 0.9em;
    font-weight: bold;
}
.timeline-pill{
    padding: 2px 5px;
    background: #ccc;
    border-radius: 2px;
    font-size: 0.8em;
    color: white;
    letter-spacing: .02em;
}
.timeline-body {
    font-size: 0.9em;
}

.helix-container{
    position: relative;
    height: 650px;
    width: fit-content;
    transform: rotate(180deg);
    padding: 40px 0
    /*
    transform-origin: top left;
    transform: rotate(90deg) translateY(-100%);
    */
}
.helix-container:after{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60%;
    background: linear-gradient(0deg, transparent 0%, #fafafa 80%);
}
/*
path {
    stroke-dasharray: 1.02;
    stroke-dashoffset: 1.02;
    animation-fill-mode: forwards;
}
#path1 {
    animation: drawPath 3s ease forwards;
}
#path2 {
    animation: drawPath 3.8s ease forwards;
}
#path3 {
    animation: drawPath 3s ease 2.2s forwards;  
}
#path4 {
    animation: drawPath 3s ease 3s forwards;
}
@keyframes drawPath {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0;}
}
*/
.dna-animation {
    view-timeline-name: --dna;
    view-timeline-axis: block;
}
path {
    stroke-dasharray: 1.02;
    stroke-dashoffset: 1.02;
    animation-fill-mode: both;

    
    animation-timing-function: linear;
    animation-timeline: --dna;
}
#path1 {
    animation-name: drawPath;
    animation-range: cover 10% cover 30%;
}

#path2 {
    animation-name: drawPath;
    animation-range: cover 10% cover 35%;
}

#path3 {
    animation-name: drawPath;
    animation-range: cover 30% cover 40%;
}

#path4 {
    animation-name: drawPath;
    animation-range: cover 35% cover 45%;
}
@keyframes drawPath {
    from { stroke-dashoffset: 1.02; }
    to   { stroke-dashoffset: 0; }
}
@keyframes drawPathReverse {
    from { stroke-dashoffset: -1.02; }
    to   { stroke-dashoffset: 0; }
}
#line1, #line3{
    animation-name: drawPath;
    animation-range: cover 20% cover 40%;
}
#line2, #line4{
    animation-name: drawPathReverse;
    animation-range: cover 20% cover 40%;
}


.cite{
    position: relative;
    padding: 40px;
    background: #eee;
    border-radius: 10px;
    font-family: system-ui;
    line-height: 1.5;
    flex: 1;
}
.cite:before {
    content: '“';
    position: absolute;
    color: #ccc;
    top: 15px;
    left: 10px;
    font-size: 5em;
    font-family: math;
    line-height: 1;
}

.copy-paste {
    
}

.section-item.medium {
    flex-direction: column-reverse;
    justify-content: flex-end;

    .item-copy {
        width: -webkit-fill-available;
        max-width: unset;
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .item-title {
        font-weight: bold;
        font-size: 1.2em;
    }
    .item-bg {
        width: auto;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        mix-blend-mode: darken;
        overflow: hidden;
    }
}

.partners {
    display: flex;
    gap: 20px;
    justify-content: center;
    padding: 20px 20px 40px 20px;
    flex-wrap: wrap;
    background: #eee;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
}
.partners-title {
    align-self: center;
    text-transform: uppercase;
    font-weight: bold;
    color: #ccc;
}
.partner-logo {
    height: 50px;
    mix-blend-mode: darken;
}
.partner-logo img {
    height: 50px;
}

.tabs {
    width: 300px;
    min-width: 300px;
    gap: 5px;
}
.tab {
    padding: 20px;
    background: #eee;
    margin: 0 0 0 10px;
    border-radius: 5px 0 0 5px;
    cursor: pointer;
}
.tab:hover {
    background: #ddd;
}
.tab.active {
    background: white;
    box-shadow: 2px 2px 2px 0 black;
    z-index: 1;
    margin: 0;
    cursor: default;
}
.tab-contents {
    flex: 1;
    background: white;
    z-index: 1;
    min-height: 100%;
    padding: 20px;
    border-radius: 0 5px 5px 0;
    box-shadow: 2px 2px 2px 0 black;
}
.tab-content {
    display: none !important;
}
.tab-content.active {
    display: flex !important;
}
.tab-title {
    font-weight: bold;
    font-size: 1.1em;
}

.tab-content-img-wrapper {
    text-align: center;
    padding-top: 15px;
}

::v-deep #sysBioDataCompositionbarInCellPlot {
    width: 100% !important;
    min-width: 600px;
    height: auto !important;
}

.news-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.news-item {
    gap: 10px;
}
.news-thumbnail {
    min-width: 200px;
    height: 100px;
    background: #fbfbfb;
    border: 1px solid #eee;
}
.news-thumbnail img {
    mix-blend-mode: darken;
}

.multi-bar-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.multi-bar-summary-btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.9rem;
    background-color: #eeeeee;
    border: 1px solid #cccccc;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
}

.multi-bar-summary-btn:hover {
    background-color: #cccccc;
    text-decoration: none;
}


    .circles {
        position: absolute;
        left: 50%;
        top: 50%;
        animation: rotate 60s linear infinite;
    }
    .circle {
      width: 300px;
      height: 300px;
      border-radius: 50%;
      mix-blend-mode: color-burn;
      will-change: filter;
    }
    .circle.blue {
      background: var(--sysbio-light-blue);
      transform: translateY(100px);
      animation: blur-blue 2s ease-in-out infinite alternate,
                 distance-left 30s ease-in-out infinite alternate;
    }
    .circle.pink {
      background: var(--sysbio-pink);
      transform: translateY(-100px);
      animation: blur-pink 2s ease-in-out infinite alternate,
                 distance-right 30s ease-in-out infinite alternate;
    }
    @keyframes rotate {
      from {transform: translate(-50%, -50%) rotate(90deg);}
      to {transform: translate(-50%, -50%) rotate(450deg);}
    }
    @keyframes distance-left {
      from {transform: translateY(100px) scale(0.9);}
      to {transform: translateY(50px) scale(1);}
    }
    @keyframes distance-right {
      from {transform: translateY(-100px) scale(1);}
      to {transform: translateY(-50px) scale(0.9);}
    }
    @keyframes blur-blue {
      from {filter: blur(0);}
      to {filter: blur(10px);}
    }
    @keyframes blur-pink {
      from {filter: blur(10px);}
      to {filter: blur(0);}
    }


@media (max-width: 1200px) {
    .counters {
        grid-template-columns: repeat(3, 1fr);
    }
}
@media screen and (max-width: 1010px) {
  .hero{
    overflow: clip;
  }
}
@media (max-width: 768px) {
    .hero{
        padding: 70px 30px 90px;
    }
    .hero-search {
        max-width: 100%;
    }
    .counters {
       grid-template-columns: repeat(2, 1fr);
    }
    .timeline-body{
        display:none !important;
    }
    .helix-container{
        height: 500px !important;
    }
    .timeline-item{
        padding:10px
    }
}
</style>
