<template>
	<div class="front-page-body">
		<div class="byor-header-logo-wrapper">
			<a href="/index.html"
				><img
					src="/images/byor/byor_logo_header.svg"
					class="byor-header-logo"
			/></a>
			<span class="byor-header-tagline"
				>Transform data into knowledge</span
			>
		</div>
		<div class="front-page-menu">
			<a href="/research.html?pageid=about_byor">About</a
			><a href="https://hugeampkpncms.org/tutorial">Tutorial</a
			><a href="/research.html?pageid=demo_home_70">Demo Portal</a
			><a href="https://hugeampkpncms.org/user">Config Login</a>
		</div>
		<div class="container-fluid front-page-banner">
			<img
				src="/images/byor/byor_logo.svg"
				class="front-page-banner-logo-big"
			/>
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
		</div>

		<div class="container-fluid front-page-content-wrapper">
			content area
		</div>
	</div>
</template>
<style>
.front-page-body {
	background-color: #178bff !important;
	background-image: url(/images/byor/byor_bg.png);
	background-repeat: no-repeat;
	background-position: 130% -40px;
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
	font-weight: 400;
	font-size: 22px;
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
	width: 570px;
	margin-left: 80px;
}

.front-page-banner {
	padding-top: 130px;
	height: 500px;
	text-align: center;
	background-image: url(/images/byor/byor_bg_orange.svg);
	background-repeat: no-repeat;
	background-size: 2000px 500px;
	background-position: -750px 0;
}

.front-page-banner-icons-wrapper {
	font-size: 16px;
	color: #fff;
	padding-left: 60px;
	padding-top: 20px;
}
.front-page-banner-icon {
	width: 70px;
	margin-right: 10px;
	margin-left: 20px;
	display: inline-block;
}

.front-page-banner-icons-wrapper span {
	display: inline-block;
	text-align: left;
	vertical-align: middle;
	color: #fff;
}

.front-page-banner-icons-wrapper span:hover {
	text-decoration: underline;
}

.front-page-content-wrapper {
	background-color: #fff;
	padding-right: calc((100% - 940px) / 2) !important;
	padding-left: calc((100% - 940px) / 2) !important;
}
</style>
