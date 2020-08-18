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
            query: this.options[0],
            value: '',
        }
    },
    computed: {
        message() {
            return `${this.query};${this.value}`
        }
    },
    watch: {
        message(newMessage) {
            // I am descending into depravity
            this.$emit('modify', {
                target: {
                    value: `${this.query},${this.value}`
                }
            });
        }
    }
})
</script>
