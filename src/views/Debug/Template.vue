<template>
    <div>
        <input type="number" v-model.number="$parent.nums"/>
        <element-list :xs="31" :sm="32">
            <template scope="props">
                <grid
                    v-for="num in $parent.nums"
                    :key="num"
                    :xs="num"
                    :sm="props.sm"></grid>
            </template>
        </element-list>
    </div>
</template>
