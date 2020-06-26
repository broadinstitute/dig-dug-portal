import Vue from "vue";

const IGV_REMOVE_TRACK = 'igv-removetrack';
const IGV_ADD_TRACK = 'igv-addtrack';
const IGV_CHILD_DESTROY_TRACK = 'igv-child-destroytrack';

export {
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
    IGV_CHILD_DESTROY_TRACK
};

const IGV_BIOINDEX_QUERY_RESOLVE = 'igv-bi-resolve-handler';
const IGV_BIOINDEX_QUERY_ERROR = 'igv-bi-err-handler';
const IGV_BIOINDEX_QUERY_FINISH = 'igv-bi-finish-handler';

export {
    IGV_BIOINDEX_QUERY_RESOLVE,
    IGV_BIOINDEX_QUERY_ERROR,
    IGV_BIOINDEX_QUERY_FINISH,
};

const IGV_LOCUSCHANGE = 'igv-locuschange'

export {
    IGV_LOCUSCHANGE,
};

// TODO: Just use a single eventbus, get rid of this one
const IGVEvents = new Vue();
export default IGVEvents;
