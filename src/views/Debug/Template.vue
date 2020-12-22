<template>
<div>
        <input type="number" v-model="$parent.resolution"/>
        <div v-for="item in $parent.items"
            v-bind:key="item[0]">
             <svg width="10" height="10">

             <rect  width="10" height="10" :style="`fill:${item[1]};`" />
           </svg>

        </div>
</div>
</template>
