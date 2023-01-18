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
					<div class="col-md-12">
						<h2>Data Registry</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body dr-form">
					<div class="row dr-status-section">
						<div class="col-md-8"></div>
						<div class="col-md-4"><h4>Status</h4></div>
					</div>
					<div class="row dr-data-section">
						<div class="col-md-12"><h4>Data</h4></div>

						<div class="col-md-9">
							<div class="row">
								<div class="col-md-8 col filter-col-md">
									<div class="label">
										Dataset name<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Dataset name"
									/>
								</div>
								<div class="col-md-4 col filter-col-md">
									<div class="label">
										Dataset ID (Admin only)
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Dataset ID (Admin only)"
									/>
								</div>
							</div>
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
								<div class="col-md-4 col filter-col-md">
									<div class="label">
										Sample size<sup>*</sup>
									</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Sample size"
									/>
								</div>
								<div class="col-md-4 col filter-col-md">
									<div class="label">Cases</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder="Cases"
									/>
								</div>
								<div class="col-md-4 col filter-col-md">
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
										Phenotype<sup>*</sup>
									</div>
									<phenotype-combo
										:phenotypes="$parent.fullPhenotypes"
									>
									</phenotype-combo>
								</div>
								<div class="col-md-6 col filter-col-md">
									<div class="label">If other phenotype</div>
									<input
										type="text"
										class="form-control input-default"
										placeholder=""
									/>
								</div>
							</div>
						</div>
						<div class="col-md-3 dr-meta-info">
							<div class="col filter-col-md">
								<div class="label">
									Data submitter<sup>*</sup>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Data submitter"
								/>
							</div>
							<div class="col filter-col-md">
								<div class="label">
									Data submitter email<sup>*</sup>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="submitter@email"
								/>
							</div>
							<div class="col filter-col-md">
								<div class="label">Data contributor</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Data contributor"
								/>
							</div>
							<div class="col filter-col-md">
								<div class="label">Data contributor email</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="contributor@email"
								/>
							</div>
							<div class="col filter-col-md">
								<div class="label">Institution<sup>*</sup></div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Institution"
								/>
							</div>
						</div>
					</div>
					<div class="row dr-description-section">
						<div class="col-md-12"><h4>Data description</h4></div>
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
	background-color: #dfdfdf;
	padding: 15px 0 10px 0;
}
.dr-submit-section {
	text-align: center;
	border-top: solid 1px #dddddd;
	padding-top: 15px;
}
.dr-form .col {
	margin-bottom: 10px;
}

.dr-form .col > div.label {
	font-weight: 700;
	font-size: 14px;
}

.dr-form sup {
	font-size: 12px;
	color: #ff0000;
}
</style>
