<template>
	<div class="research-header-menu-wrapper container-fluid">
		<!-- Menu header-->
		<div
			v-html="headerLogo"
			class="rp-header-logo"
			v-if="headerLogo != null"
		></div>
		<ul v-if="!!this.researchMenu">
			<li
				v-for="menu in (this.researchMenu.length ? this.researchMenu : this.researchMenu.menu)"
				:key="menu.label"
				class="menu"
			>
				<a :href="menu.link">{{ menu.label }}</a>
				<ul v-if="!!menu.subMenu" class="sub-menu-wrapper">
					<li
						v-for="subMenu in menu.subMenu"
						:key="subMenu.label"
						class="sub-menu"
					>
						<a :href="subMenu.link">{{ subMenu.label }}</a>
					</li>
				</ul>
			</li>
		</ul>
	</div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-page-header", {
	props: ["researchMenu", "headerLogo"],
	components: {},
	data() {
		return {};
	},
	created() {},
	mounted() {
		if(this.researchMenu && !this.researchMenu.length){
			if(this.researchMenu["favicon"]) this.injectFavicon(this.researchMenu["favicon"]);
			if(this.researchMenu["google font"]) this.injectFont(this.researchMenu["google font"]);
		}
	},
	watch: {
		researchMenu(newResearchMenu) {
			if (newResearchMenu && newResearchMenu.length > 0) {
				this.$nextTick(() => {
					this.checkSubmenus();
				});
			}
		}
	},
	methods: {
		checkSubmenus(){
			//adjust submenu positions on hover so they dont extend off the page
			const menus = document.querySelectorAll('.menu');
			menus.forEach(menu => {
				const subMenu = menu.querySelector('.sub-menu-wrapper');
				if(!subMenu) return;
				menu.addEventListener('mouseover', e => {
					const leftPos = subMenu.getBoundingClientRect().left;
					const width = subMenu.offsetWidth;
					const rightBound = leftPos + width;
					if(rightBound>window.innerWidth){
						const offset = -(rightBound - window.innerWidth) +"px";
						subMenu.style.marginLeft = offset;
					}
				})
			});
		},
        injectFavicon(faviconUrl) {
            let favicon = document.querySelector('link[rel="icon"]')
            if (!favicon) {
                favicon = document.createElement('link')
                favicon.setAttribute('rel', 'icon')
                favicon.setAttribute('type', 'image/png')
                document.head.appendChild(favicon)
            }
            favicon.setAttribute('href', faviconUrl)
        },
		injectFont(fontUrl){
			const styleTag = document.createElement('style');
			styleTag.textContent = `@import url('${fontUrl}');`;
			document.head.appendChild(styleTag);
			//console.log(styleTag.textContent);
		}
	},
	computed: {},
});
</script>

<style>
.rp-header-logo {
	text-align: center;
}
.research-header-menu-wrapper {
	background-color: cornflowerblue;
	padding-top: 10px;
	padding-bottom: 10px;
	width: 100%;
}

.research-header-menu-wrapper ul {
	list-style: none;
	text-align: center;
	padding: 0;
	margin: 0;
}

.research-header-menu-wrapper ul li.menu {
	display: inline-block;
	margin: 0 8px;
}

.research-header-menu-wrapper ul li.menu a {
	color: #fff !important;
}

.research-header-menu-wrapper ul li.menu a:hover {
	color: #cdf !important;
	text-decoration: none;
}

.research-header-menu-wrapper ul li.menu > ul {
	display: none;
	position: absolute;
	z-index: 100000;
	padding: 0;
	margin: 0;
}

.research-header-menu-wrapper ul li.menu:hover > ul {
	display: block;
}

.research-header-menu-wrapper ul li.menu:hover li.sub-menu {
	width: 100%;
	padding: 0 !important;
	font-size: 0.8em;
	background-color: rgba(100, 100, 100, 0.65);
	text-align: left;
	list-style: none;
}

.research-header-menu-wrapper ul li.menu:hover li.sub-menu:hover {
	background-color: #00000095;
}

.research-header-menu-wrapper ul li.menu:hover li.sub-menu > a {
	display: block;
	width: 100%;
	padding: 3px 10px 3px 10px;
	border-bottom: solid 1px #666;
	list-style: none;
	white-space: nowrap;
	color: #ffffff !important;
	font-size: 14px;
	font-weight: 400;
}

/* hide header container if no content*/
.research-header-menu-wrapper:empty{
    display: none;
}

.research-portal-header {
	width: 100% !important;
}

.research-portal-header-compact {
	width: 100% !important;
	padding: 15px 0 0 0 !important;
	margin: 0;
	border: none !important;
	background: none !important;
	margin-bottom: -15px;
}

.research-portal-header-compact ul li.menu a {
	color: #007bff !important;
}

.research-portal-header-compact ul li.menu a:hover {
	color: #004bcf !important;
}
</style>
