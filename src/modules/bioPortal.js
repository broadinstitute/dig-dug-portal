
import queryString from "query-string";
import host from "@/utils/hostUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

export default {
    namespaced: true,

    state() {
        return {
            host,
            diseaseSystems: [],
            diseaseGroups: [],
            phenotypes: [],
            ancestries: [],
            complications: [],
            datasets: [],
            phenotypeMap: {},
            complicationsMap: {},
            datasetMap: {},
            documentation: {},
            user: "",
            links: []
        };
    },

    mutations: {
        setDiseaseSystems(state, data) {
            state.diseaseSystems = data;
        },
        setDiseaseGroups(state, data) {
            state.diseaseGroups = data;
        },
        setPhenotypes(state, data) {
            state.phenotypes = data;
            state.phenotypeMap = {};

            for (let i in state.phenotypes) {
                state.phenotypeMap[state.phenotypes[i].name] =
                    state.phenotypes[i];
            }
        },
        setAncestries(state, data) {
            state.ancestries = data;
            state.ancestryMap = {};
            for (let i in state.ancestries){
                state.ancestryMap[state.ancestries[i].name] = state.ancestries[i];
            }
         },
        setComplications(state, data) {
            state.complications = data;
            state.complicationsMap = {};
            for (let i in state.complications) {
                state.complicationsMap[state.complications[i].name] =
                    state.complications[i];
            }
        },
        setDatasets(state, data) {
            state.datasets = data;
            state.datasetMap = {};

            for (let i in state.datasets) {
                state.datasetMap[state.datasets[i].name] = state.datasets[i];
            }
        },
        setDocumentation(state, data) {
            state.documentation = data;
        },
        setUser(state, user) {
            state.user = user;
        },
        setLinks(state, data) {
            state.links = data;
        }
    },

    getters: {
        defaultGroup(state) {
            if (state.diseaseGroups.length > 0) {
                return state.diseaseGroups.filter(g => g.default)[0];
            }
        },

        diseaseGroup(state, getters) {
            for (let i in state.diseaseGroups) {
                let group = state.diseaseGroups[i];

                if (group.name == state.host.subDomain) {
                    return group;
                }
            }

            return getters.defaultGroup;
        },

        isRootPortal(state, getters) {
            if (!state.host.subDomain)
                return true;
            else {
                return (
                    state.host.subDomain === getters.diseaseGroup.portalGroup
                );
            }
        }
    },

    actions: {
        async getDiseaseSystems({ commit }) {
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/systems`
            ).then(resp => resp.json());

            commit("setDiseaseSystems", json.data);
        },
        async getDiseaseGroups({ commit }) {
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/groups`
            ).then(resp => resp.json());

            commit("setDiseaseGroups", json.data);
        },

        async getPhenotypes({ state, commit }) {
            let qs = queryString.stringify(
                { q: state.host.subDomain || "md" },
                { skipNull: true }
            );
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/phenotypes?${qs}`
            ).then(resp => resp.json());

            commit("setPhenotypes", json.data);
        },
        async getAncestries({ state, commit }){
            let qs = queryString.stringify(
                { q: state.host.subDomain || "md"},
                { skipNull : true}
            );
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/ancestries?${qs}`
            ).then(resp => resp.json());
            commit("setAncestries", json.data);
        },

        async getComplications({ state, commit }) {
            let qs = queryString.stringify(
                { q: state.host.subDomain || "md" },
                { skipNull: true }
            );
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/complications`
            ).then(resp => resp.json());

            commit("setComplications", json.data);
        },

        async getDatasets({ state, commit }) {
            let qs = queryString.stringify(
                { q: state.host.subDomain || "md" },
                { skipNull: true }
            );
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/datasets?${qs}`
            ).then(resp => resp.json());

            commit("setDatasets", json.data);
        },

        async getUser(context, access_token) {
            let data = await fetch(
                "https://oauth2.googleapis.com/tokeninfo?access_token=" +
                access_token
            ).then(response => response.json());

            context.commit("setUser", data.email);
        },

        async getLinks({ state, commit }) {
            let json = await fetch(
                `${BIO_INDEX_HOST}/api/portal/links`
            ).then(resp => resp.json());
            commit("setLinks", json.data);
        }
    }
};
