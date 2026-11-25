<template>
    <div class="pb-docs">
        <portal-guide current="sources" />
        <main class="pb-docs-width pb-sources-content">
            <h1>Data Sources</h1>
            <p>External references used in the CRDC browser.</p>

            <div class="pb-source-table-wrap" tabindex="0" role="region" aria-label="External reference table">
                <table class="pb-source-table" aria-label="External references and versions">
                    <thead>
                        <tr>
                            <th scope="col">Resource</th>
                            <th scope="col">Used for</th>
                            <th scope="col">Version or date</th>
                            <th scope="col">Download</th>
                            <th scope="col">License</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in resources" :id="item.id" :key="item.id">
                            <th scope="row">{{ item.name }}</th>
                            <td>{{ item.use }}</td>
                            <td>{{ item.version }}<small v-if="item.detail">{{ item.detail }}</small></td>
                            <td>
                                <div v-for="file in [item.download, item.extraDownload].filter(Boolean)" :key="file.url">
                                    <a :href="file.url" target="_blank" rel="noopener noreferrer"
                                       :aria-label="file.label + ' for ' + item.name + ' (opens in a new tab)'">
                                        {{ file.label }}<b-icon-arrow-up-right aria-hidden="true" />
                                    </a>
                                </div>
                            </td>
                            <td>
                                <a v-if="item.terms" :href="item.terms" target="_blank" rel="noopener noreferrer"
                                   :aria-label="'Terms for ' + item.name + ' (opens in a new tab)'">
                                    Terms<b-icon-arrow-up-right aria-hidden="true" />
                                </a>
                                <span v-else>See provider</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="pb-source-note">Publisher download pages may offer a newer version.</p>
        </main>
    </div>
</template>

<script>
import { BIconArrowUpRight } from 'bootstrap-vue';
import PortalGuide from '@/components/pb/PortalGuide.vue';
import { resources } from './catalog';
import '../PbGuide/docs.css';

export default {
    name: 'PbSources',
    components: { PortalGuide, BIconArrowUpRight },
    data: () => ({ resources }),
    mounted() {
        const resource = resources.find(item => '#' + item.id === window.location.hash);
        if (resource) document.getElementById(resource.id).scrollIntoView();
    },
};
</script>
