<template>
	<div>
		<phenotype-select v-bind:phenotypes="$parent.phenotypeMap"></phenotype-select>
		<locuszoom
			v-bind:gene="{
				 	url:
				 		'https://portaldev.sph.umich.edu/api/v1/annotation/genes/',
					params: {
						build: 'GRCh37'
					}
                 }"
			v-bind:constraint="{
					url: 'http://exac.broadinstitute.org/api/constraint'
				}"
			v-bind:ld="{
					url: 'https://portaldev.sph.umich.edu/ld/',
					params: {
						source: '1000G',
						build: 'GRCh37',
						population: 'ALL'
					}
				}"
			v-bind:recomb="{
					url:
						'https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/',
					params: {
						build: 'GRCh37'
					}
				}"
			v-bind:panels="['association', 'genes']"
		></locuszoom>
		<table cellspacing="50">
			<thead>
				<th>Phenotypes with signal in the region {{$store.state.start}} - {{$store.state.end}}</th>
				<th>Top variants for Phenotype {{$store.state.phenotype}}</th>
			</thead>
			<tbody>
				<tr>
					<td valign="top">
						<div
							style="cursor:pointer"
							@click="$store.commit('setPhenotype',row.phenotype)"
							v-for="row in $parent.phenotypesData"
						>{{row.phenotype}}</div>
					</td>
					<td valign="top">
						<table class="table table-striped" style="margin-top:20px">
							<thead class="thead-dark">
								<th>var_id</th>
								<th>p-value</th>
								<th>Consequence</th>
								<th>Effect</th>
							</thead>
							<tbody>
								<tr v-for="(row) in $parent.variantsData">
									<td>{{ row.VAR_ID }}</td>
									<td>{{ row.P_VALUE }}</td>
									<td>{{ row.Consequence }}</td>
									<td>{{ row.EFFECT }}</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>


