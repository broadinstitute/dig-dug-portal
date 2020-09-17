import * as d3 from "d3";

// Matches the .reference.color-N and .text.color-N values in colors.css
// so they can be used in code by index as well.

export default [
    '#048845',
    '#8490C8',
    '#BF61A5',
    '#EE3124',
    '#FCD700',
    '#5555FF',
    '#9ACA3C',
    '#9F78AC',
    '#F88084',
    '#F5A4C7',
    '#CEE6C1',
    '#FFFF00',
    '#6FC7B6',
    '#D5A768',
    '#D4D4D4',
]

/* Color Space Function
 If we don't know what color something should be ahead of time, but we want the color to be standardized across different parts of the interface,
 BUT, we know roughly how many colors we need, we can create a colorClosure which can create our color scheme for us on the fly. 
 */
export function colorClosure(initialColorSpaceSize=0, initialColorRegistry={}) {

    // Some assumptions this function makes:
    // * If you want a color, you'll get a color – no backsies or deletions.
    // * The colorSpaceSize needs to be sufficiently close to the size of the domain for your colors
    //   * If the colorSpaceSize is not large enough to accomodate all the colors you need, 
    //     it will resize further, at the expense of recoloring the interface (flicker).
    //   * If the colorSpaceSize is too large, then your colors will bias to a certain part of the spectrum and won't distinguish from each other well.
    // * All colors are meant to be unique and without repetition.
    // * The color space is first-come, first-serve and thus allowed to be path-dependent (it's OK for a tissue to have different colors in different sessions)

    // TODO: rewrite using new Map() and d3.schemeSpectral?
    let colorRegistry = initialColorRegistry;
    let colorSpaceSize = initialColorSpaceSize;
    let colorScheme = d3.scaleSequential(d3.interpolateSpectral); // TODO: this, or interpolator function?

    return function retrieveColor(label) {
        let maybeColor = !!colorRegistry[label];
        if (!maybeColor) {
            colorRegistry[label] = ''; // just add the element so we can make the registry bigger and use it to get the next color, without needing a counter variable.
            if (Object.keys(colorRegistry).length > colorSpaceSize) {
                colorSpaceSize = Object.keys(colorRegistry).length + Math.floor(colorSpaceSize * 0.5); // arbitrary adjustment on estimate. this can be zero and the colorSpace will grow to extactly what it needs to be.
            }
            colorRegistry[label] = colorScheme(Object.keys(colorRegistry).length / colorSpaceSize);
        }
        return colorRegistry[label];
    }

}
// use this if you want to share colors across the application
// edit DEFAULT_COLOR_MAP with colors you want to standardize on
const DEFAULT_COLOR_MAP = {};
export const globalColorSpace = colorClosure(10, DEFAULT_COLOR_MAP);