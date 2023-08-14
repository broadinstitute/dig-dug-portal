<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-9">
						<h2
							v-if="$parent.pageInfo.length > 0"
							v-html="$parent.pageInfo[0]['title']"
						></h2>
					</div>
					<div class="col-md-3">
						<div class="input-group">
							<input
								type="text"
								class="form-control"
								placeholder="Search"
								aria-label="Search"
								aria-describedby="basic-addon1"
								v-model="$store.state.searchKey"
							/>
							<div class="input-group-append">
								<button
									class="btn btn-primary"
									type="button"
									@click="$parent.searchHelpBook()"
								>
									<b-icon-search></b-icon-search>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div
							class="col-md-9"
							v-if="
								$parent.pageInfo.length > 0 ||
								!!$parent.searchResults
							"
						>
							<div
								id="search_results"
								class="search-results hidden"
							>
								<div
									class="search-results-close"
									@click="$parent.hideSearch()"
								>
									<b-icon icon="x-circle-fill"></b-icon>
								</div>
								<h4>
									<em>{{ this.$store.state.searchedKey }}</em>
									appears in the following documents:
								</h4>
								<ol>
									<template
										v-for="value in $parent.searchResults"
									>
										<li :key="value.nid">
											<a
												:href="
													'/help.html?page=' +
													value.nid
												"
												>{{ value.title }}</a
											>
										</li>
									</template>
								</ol>
							</div>
							<div v-html="$parent.pageInfo[0]['body']"></div>
						</div>
						<div class="col-md-3">
							<h3>Table of Contents</h3>
							<ol>
								<li
									v-for="(value, chapter) in $parent.helpTOC"
									:key="chapter"
									:id="'chapter_' + value.nid"
									class="chapter closed"
								>
									<span
										v-html="chapter"
										@click="
											$parent.getPageContent(
												value.nid,
												'chapter_' + value.nid
											)
										"
									></span>
									<ol>
										<li
											v-for="page in value.pages"
											v-if="page.title != chapter"
											:key="page.nid"
											v-html="page.title"
											@click="
												$parent.getPageContent(
													page.nid,
													null
												)
											"
										></li>
									</ol>
								</li>
							</ol>
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
.chapter {
	font-weight: 400;
}

.chapter ol {
	font-weight: 300;
}
.chapter.closed ol {
	display: none;
}

.chapter.open ol {
	display: block;
}

.chapter,
.chapter li {
	color: #0097d6;
}

.chapter:hover,
.chapter li:hover {
	color: #0077b6;
	cursor: pointer;
}
.search-results {
	background-color: #eee;
	border: solid 1px #ccc;
	border-radius: 5px;
	padding: 15px 25px;
	margin-bottom: 15px;
}

.search-results li {
	font-size: 13px;
	padding: 10px 0px;
	border-bottom: solid 1px #ddd;
}

.search-results li > a {
	font-size: 16px;
}

.search-results-close {
	position: absolute;
	top: 5px;
	right: 25px;
	color: #999999;
}

.search-results-close:hover {
	cursor: pointer;
	color: #000000;
}
</style>
