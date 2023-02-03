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
						<h2>BYOR Configuration Builder</h2>
					</div>
					<div class="col-md-4 col filter-col-md">
						<div class="label">Edit configuration</div>
						<div class="row">
							<div class="col-md-7">
								<input
									type="text"
									class="
										form-control form-control-sm
										input-default
									"
									placeholder="Page ID"
								/>
							</div>
							<div class="col-md-5">
								<button
									class="btn btn-primary btn-sm"
									type="button"
								>
									Load configuration
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body dr-form">
					<div class="row dr-data-update-section">
						<div class="col-md-12 col filter-col-md">
							User ID | Created date: 00-00-0000 | Updated date:
							00-00-0000 | Any server side captured information
							here.
						</div>
					</div>
					<div class="row dr-status-section">
						<div class="col-md-8 col filter-col-md">
							<div class="label">Title<sup>*</sup></div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Title"
							/>
						</div>
						<div class="col-md-4 col filter-col-md">
							<div class="label">Page ID <sup>*</sup></div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Page ID"
							/>
							<sup class="optional block"
								>No special charaters. No white space. Has to be
								unique.
								<a href="javascript:;"
									>Learn how to make unique page ID here.</a
								></sup
							>
						</div>
					</div>

					<div class="row dr-data-section">
						<div class="col-md-12">
							<h4>Data <sup class="optional">Tutorial </sup></h4>
						</div>

						<div class="col-md-9">
							<div class="row">
								<div class="col-md-6 col filter-col-md">
									<div class="label">Data type</div>
									<select class="form-control">
										<option value="">No data</option>
										<option value="">CSV</option>
										<option value="">JSON</option>
										<option value="">BioIndex</option>
										<option value="">
											Direct input(csv)
										</option>
									</select>
								</div>
								<div class="col-md-6 col filter-col-md">
									<div class="label">
										Open remote storage to upload data files
									</div>
									<div class="label">
										<button
											class="btn btn-primary btn-sm"
											type="button"
										>
											Open
										</button>
									</div>
								</div>
							</div>
							<div class="row">
								<div class="col-md-12 col filter-col-md">
									<div class="label">
										Data point(s)
										<sup class="optional"
											>Or actual data incase of direct
											input(csv) data type.
										</sup>
									</div>
									<textarea rows="6" class="form-control">
