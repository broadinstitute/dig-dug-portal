<template>
    <div>
        
        <input v-model="$parent.inputs"/>
        <filter-provider v-model="$parent.inputs">
            <filter-user></filter-user>
        </filter-provider>

    </div>
</template>