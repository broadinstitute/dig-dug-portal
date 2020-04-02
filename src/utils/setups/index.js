import { computed } from "@vue/composition-api";
import { createNamespacedHelpers } from "vuex-composition-helpers/dist";

export function useBioPortal(root) {
    const { useActions, useGetters, useState } = createNamespacedHelpers(root.$store, 'bioPortal');
    const { getDiseaseGroups, getPhenotypes } = useActions(['getDiseaseGroups', 'getPhenotypes']);
    const { phenotypes } = useState(['phenotypes']);
    const { diseaseGroup } = useGetters(['diseaseGroup']);

    // setup the global bioportal data
    getDiseaseGroups();
    getPhenotypes();

    return {
        diseaseGroup: computed(diseaseGroup),
        phenotypes: computed(() => phenotypes),
    }
}

export function useKp4cd(root) {
    const { useActions, useGetters, useState } = createNamespacedHelpers(root.$store, 'kp4cd');
    const { frontContents } = useState(['frontContents']);
    return {
        frontContents: computed(() => {
            let contents = frontContents;

            if (contents.length === 0) {
                return {};
            }

            return contents[0];
        }),
    }
}

export default {
    useBioPortal,
    useKp4cd,
}
