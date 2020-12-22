<template>
<div>
        <div v-for="item in $parent.items"
            v-bind:key="item[0]">
             <svg width="10" height="10">

             <rect  width="10" height="10" :style="`fill:${item[1]};stroke-width:1;stroke:rgb(0,0,0)`" />
           </svg>

        </div>
</div>
</template>
