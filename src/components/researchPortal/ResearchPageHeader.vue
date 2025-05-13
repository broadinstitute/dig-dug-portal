<template>
	<div class="research-header-menu-wrapper container-fluid">
		<!-- Menu header-->
		<div
			v-html="headerLogo"
			class="rp-header-logo"
			v-if="headerLogo != null"
		></div>
		<div
			class="rp-header-logo"
			v-if="!!sectionConfig && !!sectionConfig['header logo']"
		>
			<p class="kp-logo-wrapper">
				<img class="kp-logo" :src="getLogo(sectionConfig['header logo'])">
			</p>
		</div>
		<ul v-if="!!researchMenu">
			<template v-if="addSearch">
				<li class="menu menu-search">
					<a @click="activateSearch">
						<svg viewBox="0 0 24 24" fill="none" stroke="#1c5084" stroke-width=".5" xmlns="http://www.w3.org/2000/svg">
							<path fill="#1c5084" fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z"/>
						</svg>
						Search
					</a>
				</li>
			</template>
			<li
				v-for="menu in (researchMenu.length ? researchMenu : researchMenu.menu)"
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
		
		<ul v-if="!!sectionConfig">
			<li
				v-for="menu in sectionConfig.menu.items"
				:key="menu.label"
				class="menu"
			>
				<a :href="getLink(menu.link)">{{ menu.label }}</a>
				<ul v-if="!!menu.subMenu" class="sub-menu-wrapper">
					<li
						v-for="subMenu in menu.subMenu"
						:key="subMenu.label"
						class="sub-menu"
					>
						<a :href="getLink(subMenu.link)">{{ subMenu.label }}</a>
					</li>
				</ul>
			</li>
		</ul>
		<div class="menu-search-container" ref="searchContainer"></div>
	</div>
</template>

<script>
import Vue from "vue";
import EventBus from "@/utils/eventBus";
import ResearchSingleSearchCFDE from "@/components/researchPortal/ResearchSingleSearchCFDE.vue";

export default Vue.component("research-page-header", {
	props: ["researchMenu","phenotypes", "utils", "headerLogo","sectionConfig","utils"],
	components: {},
	data() {
		return {
			addSearch: false
		};
	},
	created() {},
	mounted() {
		if (!!this.sectionConfig && this.sectionConfig["style"]) {
			this.addCss(this.sectionConfig["style"]);
		}
	},
	computed: {
		
	},
	watch: {
		researchMenu(newResearchMenu) {
			if (newResearchMenu) {
				if((newResearchMenu.length && newResearchMenu.length > 0) ||
				(!newResearchMenu.length && newResearchMenu.menu.length && newResearchMenu.menu.length > 0)){
					this.$nextTick(() => {
						this.checkSubmenus();
					});
				}
				this.tryInjectActions();
				this.tryAddSearch();
				this.tryCustomElements();
			}	
		}
	},
	methods: {
		addCss(css) {
			var head = document.getElementsByTagName("head")[0];
			var s = document.createElement("style");
			s.setAttribute("type", "text/css");
			if (s.styleSheet) {
				// IE
				s.styleSheet.cssText = css;
			} else {
				// the world
				s.appendChild(document.createTextNode(css));
			}
			head.appendChild(s);
		},
		getLogo(CONFIG) {

			let updatedLink = CONFIG["source"]

			if (!!CONFIG["replace links"]) {
				let replaceItems = CONFIG["replace links"];

				replaceItems.map(r => {

					updatedLink = updatedLink.replace("$"+r, this.utils.keyParams[r]);
				})
			}

			return updatedLink
		},
		getLink(LINK){

			let updatedLink = LINK
			
			if(!!this.sectionConfig.menu["replace links"]) {
				let replaceItems = this.sectionConfig.menu["replace links"];
				replaceItems.map(r => {

					updatedLink = updatedLink.replace("$" + r, this.utils.keyParams[r]);
				})

			}

			return updatedLink;
		},
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
		tryAddSearch(){
			if(this.researchMenu && !this.researchMenu.length){
				//console.log(this.researchMenu);
				if(this.researchMenu["search"]){
					//console.log('adding search');
					this.addSearch = true;
				};
			}
		},
		activateSearch(){
			//check for search element on page
			//NOTE, this is specific to CFDE compnent only right now.
			const searchComponent = document.querySelector('.search-underlay');
			if (!searchComponent) {
				this.addSearchComponent();
			}
			//start focused
			EventBus.$emit('activate-search');
		},	
		addSearchComponent() {
			// Access the necessary configs from $parent or wherever they are
			const searchConfig = this.researchMenu["search"];
			const phenotypes = this.phenotypes;
			const utilsBox = this.utils;

			// dynamically create and mount the search component with its props
			const SearchComponentClass = Vue.extend({
				render(h) {
				return h(ResearchSingleSearchCFDE, {
					props: {
					singleSearchConfig: searchConfig,
					phenotypes: phenotypes,
					utils: utilsBox,
					fromNav: true
					},
				});
				},
			});
			const searchInstance = new SearchComponentClass();

			// mount search component and append it to the navigation's search container
			searchInstance.$mount();
			this.$refs.searchContainer.appendChild(searchInstance.$el);
		},
		tryInjectActions(){
			if(this.researchMenu && !this.researchMenu.length){
				if(this.researchMenu["favicon"]) this.injectFavicon(this.researchMenu["favicon"]);
				if(this.researchMenu["google font"]) this.injectFont(this.researchMenu["google font"]);
			}
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
			const linkTag = document.createElement('link');
			linkTag.rel = 'stylesheet';
			linkTag.href = fontUrl;
			document.head.appendChild(linkTag);
			linkTag.onload = () => {
				//console.log(linkTag.textContent);
			};
		},
		tryCustomElements(){
			if(this.researchMenu["google font"] && this.researchMenu["favicon"]){
				const temp = document.createElement('div');
				temp.innerHTML = `<div style='position:sticky; bottom:0; width:100vw; padding:10px; z-index:50; background: #f7ab85; text-align:center;'>This repository is under review for potential modification in compliance with Administration directives.</div>`;
				document.body.appendChild(temp.firstChild);
			}
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

.menu-search{
	cursor:pointer;
}
.menu-search svg {
    width: 25px;
    margin: -5px -5px 0;
    transform: scaleX(-1);
}

.menu-search-container{
	position: fixed;
    top: 100px;
    display: flex;
    width: 100%;
    justify-content: center;
}
</style>
