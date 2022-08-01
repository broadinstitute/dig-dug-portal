<template>
    <!-- Header -->
    <div>
        <h1>Debug</h1>
        <b-input v-model="$parent.test.id" placeholder="id"></b-input>
        <b-input v-model="$parent.test.name" placeholder="name"></b-input>
        <b-btn @click="$parent.add()">Add</b-btn>
        {{ $parent.test.id }}
        {{ $parent.test.name }}
        <div>
            <b-btn @click="$parent.get()">Get</b-btn
            ><b-btn @click="$parent.clear()">Clear</b-btn>
        </div>
        <div><b>store</b>: {{ $parent.store }}</div>
        <div v-for="item in $parent.store" :key="item.id" class="mt-4">
            {{ item.id }} - {{ item.name }} -
            <b-btn @click="$parent.remove(item)">Remove</b-btn>
        </div>
    </div>
</template>
