import { BaseWidget, _Button } from "locuszoom/esm/components/toolbar/widgets";
import jsonQuery from "json-query";

class ToggleLogLog extends BaseWidget {
    /**
     * @param {string} [layout.button_html="Download SVG"]
     * @param {string} [layout.button_title="Download image of the current plot as locuszoom.svg"]
     * @param {string} [layout.filename="locuszoom.svg"] The default filename to use when saving the image
    */
    constructor(layout, parent) {
        super(layout, parent);
        this._button_html = this.layout.button_html || 'Toggle Log-Log Scale';
        this._button_title = this.layout.button_title || 'Change log scale to log-log scale for p-values in associations plots';
    }
    update() {
        if (this.button) {
            return this;
        }
        let self = this;
        this.button = new _Button(this)
            .setColor(this.layout.color)
            .setHtml(this._button_html)
            .setTitle(this._button_title)
            .setOnclick(function () {
                // Auxiliary method within our json query for data layers in the LocusZoom plot
                // takes a list of objects of objects, and returns an array of the deepest objects - i.e. [{{*}}] => {*}
                // using flatmap because we need to work across many Object.keys
                const forceKeys = (el) =>
                el.flatMap((data_layer_set) =>
                    Object.entries(data_layer_set).map(
                        (data_layer_pair) => data_layer_pair[1]
                    )
                );

                // Do we need to calculate this forceKeys every time?
                let data_layers = jsonQuery("panels[*].data_layers[*]:forceKeys", {
                    data: self.parent_plot,
                    locals: { forceKeys },
                }).value;

                data_layers.forEach((data_layer) => {
                    if (!!data_layer.layout.y_axis.field) {
                        if (
                            data_layer.layout.y_axis.field.includes("log_pvalue") &&
                            !data_layer.layout.y_axis.field.includes("|log10")
                        ) {
                            data_layer.layout.y_axis.field = data_layer.layout.y_axis.field.concat(
                                "|log10"
                            );
                            data_layer.parent.layout.axes.y1.label =
                                "-log10(log10(p))";
                            data_layer.parent.layout.axes.y1.ticks = [
                                1,
                                10,
                                100,
                                1000,
                                10000,
                            ];
                        } else if (
                            data_layer.layout.y_axis.field.includes("log_pvalue") &&
                            data_layer.layout.y_axis.field.includes("|log10")
                        ) {
                            data_layer.layout.y_axis.field = data_layer.layout.y_axis.field.split(
                                "|log10"
                            )[0];
                            data_layer.parent.layout.axes.y1.label = "-log10(p)";
                            data_layer.parent.layout.axes.y1.ticks = undefined;
                        }
                    }
                });
                self.parent_plot.applyState();
            });
        this.button.show();
        return this;
    }
}


const ldlz2_pop_selector_menu = {
    // **Note**: this widget is aimed at the LDServer datasource, and the UM 1000G LDServer
    type: 'set_state',
    position: 'right',
    color: 'blue',
    button_html: 'LD Population: ',
    show_selected: true,
    button_title: 'Select LD Population: ',
    state_field: 'ld_pop',
    // This list below is hardcoded to work with the UMich LDServer, default 1000G populations
    //  It can be customized to work with other LD servers that specify population differently
    // https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations
    options: [
        { display_name: 'ALL (default)', value: 'ALL' },
        { display_name: 'AFR', value: 'AFR' },
        { display_name: 'AMR', value: 'AMR' },
        { display_name: 'EAS', value: 'EAS' },
        { display_name: 'EUR', value: 'EUR' },
        { display_name: 'SAS', value: 'SAS' },
    ],
};

const download_png = {
    type: "download_png",
    color: "green",
    position: "right"
}

export {
    ToggleLogLog,
    ldlz2_pop_selector_menu,
    download_png
}
