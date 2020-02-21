<template>
    <div>
        <div>
            Associations: {{ $store.state.associations.data.length }} / {{ $store.state.associations.count }}
        </div>
        <div>
            <div :key="v.varId" v-for="v in $store.state.variants.data">
                <div :key="motif.positionWeightMatrix" v-for="motif in v.transcriptionFactors">
                    {{ motif }}
                </div>
            </div>
        </div>
        <table width="50%">
            <thead>
                <th>Phenotype</th>
                <th>Variant</th>
                <th>P</th>
            </thead>
            <tbody>
                <tr :key="v.phenotype" v-for="v in $parent.topAssociations">
                    <td>{{v.phenotype}}</td>
                    <td>
                        <a href="#" @click="$store.dispatch('variants/query', {q: v.varId})">
                            {{v.varId}}
                        </a>
                    </td>
                    <td>{{v.pValue}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
