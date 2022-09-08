<template>
	<div>
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
						<h2>Help book</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div
							class="col-md-8"
							v-if="$parent.pageInfo.length > 0"
						>
							<h2 v-html="$parent.pageInfo[0]['title']"></h2>
							<div v-html="$parent.pageInfo[0]['body']"></div>
						</div>
						<div class="col-md-4">
							<h3>Table of Contents</h3>
							<ol>
								<li
									v-for="(value, chapter) in $parent.helpTOC"
									:key="chapter"
								>
									<strong
										v-html="chapter"
										@click="
											$parent.getPageContent(value.nid)
										"
									></strong>
									<ol>
										<li
											v-for="page in value.pages"
											v-if="page.title != chapter"
											:key="page.nid"
											v-html="page.title"
											@click="
												$parent.getPageContent(page.nid)
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