data_point1.csv,data_point2.csv,data_point3.csv,data_point4.csv</textarea
									>
								</div>
							</div>
							<div class="row dr-sub-category">
								<div
									class="
										offset-md-1
										col-md-11 col
										filter-col-md
										dr-data-point-label
									"
								>
									<div class="row">
										<div class="col-md-5 label">
											Data point(s)
										</div>
										<div class="col-md-7 label">Label</div>
									</div>
								</div>
								<div
									class="
										offset-md-1
										col-md-11 col
										filter-col-md
									"
								>
									<div class="row">
										<div class="col-md-5 label">
											data_point1.csv
										</div>
										<div class="col-md-7 label">
											<input
												type="text"
												class="
													form-control
													input-default
												"
												placeholder="data point1"
											/>
										</div>
									</div>
									<div class="row">
										<div class="col-md-5 label">
											data_point2.csv
										</div>
										<div class="col-md-7 label">
											<input
												type="text"
												class="
													form-control
													input-default
												"
												placeholder="data point2"
											/>
										</div>
									</div>
									<div class="row">
										<div class="col-md-5 label">
											data_point3.csv
										</div>
										<div class="col-md-7 label">
											<input
												type="text"
												class="
													form-control
													input-default
												"
												placeholder="data point3"
											/>
										</div>
									</div>
									<div class="row">
										<div class="col-md-5 label">
											data_point4.csv
										</div>
										<div class="col-md-7 label">
											<input
												type="text"
												class="
													form-control
													input-default
												"
												placeholder="data point4"
											/>
										</div>
									</div>
								</div>
							</div>

							<div class="row">
								<div class="col-md-4 col filter-col-md">
									<div class="form-check">
										<input
											class="form-check-input"
											type="checkbox"
											value=""
											id="flexCheckDefault"
										/>
										<label
											class="form-check-label"
											for="flexCheckDefault"
										>
											Is data point(s) dynamic
										</label>
									</div>
								</div>
								<div class="col-md-8 col filter-col-md">
									<div class="label">
										API parameters
										<sup class="optional"
											>If data point(s) dynamic
										</sup>
									</div>
									<textarea
										rows="3"
										class="form-control"
									></textarea>
								</div>
							</div>
							<h4>Data table format</h4>
							<div class="row">
								<div class="col-md-12 col">
									<b-tabs>
										<b-tab title="Builder">
											<div class="row">
												<div
													class="
														col-md-12 col
														filter-col-md
													"
												>
													<div class="label">
														Place first few rows of
														your data (including the
														header row) in csv
														format here
													</div>
													<textarea
														rows="3"
														class="form-control"
														v-html="
															'CHR,POS,REF,ALT,RSID,PVAL\r\n1,721290,G,C,rs12565286,3.8345e-02\r\n1,976963,A,G,rs150359724,4.3785e-03\r\n1,1120431,G,A,rs1320571,2.3373e-02\r\n'
														"
													>
													</textarea>
												</div>
											</div>
										</b-tab>
										<b-tab title="Manul build"> </b-tab>
									</b-tabs>
								</div>
							</div>
						</div>

						<div class="col-md-3 dr-meta-info">
							<div class="col-md-12 col filter-col-md">
								<div class="label">Page Mode<sup>*</sup></div>
								<select class="form-control">
									<option value="">Unpublished</option>
									<option value="">
										Review or development
									</option>
									<option value="">Public</option>
								</select>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Dev ID
									<sup class="optional"
										>If page mode in review or dev</sup
									>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Dev ID"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Dev password
									<sup class="optional"
										>If page mode in review or dev</sup
									>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Dev password"
								/>
							</div>
							<hr />
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Research method node ID
									<sup class="optional"
										><a href="javascript:;"
											>Tutorial</a
										></sup
									>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Dev ID"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Page header menu node ID
									<sup class="optional"
										><a href="javascript:;"
											>Tutorial</a
										></sup
									>
								</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="Dev password"
								/>
							</div>
							<hr />
							<div class="col-md-12 col filter-col-md">
								<div class="form-check">
									<input
										class="form-check-input"
										type="checkbox"
										value=""
										id="flexCheckDefault"
									/>
									<label
										class="form-check-label"
										for="flexCheckDefault"
									>
										Show on BYOR front
									</label>
								</div>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">Project summary</div>
								<textarea
									rows="4"
									class="form-control"
								></textarea>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">URL to the page</div>
								<input
									type="text"
									class="form-control input-default"
									placeholder="URL"
								/>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="label">
									Image to show on BYOR front
									<sup class="optional block"
										>2MB limit. png, gif, jpg or jpeg
										olny</sup
									>
									<div class="col-md-12 col filter-col-md">
										<button
											class="btn btn-primary btn-sm"
											type="button"
										>
											Choose file
										</button>
									</div>
								</div>
							</div>
							<div class="col-md-12 col filter-col-md">
								<div class="form-check">
									<input
										class="form-check-input"
										type="checkbox"
										value=""
										id="flexCheckDefault"
									/>
									<label
										class="form-check-label"
										for="flexCheckDefault"
									>
										Is project landing page <br />
										<sup class="optional block"
											>The summary of Page Description
											field will show on Projects page if
											checked. Please set only 1 page per
											project as a project landing
											page.</sup
										>
									</label>
								</div>
							</div>
						</div>
					</div>

					<div class="row dr-description-section">
						<div class="col-md-12">
							<h4>Page description</h4>
							<div class="row">
								<div class="col filter-col-md">
									<div class="label">
										Description<sup>*</sup>
									</div>
									<textarea
										rows="6"
										class="form-control"
									></textarea>
								</div>
							</div>
							<div class="row">
								<div class="col-md-12 col filter-col-md">
									<div class="label">Page style</div>
									<textarea
										rows="3"
										class="form-control"
									></textarea>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="card-body">
					<div class="row dr-submit-section">
						<div class="col-md-12 col filter-col-md">
							<button class="btn btn-primary" type="button">
								Save configuration
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

.dr-data-point-label {
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

.dr-form sup.optional.block {
	display: block;
	line-height: 120%;
	margin-top: 0.7em;
}

.dr-sub-category {
	background-color: #eeeeee;
	border-radius: 5px;
	border: solid 1px #ffffff;
	padding-top: 5px;
	margin-top: -15px;
}
</style>
