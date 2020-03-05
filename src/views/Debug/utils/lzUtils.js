import { PANEL_ORDER } from "./lzConstants";
export function sortPanels (panels) {
    // _.invert swaps keys and values, i.e. [ "val" ] === { 0: "val" } => { "val": 0 }
    const panelOrderMap = _.invert(PANEL_ORDER);
    return panels.sort(function(x, y) {
        if (panelOrderMap[x] < panelOrderMap[y]) {
            return -1;
        }
        if (panelOrderMap[x] > panelOrderMap[y]) {
            return 1;
        }
        return 0;
    });
}
