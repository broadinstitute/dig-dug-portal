<template>
	<div class="front-page-body">
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-8">
						<h2>Data Registry</h2>
					</div>
					<div class="col-md-4 col filter-col-md">
						<div class="label">Edit dataset info</div>
						<div class="row">
							<div class="col-md-8">
								<input
									type="text"
									class="
										form-control form-control-sm
										input-default
									"
									placeholder="Dataset ID"
								/>
							</div>
							<div class="col-md-4">
								<button
									class="btn btn-primary btn-sm"
									type="button"
								>
									Load info
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body dr-form">
					<div class="row dr-status-section">
						<div class="col-md-6 col filter-col-md">
							<div class="label">Dataset name<sup>*</sup></div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Dataset name"
							/>
						</div>
						<div class="col-md-3 col filter-col-md">
							<div class="label">
								Dataset ID <sup>admin only</sup>
							</div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Dataset ID (admin only)"
							/>
						</div>

						<div class="col-md-3 col filter-col-md">
							<div class="label">Status<sup>*</sup></div>
							<select class="form-control">
								<option value="pre">Pre-publication</option>
								<option value="open">Open access</option>
							</select>
						</div>
					</div>
					<div class="row dr-data-update-section">
						<div class="col-md-12 col filter-col-md">
							Portal:
							{{ $parent.diseaseGroup.name.toUpperCase() + "KP" }}
							| Registered date: 00-00-0000 | Updated date:
							00-00-0000 | Any server side captured information
							here.
						</div>
					</div>
					<div class="row dr-data-section">
						<div class="col-md-12"><h4>Data</h4></div>

						<div class="col-md-9">
							<div class="row">
								<div class="col-md-3 col filter-col-md">
									<div class="label">
										Data source type<sup>*</sup>
									</div>
									<select class="form-control">
										<option value="api">API</option>
										<option value="file">File</option>
										<option value="remote">
											Remote storage
										</option>
									</select>
								</div>
								<div class="col-md-9 col filter-col-md">
									<div class="label">
										Data source<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Data source"
									/>
								</div>
							</div>
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Data type<sup>*</sup>
									</div>
									<select class="form-control">
										<option value="gwas">GWAS</option>
										<option value="exomchip">
											Exome chip
										</option>
										<option value="exomseq">
											Exome sequence analysis
										</option>
										<option value="ichip">IChip</option>
										<option value="wgs">
											Whole genome sequencing
										</option>
									</select>
								</div>
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Genome build<sup>*</sup>
									</div>
									<select class="form-control">
										<option value="hg19">
											hg19 (GRCh37)
										</option>
										<option value="hg19">GRCh38</option>
									</select>
								</div>
							</div>
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Ancestry<sup>*</sup>
									</div>
									<select class="form-control">
										<option value="ABA">
											Aboriginal Australian
										</option>
										<option value="AA">
											African American or Afro-Caribbean
										</option>
										<option value="AF">
											African unspecified
										</option>
										<option value="SSAF">
											Sub-Saharan African
										</option>
										<option value="ASUN">
											Asian unspecified
										</option>
										<option value="CA">
											Central Asian
										</option>
										<option value="EA">East Asian</option>
										<option value="SA">South Asian</option>
										<option value="SEA">
											South East Asian
										</option>
										<option value="EU">European</option>
										<option value="GME">
											Greater Middle Eastern (Middle
											Eastern, North African, or Persian)
										</option>
										<option value="HS">
											Hispanic or Latin American
										</option>
										<option value="NAM">
											Native American
										</option>
										<option value="NR">Not reported</option>
										<option value="OC">Oceanian</option>
										<option value="OTH">Other</option>
										<option value="OAD">
											Other admixed ancestry
										</option>
										<option value="Mixed">
											Mixed ancestry
										</option>
									</select>
								</div>
								<div class="col-md-6 col filter-col-md">
									<div class="label">If other ancestry</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder=""
									/>
								</div>
							</div>
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">Sex<sup>*</sup></div>
									<select class="form-control">
										<option value="mixed">Mixed</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
									</select>
								</div>
							</div>

							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Phenotypes<sup>*</sup
										><sup class="optional">
											Start typing to search
											phenotype</sup
										>
									</div>
									<phenotype-combo
										:phenotypes="$parent.fullPhenotypes"
									>
									</phenotype-combo>
								</div>
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										If other phenotypes
										<sup class="optional"
											>separate with ','</sup
										>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder=""
									/>
								</div>
							</div>
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Global sample size<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Sample size"
									/>
								</div>
								<div
									class="col-md-6 col filter-col-md"
									style="font-size: 14px"
								>
									<br />
									Learn how to calculate sample size
									<a href="javascript:;">here</a>.
								</div>
							</div>
							<div class="row dr-phenotype-samples">
								<div
									class="
										offset-md-1
										col-md-11 col
										filter-col-md
										selected-phenotypes
									"
								>
									Type 1 diabetes
								</div>
								<div
									class="
										offset-md-1
										col-md-5 col
										filter-col-md
									"
								>
									<div class="label">
										Sample size<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Sample size"
									/>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">Cases</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Cases"
									/>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">Controls</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Controls"
									/>
								</div>
							</div>
							<div class="row dr-phenotype-samples">
								<div
									class="
										offset-md-1
										col-md-11 col
										filter-col-md
										selected-phenotypes
									"
								>
									BMI adj type 1 diabetes
								</div>
								<div
									class="
										offset-md-1
										col-md-5 col
										filter-col-md
									"
								>
									<div class="label">
										Sample size<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Sample size"
									/>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">Cases</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Cases"
									/>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">Controls</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Controls"
									/>
								</div>
							</div>
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										If there is parent dataset
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Dataset ID"
									/>
								</div>
							</div>
						</div>
						<div class="col-md-3 dr-meta-info">
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Data submitter<sup>*</sup>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Data submitter"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Data submitter email<sup>*</sup>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="submitter@email"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">Data contributor</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Data contributor"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">Data contributor email</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="contributor@email"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">Institution<sup>*</sup></div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Institution"
								/>
							</div>
						</div>
					</div>
					<div class="row dr-credible-set-section">
						<div class="col-md-9">
							<h4>
								If credible set
								<sup class="optional">optional</sup>
							</h4>
							<div class="row">
								<div class="col-md-3 col filter-col-md">
									<div class="label">Data source type</div>
									<select class="form-control">
										<option value="api">API</option>
										<option value="file">File</option>
										<option value="remote">
											Remote storage
										</option>
									</select>
								</div>
								<div class="col-md-9 col filter-col-md">
									<div class="label">Data source</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Data source"
									/>
								</div>
							</div>
							<div class="row">
								<div class="col-md-9 col filter-col-md">
									<div class="label">Credible set name</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Data source"
									/>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">
										Credible set ID <sup>admin only</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Data source"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="row dr-description-section">
						<div class="col-md-9">
							<h4>Data description</h4>
							<div class="row">
								<div class="col filter-col-md">
									<div class="label">
										Description<sup>*</sup>
									</div>
									<textarea
										rows="4"
										class="form-control"
									></textarea>
								</div>
							</div>
							<div class="row">
								<div class="col-md-9 col filter-col-md">
									<div class="label">Publication</div>
									<textarea
										rows="2"
										class="form-control"
									></textarea>
								</div>
								<div class="col-md-3 col filter-col-md">
									<div class="label">PMID</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="PMID"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="card-body">
					<div class="row dr-submit-section">
						<div class="col-md-12 col filter-col-md">
							<button class="btn btn-primary" type="button">
								Submit data
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
<style scoped>
.dr-meta-info {
	border-radius: 5px;
	background-color: #eeeeee;
	padding: 15px 0 10px 0;
}
.dr-submit-section {
	text-align: center;
	border-top: solid 1px #dddddd;
	padding-top: 15px;
}
.dr-data-section,
.dr-credible-set-section,
.dr-description-section {
	padding-top: 15px;
	margin-top: 15px;
}

.dr-data-update-section {
	font-size: 14px;
}

.dr-data-section .row {
	margin-bottom: 15px;
}
.dr-form .col {
	margin-bottom: 10px;
}

.dr-form .col > div.label,
.dataset-page-header .col > div.label {
	font-weight: 700;
	font-size: 14px;
}

.selected-phenotypes {
	font-size: 14px;
	font-weight: 700;
}

.dr-form sup {
	font-size: 12px;
	color: #ff0000;
}

.dr-form sup.optional {
	font-weight: 400 !important;
	font-size: 12px;
	color: #08954a !important;
}

.dr-phenotype-samples {
	background-color: #eeeeee;
	border-radius: 5px;
	border: solid 1px #ffffff;
	padding-top: 5px;
	margin-top: -15px;
}
</style>
