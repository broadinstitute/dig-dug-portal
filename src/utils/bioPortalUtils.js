

/* This module tracks all portal-specific data, which is determined by the
 * sub-domain of the page.
 *
 * It knows the sub-domain (portal), the description of the portal, what
 * phenotypes are available to it, all the data about those phenotypes, etc.
 *
 * It also has functions for changing the disease group (portal) to another
 * and transfering the location to it.
 */

import queryString from "query-string";
import host from "@/utils/hostUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

class BioPortal {
    constructor(url=BIO_INDEX_HOST) {
        this.host = host;
        this.diseaseGroups = []
        this.phenotypes = []
        this.complications = []
        this.datasets = []
        this.phenotypeMap = {}
        this.complicationsMap = {}
        this.datasetMap = {}
        this.documentation = {}
        this.user = ""
        this.links = []
    }
    setDiseaseGroups(data) {
        this.diseaseGroups = data;
    }
    setPhenotypes(data) {
        this.phenotypes = data;
        this.phenotypeMap = {};

        // create a map of the phenotypes by name for fast lookup
        for (let i in this.phenotypes) {
            this.phenotypeMap[this.phenotypes[i].name] =
                this.phenotypes[i];
        }
    }
    setComplications(data) {
        this.complications = data;
        this.complicationsMap = {};
        // create a map of the phenotypes by name for fast lookup
        for (let i in this.complications) {
            this.complicationsMap[this.complications[i].name] =
                this.complications[i];
        }
    }
    setDatasets(data) {
        this.datasets = data;
        this.datasetMap = {};

        // create a map of the dataset name for fast lookup
        for (let i in this.datasets) {
            this.datasetMap[this.datasets[i].name] = this.datasets[i];
        }
    }
    setDocumentation(data) {
        this.documentation = data;
    }
    setUser(user) {
        this.user = user;
    }
    setLinks(data) {
        this.links = data;
    }

    defaultGroup() {
        if (this.diseaseGroups.length > 0) {
            return this.diseaseGroups.filter(g => g.default)[0];
        }
    }
    diseaseGroup(getters) {
        for (let i in this.diseaseGroups) {
            let group = this.diseaseGroups[i];

            if (group.name == this.host.subDomain) {
                return group;
            }
        }

        // find the default
        return getters.defaultGroup;
    }

    async getDiseaseGroups({ commit }) {
        let json = await fetch(
            `${BIO_INDEX_HOST}/api/portal/groups`
        ).then(resp => resp.json());

        // set the portal list
        commit("setDiseaseGroups", json.data);
    }

    // fetch all the phenotypes for this portal
    async getPhenotypes({ commit }) {
        let qs = queryString.stringify(
            { q: this.host.subDomain },
            { skipNull: true }
        );
        let json = await fetch(
            `${BIO_INDEX_HOST}/api/portal/phenotypes?${qs}`
        ).then(resp => resp.json());

        // set the list of phenotypes
        commit("setPhenotypes", json.data);
    }

    // fetch all the complicaitons for given disease group
    async getComplications({ commit }) {
        let qs = queryString.stringify(
            { q: this.host.subDomain },
            { skipNull: true }
        );
        let json = await fetch(
            `${BIO_INDEX_HOST}/api/portal/complications`
        ).then(resp => resp.json());

        // set the list of phenotypes
        commit("setComplications", json.data);
    }

    // fetch all datasets for this portal
    async getDatasets({ commit }) {
        let qs = queryString.stringify(
            { q: this.host.subDomain },
            { skipNull: true }
        );
        let json = await fetch(
            `${BIO_INDEX_HOST}/api/portal/datasets?${qs}`
        ).then(resp => resp.json());

        // set the list of datasets
        commit("setDatasets", json.data);
    }

    async getUser(context, access_token) {
        let data = await fetch(
            "https://oauth2.googleapis.com/tokeninfo?access_token=" +
            access_token
        ).then(response => response.json());

        context.commit("setUser", data.email);
    }

    // fetch all old links that need to be redirected
    async getLinks({ commit }) {
        let json = await fetch(
            `${BIO_INDEX_HOST}/api/portal/links`
        ).then(resp => resp.json());
        commit("setLinks", json.data);
    }
}