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
							<h4>
								Data point <sup class="optional">Tutorial </sup>
							</h4>
						</div>

						<div class="col-md-12">
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
							<!--
							</div>-->

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
										v-html="''"
									></textarea>
									<!--										'{\"query\":{"type":"array","format":["ancestry","phenotype","region"],"index":"associations"},\r\n"parameters":[\r\n{"parameter":"ancestry","label":"Ancestry","type":"list","values":["EU","Mixed"]},{"parameter":"phenotype","label":"Phenotype","type":"list","values":["value_1","value_2"]},\r\n{"parameter":"region","label":"Region","type":"input"}\r\n]\r\n}'
-->
								</div>
							</div>
							<h4>
								Search UI labels<sup class="optional"
									>Optional
								</sup>
							</h4>
							<div class="row">
								<div class="col-md-12 col">
									<b-tabs>
										<b-tab title="Data points">
											<pre />
											<sup class="optional block"
												>Please add labels for data
												points one item per line in
												data_point|Label format. Ex.
												data_point_1|Data label 1
											</sup>
											<textarea
												rows="3"
												class="form-control"
											>
											</textarea>
										</b-tab>
										<b-tab title="Api parameters">
											<pre />
											<sup class="optional block"
												>Please add labels for the API
												parameters with 'list' type
												options. One value|Label pair
												per line.
											</sup>
											<div class="label">ancestry</div>
											<textarea
												rows="3"
												class="form-control"
											>
											</textarea>
											<div class="label">phenotype</div>
											<textarea
												rows="3"
												class="form-control"
											>
											</textarea>
										</b-tab>
									</b-tabs>
								</div>
							</div>

							<h4>Data table format</h4>
							<div class="row">
								<div class="col-md-12 col">
									<b-tabs>
										<b-tab title="Builder">
											<pre />
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
											<h5>Data convert</h5>

											<div class="row dr-builder-ui">
												<div class="col-md-2 col">
													<div class="label">
														Type
													</div>
													<select
														class="form-control"
													>
														<option value="">
															Array to string<sup
																>*</sup
															>
														</option>
														<option value="">
															Calculate
														</option>
														<option value="">
															Join
														</option>
														<option value="">
															Join multi
														</option>
														<option value="">
															Raw
														</option>
														<option value="">
															Replace characters
														</option>
														<option value="">
															Score columns
														</option>
													</select>
												</div>
												<div class="col-md-3 col">
													<div class="label">
														Select field(s)
														<sup class="optional"
															>Set weight to
															select
														</sup>
													</div>
													<ul
														class="
															dr-byor-data-columns
														"
													>
														<li>
															CHR<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
														<li>
															POS<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
														<li>
															REF<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
														<li>
															ALT<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
														<li>
															RSID<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
														<li>
															PVAL<label>
																<select
																	class="
																		form-control
																	"
																>
																	<option>
																		None
																	</option>
																	<option>
																		0
																	</option>
																	<option>
																		1
																	</option>
																	<option>
																		2
																	</option>
																	<option>
																		3
																	</option>
																	<option>
																		4
																	</option>
																	<option>
																		5
																	</option>
																</select></label
															>
														</li>
													</ul>
												</div>
												<div class="col-md-3 col">
													<div class="label">
														Join by
													</div>
													<ul
														class="
															dr-byor-data-columns
														"
													>
														<li>
															CHR<label
																><input
																	type="text"
																	class="
																		form-control
																		input-default
																	"
																/>
															</label>
														</li>
														<li>
															POS<label>
																<input
																	type="text"
																	class="
																		form-control
																		input-default
																	"
															/></label>
														</li>
														<li>
															REF<label>
																<input
																	type="text"
																	class="
																		form-control
																		input-default
																	"
															/></label>
														</li>
														<li>
															ALT<label>
																<input
																	type="text"
																	class="
																		form-control
																		input-default
																	"
															/></label>
														</li>
													</ul>
												</div>
												<div class="col-md-2 col">
													<div class="label">
														New field name
													</div>
													<ul>
														<li>CHR</li>
														<li>POS</li>
														<li>REF</li>
														<li>ALT</li>
													</ul>
												</div>
												<div class="col-md-2 col">
													<div class="label">
														New field name
													</div>
													<ul>
														<li>CHR</li>
														<li>POS</li>
														<li>REF</li>
														<li>ALT</li>
													</ul>
												</div>
											</div>
										</b-tab>
										<b-tab title="Manual build">
											<pre />
											<textarea
												rows="6"
												class="form-control"
												v-html="
													'{\r\n\'top rows\':[]\r\n\'}'
												"
											>
											</textarea>
										</b-tab>
									</b-tabs>
								</div>
							</div>
							<h4>
								Data comparison
								<sup class="optional"
									>Optional for only daynamic data points |
									Tutorial
								</sup>
							</h4>
							<div class="row">
								<div class="col-md-12 col">
									<div class="label">Key field</div>
									<div class="form-check form-check-inline">
										<input
											class="form-check-input"
											type="radio"
											value=""
											id="flexCheckDefault"
										/>
										<label
											class="form-check-label"
											for="flexCheckDefault"
										>
											Field 1
										</label>
									</div>
									<div class="form-check form-check-inline">
										<input
											class="form-check-input"
											type="radio"
											value=""
											id="flexCheckDefault"
										/>
										<label
											class="form-check-label"
											for="flexCheckDefault"
										>
											Field 2
										</label>
									</div>
									<div class="form-check form-check-inline">
										<input
											class="form-check-input"
											type="radio"
											value=""
											id="flexCheckDefault"
										/>
										<label
											class="form-check-label"
											for="flexCheckDefault"
										>
											Field 3
										</label>
									</div>
									<div class="form-check form-check-inline">
										<input
											class="form-check-input"
											type="radio"
											value=""
											id="flexCheckDefault"
										/>
										<label
											class="form-check-label"
											for="flexCheckDefault"
										>
											Field 4
										</label>
									</div>
								</div>
								<div class="col-md-12 col">
									<div class="label">
										Fields group data key
										<sup class="optional"
											>Query parameters
										</sup>
									</div>
									<div class="form-check form-check-inline">
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
											ancestry
										</label>
									</div>
									<div class="form-check form-check-inline">
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
											phenotype
										</label>
									</div>
									<div class="form-check form-check-inline">
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
											region
										</label>
									</div>
								</div>
								<div class="col-md-12 col">
									<div class="label">Fields to compare</div>
									<div class="form-check form-check-inline">
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
											Field 1
										</label>
									</div>
									<div class="form-check form-check-inline">
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
											Field 2
										</label>
									</div>
									<div class="form-check form-check-inline">
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
											Field 3
										</label>
									</div>
									<div class="form-check form-check-inline">
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
											Field 4
										</label>
									</div>
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
					<div class="row dr-meta-info">
						<div class="col-md-4 col filter-col-md">
							<div class="label">Page Mode<sup>*</sup></div>
							<select class="form-control">
								<option value="">Unpublished</option>
								<option value="">Review or development</option>
								<option value="">Public</option>
							</select>
						</div>
						<div class="col-md-4 col filter-col-md">
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
						<div class="col-md-4 col filter-col-md">
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
					</div>
					<div class="row dr-meta-info">
						<div class="col-md-6 col filter-col-md">
							<div class="label">
								Research method node ID
								<sup class="optional"
									><a href="javascript:;">Tutorial</a></sup
								>
							</div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Dev ID"
							/>
						</div>
						<div class="col-md-6 col filter-col-md">
							<div class="label">
								Page header menu node ID
								<sup class="optional"
									><a href="javascript:;">Tutorial</a></sup
								>
							</div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="Dev password"
							/>
						</div>
					</div>
					<div class="row dr-meta-info">
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
									Show on BYOR front
								</label>
							</div>
						</div>
						<div class="col-md-8 col filter-col-md">
							<div class="label">
								URL to the page
								<sup class="optional"
									>ex.
									/research.html?pageid=kp_variant_sifter&phenotype=T2D&region=17:40719090-40725257</sup
								>
							</div>
							<input
								type="text"
								class="form-control input-default"
								placeholder="URL"
							/>
						</div>
						<div class="col-md-4 col filter-col-md">
							<div class="label">
								Image to show on BYOR front
								<sup class="optional block"
									>2MB limit. png, gif, jpg or jpeg olny</sup
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
						<div class="col-md-8 col filter-col-md">
							<div class="label">Project summary</div>
							<textarea rows="4" class="form-control"></textarea>
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
										>The summary of Page Description field
										will show on Projects page if checked.
										Please set only 1 page per project as a
										project landing page.</sup
									>
								</label>
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
	margin-bottom: 5px;
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

.dr-builder-ui {
	padding: 5px 15px;
}

.dr-builder-ui > div {
	border-right: solid 1px #dddddd;
	padding-top: 15px;
	padding-bottom: 15px;
	background-color: #eeeeee;
}

.dr-builder-ui > div:first-child {
	border: solid 1px #ddd;
	border-top-left-radius: 5px;
	border-bottom-left-radius: 5px;
}
.dr-builder-ui > div:last-child {
	border: solid 1px #ddd;
	border-left: none;
	border-top-right-radius: 5px;
	border-bottom-right-radius: 5px;
}

ul.dr-byor-data-columns {
	list-style: none;
	padding: 0;
}
ul.dr-byor-data-columns > li {
	position: relative;
	display: block;
}
ul.dr-byor-data-columns > li > label {
	display: block;
	position: absolute;
	top: 0;
	right: 0px;
}

ul.dr-byor-data-columns > li > label > select,
ul.dr-byor-data-columns > li > label > input[type="text"] {
	font-size: 12px;
	padding: 0 5px;
	height: 22px;
}
</style>
