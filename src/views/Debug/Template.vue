<template>
    <div>
        <locuszoom
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end">

            <lz-child
                test='association'
            ></lz-child>

            <lz-associations-panel
                :phenotype="'T2D'">
            </lz-associations-panel>

        </locuszoom>
    </div>
</template>
