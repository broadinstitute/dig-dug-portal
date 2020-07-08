import Vue from "vue";

const LZ_LOAD_PANEL = 'lz-load-panel';

export {
    LZ_LOAD_PANEL,
};

const LZ_ADD_PANEL = 'lz-addpanel';
const LZ_REMOVE_PANEL = 'lz-removepanel';
const LZ_CHILD_DESTROY_PANEL = 'lz-child-destroypanel';

export {
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL
};

const LZEvents = new Vue();
export default LZEvents;
