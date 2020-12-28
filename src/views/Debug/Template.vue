<template>
<div>
    <div v-for="item in $parent.items"
        v-bind:key="item[0]">
        <p>{{item[0]}}</p>
            <svg width="100" height="10">
            <rect  width="100" height="10" :style="`fill:${item[1]};`" />
        </svg>
    </div>
</div>
</template>
