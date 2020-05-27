import Vue from "vue";

const IGV_REMOVE_TRACK = 'igv-removetrack';
const IGV_ADD_TRACK = 'igv-addtrack';

export {
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
}

const IGVEvents = new Vue();
export default IGVEvents;
