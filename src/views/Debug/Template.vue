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
        <div>{{ $parent.store }}</div>
    </div>
</template>
