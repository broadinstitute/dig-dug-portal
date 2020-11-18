import { BaseWidget, _Button } from "locuszoom/esm/components/toolbar/widgets";
import jsonQuery from "json-query";

export class ToggleLogLog extends BaseWidget {
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
                console.log(self)
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
