<template>
    <div>
        <select :name="`${this.name}-type`" v-model="query">
            <option v-for="type in options" :key="type">
                {{ type }}
            </option>
        </select>
        <input :name="`${this.name}-value`" v-model="value"/>
    </div>
</template>
<script>
import Vue from "vue";

export default Vue.component('bioindex-data-picker', {
    props: ["name", "options"],
    data() {
        return {
            query: '',
            value: '',
        }
    },
    computed: {
        message() {
            return `${this.name};${this.query};${this.value}`
        }
    },
    watch: {
        message(newMessage) {
            this.$emit('modify', newMessage);
        }
    }
})
</script>
