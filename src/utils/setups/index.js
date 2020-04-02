import {computed, isRef, onBeforeMount, reactive, ref, watchEffect} from "@vue/composition-api";
import { createNamespacedHelpers, useActions, useGetters, useState } from "vuex-composition-helpers/dist";

export function useBioPortal(root) {
    const bioPortalHelper = createNamespacedHelpers(root.$store, 'bioPortal');
    const { getDiseaseGroups, getPhenotypes } = bioPortalHelper.useActions(['getDiseaseGroups', 'getPhenotypes']);
    const { phenotypes } =  bioPortalHelper.useState(['phenotypes']);
    const { diseaseGroup } =  bioPortalHelper.useGetters(['diseaseGroup']);

    onBeforeMount(() => {
        // setup the global bioportal data
        getDiseaseGroups();
        getPhenotypes();
    });

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

export function usePageSetup(root) {
    const bioPortalHelper = createNamespacedHelpers(root.$store, 'bioPortal');
    const { getDiseaseGroups, getPhenotypes } = bioPortalHelper.useActions(['getDiseaseGroups', 'getPhenotypes']);
    const { diseaseGroup } = bioPortalHelper.useGetters(['diseaseGroup']);  // getters called in this way are equivalent to composition-api `ref`s.

    const kp4cdHelper = createNamespacedHelpers(root.$store, 'kp4cd');
    const { getFrontContents } = kp4cdHelper.useActions(['getFrontContents']);
    const { frontContents } = kp4cdHelper.useState(['frontContents']);

    // setup the global bioportal data
    getDiseaseGroups();
    getPhenotypes();
    watchEffect(() => {
        // need to access diseaseGroup -> value -> name instead of diseaseGroup -> name since diseaseGroup is wrapped as a ref
        if (diseaseGroup.value) {
            getFrontContents(diseaseGroup.value.name);
        }
    });

    return {
        diseaseGroup: computed(() => diseaseGroup),
        frontContents: computed(() => {
            let contents = frontContents;
            if (contents.length === 0) {
                return {};
            }

            return contents[0];
        }),
    }

};

export default {
    useBioPortal,
    useKp4cd,
    usePageSetup,
}
