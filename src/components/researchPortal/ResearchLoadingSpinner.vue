<template>
  <div v-if="this.isLoading" class="spinner-container">
    <div class="loader" :class="this.colorStyle">
      <div class="dot dot1"><i></i></div>
      <div class="dot dot2"><i></i></div>
      <div class="dot dot3"><i></i></div>
      <div class="dot dot4"><i></i></div>
      <div class="dot dot5"><i></i></div>
      <div class="dot dot6"><i></i></div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";

//colorStyle options: none = white, "black", "color"
export default Vue.component("research-loading-spinner", {
  props: ["isLoading", "colorStyle"]
});
</script>

<style scoped>

.spinner-container{
    display: inline-flex;
    align-items: center;
    align-self: center;
    margin: 0 5px;
}

.loader {
	position: relative;
	display: flex;
	justify-content: center;
	align-content: center;
	width: 40px;
	height: 20px;
}

.dot {
	position: relative;
	flex: 1;
	display: flex;
	justify-content: center;
	align-content: center;
	margin: 0 0px;
	height: 20px;
	width: 2px;
}

.dot:first-of-type 
{ margin-left: 0 }

.dot:last-of-type 
{ margin-right: 0 }

.dot::before,
.dot::after {
	content: "";
	position: absolute;
	bottom: 0;
	display: block;
	width: 3px;
	height: 3px;
	background: #fff;
	border-radius: 50%;
	animation: helix 1.25s ease-in-out infinite;
}

.loader.black .dot::before,
.loader.black .dot::after{
	background: #000;
}

.dot::after {
	bottom: calc(100% - 3px);
	animation: helix-reversed 1.25s ease-in-out infinite;
}

.dot i {
	position: absolute;
	align-self: center;
	width: 1px;
	height: 50%;
	background: #ffffff50;
	animation: helix-bar 1.25s ease-in-out infinite;
}

.loader.black .dot i{
	background: #00000050;
}
.loader.color .dot i{
	background: linear-gradient(270deg, #00000070 0%, #00000070 50%, #ffffff70 50%, #ffffff70 100%);;
}

.dot2::before, .dot2::after, .dot2 i
{ animation-delay: 0.15s }

.dot3::before, .dot3::after, .dot3 i
{ animation-delay: 0.30s }

.dot4::before, .dot4::after, .dot4 i
{ animation-delay: 0.45s }

.dot5::before, .dot5::after, .dot5 i
{ animation-delay: 0.60s }

.dot6::before, .dot6::after, .dot6 i
{ animation-delay: 0.75s }

.loader.color .dot1::before, .loader.color .dot3::after, .loader.color .dot5::before{
	background: #bfd630;
}
.loader.color .dot1::after, .loader.color .dot3::before, .loader.color .dot5::after{
	background: #ffdd04;
}
.loader.color .dot2::before, .loader.color .dot4::after, .loader.color .dot6::before{
	background: #f4824d;
}
.loader.color .dot2::after, .loader.color .dot4::before, .loader.color .dot6::after{
	background: #00bcf1;
}

@keyframes helix {
	  0% { width: 4px; height: 4px; bottom: 0; opacity: 1; }
	 25% { width: 2px; height: 2px; opacity: 0.4 }
	 50% { width: 4px; height: 4px; bottom: calc(100% - 3px); opacity: 1; }
	 75% { width: 6px; height: 6px }
	100% { width: 4px; height: 4px; bottom: 0 }
}

@keyframes helix-reversed {
	  0% { width: 4px; height: 4px; bottom: calc(100% - 3px); }
	 25% { width: 6px; height: 6px }
	 50% { width: 4px; height: 4px; bottom: 0; opacity: 1;}
	 75% { width: 2px; height: 2px; opacity: 0.4 }
	100% { width: 4px; height: 4px; bottom: calc(100% - 3px); opacity: 1; }
}

@keyframes helix-bar {
	  0% { height: 50%; }
	 25% { height:  0; }
	 50% { height: 50%; }
	 75% { height:  0; }
	100% { height: 50%; }
}

html, body {
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0;
	padding: 0;
	width: 100%;
	height: 100%;
	background: black;
}
</style>