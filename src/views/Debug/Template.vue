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
        <table width="100%">
            <tr>
                <td valign="top">
                    <table class="table table-striped" style="margin-top:20px">
                        <thead class="thead-dark">
                            <th>body</th>
                        </thead>
                        <tbody>
                            <tr v-for="(row) in $store.state.kp4cd.frontContents">
                                <td v-html="row.body">{{ row.body }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
        <div>
            {{ $store.state.kp4cd.datasetsInfo }}
        </div>
    </div>
</template>
