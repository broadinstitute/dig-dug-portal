<template>
	<div class="front-page-body">
		<div class="byor-header-logo-wrapper">
			<a href="/index.html"
				><img
					src="/images/byor/byor_logo_header.svg"
					class="byor-header-logo"
			/></a>
			<span class="byor-header-tagline"
				>A toolbox for presenting your results</span
			>
		</div>
		<div class="front-page-menu">
			<a href="/research.html?pageid=about_byor">About</a
			><a href="https://hugeampkpncms.org/tutorial">Tutorial</a
			><a href="/research.html?pageid=demo_home_70">Demo Portal</a
			><a href="https://hugeampkpncms.org/user">Login to configure</a>
		</div>
		<div class="container-fluid front-page-banner">
			<div class="banner-logo-wrapper">
				<img
					src="/images/byor/byor_logo.svg"
					class="front-page-banner-logo-big"
				/>
				<span class="byor-banner-tagline"
					>A toolbox <br />for presenting <br />your results</span
				>
			</div>
			<div class="front-page-banner-icons-wrapper">
				<a href="https://hugeamp.org/collaborate.html"
					><img
						src="/images/byor/contribute_icon_w.svg"
						class="front-page-banner-icon"
					/><span>Contribute results</span></a
				><a href="/research.html?pageid=about_byor"
					><img
						src="/images/byor/create_icon_w.svg"
						class="front-page-banner-icon"
					/><span
						>Create your own Research <br />Page or Research
						Portal</span
					></a
				>
			</div>
			<div class="what-is-byor">
				<h3>What is BYOR?</h3>
				<p>
					The BYOR (Bring Your Own Results) platform lets you easily
					and rapidly create web pages or portals to share your
					results with reviewers, collaborators, or the world. It
					comes with auto generated sortable datatable, data filters
					and visualizers, that you can add to your pages with no or
					simple configurations.
					<br />
					<a
						href="https://hugeampkpncms.org/tutorial"
						style="color: #fff !important"
						>— Learn more</a
					>
				</p>
			</div>
		</div>

		<div class="container-fluid front-page-content-wrapper">
			<research-byor-projects> </research-byor-projects>
		</div>
	</div>
</template>
<style>
.front-page-body {
	background-color: #178bff !important;
	background-image: url(/images/byor/byor_bg.png);
	background-repeat: no-repeat;
	background-position: 130% -40px;
	font-family: "Roboto", Arial, sans-serif !important;
}

.banner-logo-wrapper {
}

.byor-banner-tagline {
	color: #fff;
	font-size: 25px;
	line-height: 27px;
	margin-left: 15px;
	width: 200px;
	display: inline-block;
	vertical-align: -48px;
}

.byor-header-logo-wrapper {
	position: absolute;
	left: 15px;
	top: 10px;
}

.byor-header-logo {
	height: 50px;
}

.byor-header-tagline {
	font-weight: 500;
	font-size: 16px;
	color: #fff;
	vertical-align: -6px;
	margin-left: 10px;
}

.front-page-menu {
	position: absolute;
	right: 0;
	top: 15px;
}

.front-page-menu a {
	text-decoration-style: none;
	display: inline-block;
	color: #fff !important;
	padding: 10px 15px;
}

.front-page-banner-logo-big {
	height: 155px;
}

.front-page-banner {
	padding-top: 130px;
	height: 500px;
	text-align: left;
	background-image: url(/images/byor/byor_bg_orange.svg);
	background-repeat: no-repeat;
	background-size: 2000px 500px;
	background-position: -750px 0;
	padding-left: 160px;
}

.front-page-banner-icons-wrapper {
	font-size: 16px;
	color: #fff;
	padding-top: 20px;
}
.front-page-banner-icon {
	width: 70px;
	margin-right: 10px;
	margin-left: 5px;
	display: inline-block;
}

.front-page-banner-icons-wrapper span {
	display: inline-block;
	text-align: left;
	vertical-align: middle;
	color: #fff;
	margin-right: 15px;
}

.front-page-banner-icons-wrapper span:hover {
	text-decoration: underline;
}

.front-page-content-wrapper {
	background-color: #fff;
	padding-right: calc((100% - 940px) / 2) !important;
	padding-left: calc((100% - 940px) / 2) !important;
}

.what-is-byor {
	font-size: 16px;
	color: #fff;
	position: absolute;
	top: 130px;
	width: 300px;
	right: 80px;
}
</style>
