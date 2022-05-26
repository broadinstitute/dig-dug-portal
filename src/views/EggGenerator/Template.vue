<template>
	<body onload="init()" class="kp-default">
    <header>
        <img class="mdkp-logo" id="eggserverLogo" src="images/egg_server_logo.svg" alt="EGG Server logo"/>
        <h1>
            <!--Bolded initials to emphasize "EGG."-->
            <strong>E</strong>xome <strong>G</strong>ene-level <strong>G</strong>roup-file Server
        </h1>
        <div id="lunarisBranding">
            <div id="lunarisHeader"><span>Powered by</span> <span>Lunaris</span></div>
            <img id="lunarisLogo" src="images/lunaris_logo_white.svg" alt="Lunaris logo"/>
        </div>
    </header>
    
<div id="gait">
    <!-- This is for eggserver, but uses same styling as GAIT-->
    <div class="container-fluid mdkp-body">
        <div class="card mdkp-card">
            <div class="row card-body">
                <div class="col-md-9">
                    <p>The <strong>Exome Gene-Level Group-File Generator</strong> is designed to, based on a user-provided location-sorted list of exome variants, annotate variants using the 
                        <a href="https://www.ensembl.org/info/docs/tools/vep/index.html" target="_blank" rel="noopener noreferrer"> Ensembl Variant Effect Predictor (VEP)</a> 
                        and generate group files to run gene-level association tests using rareMETALS or EPACTS format. Users can define masks based on annotations, or use one of the <a href="https://www.nature.com/articles/s41586-019-1231-2" target="_blank" rel="noopener noreferrer">published masks provided</a>.
                    </p>
                    <p> To download group files for UK BioBank 50k Exome release (2019), click
                        <a href="https://storage.googleapis.com/eggserver-data/examples/output/UKBBw1.ALL.variant.groupfiles.raremetals.tar" download="UKBBw1.ALL.variant.groupfiles.raremetals.tar">here</a> for rareMETALS and
                        <a href="https://storage.googleapis.com/eggserver-data/examples/output/UKBBw1.ALL.variant.groupfiles.epacts.tar" download="UKBBw1.ALL.variant.groupfiles.epacts.tar">here</a> for EPACTS format.
                    </p>
                </div>
                <!--div class="divider col"></div-->
                <div class="col-md-3" id="statuschecker">
                    <h4>Check status</h4>
                    <label for="sessioninput">Session ID</label>
                    <div class="centering">
                        <div class="placeholder"></div>
                        <input type="text" class="form-control" id="sessioninput" name="sessioninput" size="8">
                        <div class="placeholder"></div>
                    </div>
                    <div class="centering">
                        <div class="placeholder"></div>
                        <div class="message-area" id="session-invalid"></div>
                        <div class="placeholder"></div>
                    </div>
                    <div class="centering">
                        <div class="placeholder"></div>
                        <button class="btn btn-primary" onclick="getIdAndLoadSession()">Load</button>
                        <div class="placeholder"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card mdkp-card">
            <div class="card-body">
                <h4 class="card-title">Create job</h4>
                <div role="tablist" class="accordion">
                    <div class="card mb-1">
                        <header role="tab" class="card-header p-1">
                            <button type="button" class="btn btn-outline-primary btn-block not-collapsed" aria-expanded="true" aria-controls="accordion-1">Source file 
                                <div class="criteria">
                                    <span class="badge filter-pill-mask" id="inputfile-badge"></span>
                                    <span class="badge filter-pill-mask" id="hg-badge"></span>
                                </div>
                            </button>
                        </header>
                        <div id="accordion-1" role="tabpanel" class="collapse show">
                            <div class="card-body">
                                <div role="alert" aria-live="polite" aria-atomic="true" class="alert alert-info">
                                    Please upload a data file and select a reference genome to be used
                                </div>
                                <span>
                                    <div>
                                        <div class="filtering-ui-wrapper container-fluid">
                                            <div class="row filtering-ui-content">
                                                <div class="col filter-col-md" style="padding: 5px 7px;">
                                                    <div class="label">Upload a file</div>
                                                    <div data-v-06e3dc2f="">
                                                        <div data-v-06e3dc2f="" class="input-group">
                                                            <label class="form-control">Choose File
                                                                <input class="form-control has-badge" type="file" id="inputfile" name="myfile" accept=".vcf">
                                                            </label>
                                                        </div>
                                                        <div data-v-06e3dc2f="" class="list-group shadow vbt-autcomplete-list" style="width: 220px; display: none;">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col filter-col-md" style="padding: 5px 7px;">
                                                    <div class="label">Reference Genome</div>
                                                    <div data-v-06e3dc2f="">
                                                        <div data-v-06e3dc2f="" class="input-group">
                                                            <select class="form-control has-badge" name="hg" id="hg" placeholder="Choose Genome">
                                                                <option>-- Choose genome --</option>
                                                                <option>hg19</option>
                                                                <option>hg38</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </span>
                                <strong>Requirements</strong>
                                <ul>
                                    <li>File must be formatted in VCF format</li>
                                    <li>Data must be sorted by location</li>
                                    <li>At least first five columns of what(?)</li>
                                    <li>Download example input file: <a href="predictor/sample_input.vcf" download="sample_input.vcf">sample_input.vcf</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-1">
                        <header role="tab" class="card-header p-1">
                            <button type="button" class="btn btn-outline-primary btn-block not-collapsed" aria-expanded="true" aria-controls="accordion-1">Mask
                                <div class="criteria">
                                    <span class="badge filter-pill-mask" id="formats-badge"></span>
                                </div>
                            </button>
                        </header>
                        <div class="card-body">
                        <ul>
                            <li>Enclose field names in backticks.</li>
                            <li>Backticks may be omitted if field name contains no whitespace; starts with letter or underscore; and contains only letters, digits and underscores.</li>
                            <li>Enclose string values in double-quotes.</li>
                            <li>Using field tests written as name-operator-value (e.g. REF == "A"), build Boolean expressions using AND, OR and parentheses.</li>
                        </ul>
                        <p>You can:</p>
                        <ol>
                            <li>Use a pre-defined mask.</li>
                            <li>Start with a pre-defined mask as a template and edit it.</li>
                            <li>Start building from scratch by typing in the editor.</li>
                        </ol>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="tabs filtering-ui-wrapper" id="__BVID__12">
                                    <div id="mask-subtabs">
                                        <ul role="tablist" class="nav nav-tabs" id="__BVID__12__BV_tab_controls_">
                                            <li role="presentation" class="nav-item">
                                                <a role="tab" aria-selected="true" aria-setsize="2" aria-posinset="1" aria-controls="__BVID__13" href="#" target="_self" class="nav-link active">Load predefined mask</a>
                                            </li>
                                            <li role="presentation" class="nav-item">
                                                <a role="tab" tabindex="-1" aria-selected="false" aria-setsize="2" aria-posinset="2" href="#" target="_self" class="nav-link" id="__BVID__16___BV_tab_button__" aria-controls="__BVID__16">Fields & operators</a>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="tab-content mt-3" id="__BVID__12__BV_tab_container_">
                                        <div role="tabpanel" class="centering tabpane" id="__BVID__13">
                                            <div class="placeholder"></div>
                                            <label for="masks">Mask
                                                <select class="form-control" name="masks" id="masks">
                                                    <option value="">-- Choose mask --</option>
                                                </select>
                                            </label>
                                            <div class="placeholder"></div>
                                        </div>
                                        Check out predefined masks as examples.
                                        <div role="tabpanel" class="tabpane centering" id="__BVID__16">
                                            <div class="placeholder"></div>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <td colspan="2"><h6>Available fields</h6></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Field</td>
                                                        <td>Possible values</td>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>MAF</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>LoF</td>
                                                        <td>HC, LC</td>
                                                    </tr>
                                                    <tr>
                                                        <td>VEST3_rankscore</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>CADD_raw_rankscore</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>DANN_rankscore</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Eigen-PC-raw_rankscore</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>FATHMM_pred</td>
                                                        <td>D, T</td>
                                                    </tr>
                                                    <tr>
                                                        <td>fathmm-MKL_coding_pred</td>
                                                        <td>D, T</td>
                                                    </tr>
                                                    <tr>
                                                        <td>PROVEAN_pred</td>
                                                        <td>D, N</td>
                                                    </tr>
                                                    <tr>
                                                        <td>MetaSVM_pred</td>
                                                        <td>D, T</td>
                                                    </tr><tr>
                                                        <td>MetaLR_pred</td>
                                                        <td>D, T</td>
                                                    </tr>
                                                    <tr>
                                                        <td>M-CAP_score</td>
                                                        <td>0-1</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Polyphen2_HDIV_pred</td>
                                                        <td>D, P, B</td>
                                                    </tr><tr>
                                                        <td>Polyphen2_HVAR_pred</td>
                                                        <td>D, P, B</td>
                                                    </tr>
                                                    <tr>
                                                        <td>SIFT_pred</td>
                                                        <td>D, T</td>
                                                    </tr><tr>
                                                        <td>LRT_pred</td>
                                                        <td>D, N, U</td>
                                                    </tr>
                                                    <tr>
                                                        <td>MutationTaster_pred</td>
                                                        <td>A, D, N, P</td>
                                                    </tr><tr>
                                                        <td>IMPACT</td>
                                                        <td>HIGH, MODERATE, LOW</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table>
                                                <thead>
                                                <tr>
                                                    <td colspan="2"><h6>Available operators</h6></td>
                                                </tr>
                                                <tr>
                                                    <td>Operator</td>
                                                    <td>Definition</td>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>==</td>
                                                        <td>equals</td>
                                                    </tr>
                                                    <tr>
                                                        <td>!=</td>
                                                        <td>does not equal</td>
                                                    </tr>
                                                    <tr>
                                                        <td>~</td>
                                                        <td>contains regex</td>
                                                    </tr>
                                                    <tr>
                                                        <td>!~</td>
                                                        <td>does not contain regex</td>
                                                    </tr>
                                                    <tr>
                                                        <td>~=</td>
                                                        <td>matches regex</td>
                                                    </tr>
                                                    <tr>
                                                        <td>!~=</td>
                                                        <td>does not match regex</td>
                                                    </tr>
                                                    <tr>
                                                        <td>&lt;</td>
                                                        <td>less than</td>
                                                    </tr>
                                                    <tr>
                                                        <td>&le;</td>
                                                        <td>less or equal</td>
                                                    </tr>
                                                    <tr>
                                                        <td>&gt;</td>
                                                        <td>greater than</td>
                                                    </tr>
                                                    <tr>
                                                        <td>&ge;</td>
                                                        <td>greater or equal</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="placeholder"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="clear-mask-div">
                            <label>
                                <button class="form-control" onclick="resetFilters()">Clear Mask</button>
                            </label>
                        </div>
                        <p id="code_mirror_parent"></p>
                        <div class="centering">
                            <div class="placeholder"></div>
                            <label id="output-format">Output format
                                <select class="form-control has-badge" name="formats" id="formats">
                                    <option>-- Choose format --</option>
                                    <option value="rareMETALS">list/rareMETALS</option>
                                    <option value="EPACTS">EPACTS</option>
                                </select>
                            </label>
                            <div class="placeholder"></div>
                        </div>
                            <div class="centering">
                                <div class="placeholder"></div>
                                <button class="btn btn-secondary" onclick="saveJob()">Save job</button>
                                <button class="btn btn-primary" onclick = "saveJobAndCreateNew()">Save job and create new job</button>
                                <div class="placeholder">
                                </div>
                        </div>
                            <div class="centering">
                                <div class="placeholder"></div>
                                <div id="save-job-message"></div>
                                <div class="placeholder"></div>
                            </div>
                    </div>
                </div>
                    <div class="card mb-1">
                        <header role="tab" class="card-header p-1">
                            <button type="button" class="btn btn-outline-primary btn-block not-collapsed" aria-expanded="true" aria-controls="accordion-1">Submit jobs 
                                <div class="criteria">
                                    <span class="badge filter-pill-mask" id="email-badge"></span>
                                </div>
                            </button>
                        </header>
                        <table>
                            <thead>
                                <tr>
                                    <td>Input file</td>
                                    <td>Reference genome</td>
                                    <td>Mask</td>
                                    <td>Output format</td>
                                </tr>
                            </thead>
                            <tbody id="submit-table-body">
                            </tbody>
                        </table>
                        <div class="centering submit-fields">
                            <div class="placeholder"></div>
                            <label for="email">E-mail to receive notification <span class="asterisk">*</span>
                                <input class="form-control has-badge" type="email" name="email" id="email">
                            </label>
                            <label>Session description <span class="asterisk">*</span>
                                <input class="form-control" type="textarea" name="session-desc" id="session-desc">
                            </label>
                            <div class="placeholder"></div>
                        </div>
                        <div class="centering">
                            <div class="placeholder"></div>
                            <div class="message-area" id="email-invalid"></div>
                            <div class="placeholder"></div>
                        </div>
                        <div class="centering">
                            <div class="placeholder"></div>
                            <button class="btn btn-secondary" onclick="submitAll()">Submit jobs</button>
                            <div class="placeholder"></div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
        <div class="card mdkp-card">
            <div class="card-body">
                <h4 class="card-title">Status</h4>
                <div class="card" id="statuscard">
                    <p>Session id is <b><span id="session_id_area"></span></b>.</p>
                    <p>
                        <span id="statusUpdatesPlaceholder">Submit time & any information regarding the session</span>
                    </p>
                    <table>
                        <thead>
                            <tr>
                                <td>Input file</td>
                                <td>Reference genome</td>
                                <td>Mask</td>
                                <td>Output format</td>
                                <td>Output file</td>
                                <td>Restore job</td>
                            </tr>
                        </thead>
                        <tbody id="submission_area">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mdkp-footer">
    <a>Powered by Lunaris Version 3.7.3. Copyright 2020-22 Broad Institute</a>
</div>
</body>
</template>

<style>
@import url("/css/eggserver.css");
@import url("/css/codemirror.css");
@import url("/css/liquibyte.css");
</style>
