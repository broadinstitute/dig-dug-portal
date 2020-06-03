import Vue from "vue";


const LZ_LOAD_PANEL = 'lz-load-panel';
const LZ_LOAD_DATASOURCE = 'lz-load-datasource';

export {
    LZ_LOAD_PANEL,
    LZ_LOAD_DATASOURCE,
};

const LZ_BROWSER_FORCE_REFRESH = 'lz-browser-forcerefresh';
export {
    LZ_BROWSER_FORCE_REFRESH,
}

const LZ_ADD_PANEL = 'lz-addpanel';
const LZ_REMOVE_PANEL = 'lz-removepanel';
const LZ_CHILD_DESTROY_PANEL = 'lz-child-destroypanel';

export {
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL
};

const LZ_BIOINDEX_QUERY_RESOLVE = 'lz-bi-resolve-handler';
const LZ_BIOINDEX_QUERY_ERROR = 'lz-bi-err-handler';
const LZ_BIOINDEX_QUERY_FINISH = 'lz-bi-finish-handler';

export {
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
};

const LZEvents = new Vue();
export default LZEvents;
