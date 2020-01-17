<template>
	<!-- Menu header-->
	<div class="container-fluid">
		<div class="row amp-header">
			<div class="amp-banner-right">
				<div class="amp-banner-left">
					<a
						href="http://www.nih.gov/research-training/accelerating-medicines-partnership-amp/type-2-diabetes"
					>ACCELERATING MEDICINES PARTNERSHIP (AMP)</a>
				</div>
			</div>
		</div>
		<div class="row mdkp-header">
			<div class="mdkp-logo-wrapper col-md-4">
				<img src="images/MDKP_header_logo.svg" class="mdkp-logo" />
			</div>
			<div class="mdkp-menu-wrapper col-md-8">
				<ul class="mdkp-menu">
					<li>
						<a href>Home</a>
					</li>
					<li>
						<a href>Data</a>
					</li>
					<li>
						<a href>Analysis Modules</a>
					</li>
					<li>
						<a href>Disease Specific Resources</a>
					</li>
					<li>
						<a href>Contacts</a>
					</li>
					<li v-if="user">
						<a href="/logout" class="mdkp-login">Logout</a>
					</li>
					<li v-else>
						<a href="/login" class="mdkp-login">Login</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";
Vue.use(VueCookies);

export default Vue.component("page-header", {
	data() {
		return {};
	},
	created() {
		//simple cookie check for now
		this.user = Vue.$cookies.isKey("email") || false;
	}
});
</script>
