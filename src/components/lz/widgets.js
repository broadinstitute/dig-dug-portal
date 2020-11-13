import { BaseWidget, Button } from "locuszoom/esm/components/toolbar/widgets";

class ToggleLogLog extends BaseWidget {
    /**
     * @param {string} [layout.button_html="Download SVG"]
     * @param {string} [layout.button_title="Download image of the current plot as locuszoom.svg"]
     * @param {string} [layout.filename="locuszoom.svg"] The default filename to use when saving the image
    */
    constructor(layout, parent) {
        super(layout, parent);
        this._filename = this.layout.filename || 'locuszoom.svg';
        this._button_html = this.layout.button_html || 'Save SVG';
        this._button_title = this.layout.button_title || 'Download hi-res image';
    }

    update() {
        if (this.button) {
            return this;
        }
        this.button = new Button(this)
            .setColor(this.layout.color)
            .setHtml(this._button_html)
            .setTitle(this._button_title)
            // .setOnMouseover(() => {
            //     this.button.selector
            //         .classed('lz-toolbar-button-gray-disabled', true)
            //         .html('Preparing Image');
            //     this._getBlobUrl().then((url) => {
            //         const old = this.button.selector.attr('href');
            //         if (old) {
            //             // Clean up old url instance to prevent memory leaks
            //             URL.revokeObjectURL(old);
            //         }
            //         this.button.selector
            //             .attr('href', url)
            //             .classed('lz-toolbar-button-gray-disabled', false)
            //             .classed('lz-toolbar-button-gray-highlighted', true)
            //             .html(this._button_html);
            //     });
            // })
            // .setOnMouseout(() => {
            //     this.button.selector.classed('lz-toolbar-button-gray-highlighted', false);
            // });
            .setOnclick(function () {
                let data_layers = this.getDataLayers();
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
                this.plot.applyState();
            });
        this.button.show();
        this.button.selector
            .attr('href-lang', 'image/svg+xml')
            .attr('download', this._filename);
        return this;
    }

    /**
     * Extract all CSS rules whose selectors directly reference elements under the root node
     * @param {Element} root
     * @return {string}
     * @private
     */
    _getCSS(root) {
        // Hack: this method is based on text matching the rules on a given node; it doesn't handle, eg ancestors.
        // Since all LZ cssRules are written as "svg .classname", we need to strip the parent selector prefix in order
        // to extract CSS.
        const ancestor_pattern = /^svg\.lz-locuszoom\s*/;

        // Extract all relevant CSS Rules by iterating through all available stylesheets
        let extractedCSSText = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
            const s = document.styleSheets[i];
            try {
                if (!s.cssRules) {
                    continue;
                }
            } catch ( e ) {
                if (e.name !== 'SecurityError') {
                    throw e;
                } // for Firefox
                continue;
            }
            let cssRules = s.cssRules;
            for (let i = 0; i < cssRules.length; i++) {
                // FIXME: We could write smaller SVGs by extracting only the exact CSS rules for this plot. However,
                //   extracting rules (including parent selectors) is a finicky process
                // Instead just fetch all LZ plot rules, under a known hardcoded parent selector.
                const rule = cssRules[i];
                const is_match = (rule.selectorText && rule.selectorText.match(ancestor_pattern));
                if (is_match) {
                    extractedCSSText += rule.cssText;
                }
            }
        }
        return extractedCSSText;
    }

    _appendCSS( cssText, element ) {
        // Append styles to the constructed SVG DOM node
        var styleElement = document.createElement('style');
        styleElement.setAttribute('type', 'text/css');
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore( styleElement, refNode );
    }

    /**
     * Get the target dimensions for the rendered image.
     *
     * For non-vector displays, these dimensions will yield ~300 DPI image for an 8" wide print figure.
     * @return {number[]}
     * @private
     */
    _getDimensions() {
        let { width, height } = this.parent_plot.svg.node().getBoundingClientRect();
        const target_width = 2400;
        const rescale = target_width / width;
        return [rescale * width, rescale * height];
    }

    _generateSVG () {
        return new Promise((resolve) => {
            // Copy the DOM node so that we can modify the image for publication
            let copy = this.parent_plot.svg.node().cloneNode(true);
            copy.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
            copy = d3.select(copy);

            // Remove unnecessary elements
            copy.selectAll('g.lz-curtain').remove();
            copy.selectAll('g.lz-mouse_guide').remove();
            // Convert units on axis tick dy attributes from ems to pixels
            copy.selectAll('g.tick text').each(function() {
                const dy = +(d3.select(this).attr('dy').substring(-2).slice(0, -2)) * 10;
                d3.select(this).attr('dy', dy);
            });
            // Pull the svg into a string and add the contents of the locuszoom stylesheet
            // Don't add this with d3 because it will escape the CDATA declaration incorrectly
            const serializer = new XMLSerializer();

            copy = copy.node();

            // Firefox has issues saving the SVG in certain contexts (esp rendering to canvas) unless a width is given.
            //  See: https://bugzilla.mozilla.org/show_bug.cgi?id=700533
            const [width, height] = this._getDimensions();
            copy.setAttribute('width', width);
            copy.setAttribute('height', height);

            // Add CSS to the node
            this._appendCSS(this._getCSS(copy), copy);
            let svg_markup = serializer.serializeToString(copy);
            resolve(svg_markup);
        });
    }

    /**
     * Converts the SVG string into a downloadable binary object
     * @return {Promise}
     */
    _getBlobUrl() {
        return this._generateSVG().then((markup) => {
            const blob = new Blob([markup], { type: 'image/svg+xml' });
            return URL.createObjectURL(blob);
        });
    }
}
