<template>
    <div>
        <input type="number" v-model.number="$parent.nums"/>
        <igv :xs="31" :sm="32">
            <igv-track
                v-for="num in $parent.nums"
                :key="num"
                :xs="num"></igv-track>
        </igv>
    </div>
</template>
