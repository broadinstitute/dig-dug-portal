import bioIndexUtils from "@/utils/bioIndexUtils"

class BioIndexGroup {
    
    #grouping = new Map();

    constructor (bioIndexResults, groupKey) {
        if (typeof bioIndexResults === 'undefined') {
            throw new Error('Cannot be called directly');
        } else {
            if (!!bioIndexResults.data) {
                if (bioIndexResults.data.length > 0) {

                    this.#grouping = new Map(Object.entries(_.groupBy(bioIndexResults.data, groupKey)));

                } else {
                    throw new Error('No data for the mapping');
                }
            } else {
                throw new Error('Results had no data');
            }
        }
    }

    static async build (index, primaryKey, groupKey, { secondaryKey='' }) {

        let query = `${primaryKey}${!!secondaryKey ? `,${secondaryKey}` : ''}`
        let results = await bioIndexUtils.query(index, query);
        
        return new BioIndexGroup(results, groupKey);
    }

    get map() {
        return this.#grouping;
    }

    get list() {
        return Array.from(this.#grouping.values());
    }

    reMap(groupKey) {
        // a pullback + re-projection, not an override
        const _mapping = new Map(_.groupBy(this.list, groupKey));
        return _mapping;
    }

}

class BioPortalGroup {
    
    // TODO: given that these classes should never be instanced, 
    // should the build steps for BioPortalGroup and/or BioIndexGroup be turned into methods instead?
    // "Static methods considered harmful"

    static async build (concept, groupKey, primaryKey='') {
        let qs = null;
        if (!!primaryKey && primaryKey !== '') {
            qs = queryString.stringify(
                { q: primaryKey },
                { skipNull: true }
            )
        }
        let bioIndexPortalResults = await fetch(
            `${bioIndexUtils.BIO_INDEX_HOST}/api/portal/${concept}${!!qs && qs !== null ? `?${qs}` : ''}`
        ).then(resp => resp.json());
        
        // the interface for the bioportal group should be the same as the bioindex group, so might as well reuse a bioindex group
        // this would be made more explicit if we were using typescript
        return new BioIndexGroup(bioIndexPortalResults, groupKey);
    }

}

const diseaseGroups = BioPortalGroup.build('groups', 'name');
const phenotypeMap = BioPortalGroup.build('phenotypes', 'name');

const globalEnrichmentsForPhenotype = async phenotype => await BioIndexGroup.build('global-enrichment', phenotype, 'tissue');

export default {
    diseaseGroups,
    phenotypeMap,
    globalEnrichmentsForPhenotype,
}