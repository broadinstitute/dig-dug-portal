const d3 = require('d3')

// take categoricals and map them into a color space
const colors = [
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
];

class LazyRationalNumberPartition {

    // private variable declarations
    #depth  // aka order of magnitude considered for the rationals involved
    #base
    #generator
    #sequence

    constructor(initialSize=0, force=false, base=2) {
        this.#depth = initialSize > 0 ? Math.ceil(Math.log(initialSize)/Math.log(base)) : 2;
        this.#base = base;
        this.#generator = this.rationalNumberGenerator(this.#depth)
        this.#sequence = new Set([0,1]);

        if (initialSize && force) {
            // force the populating of the sequence upto the size
            for (let i = 0; i < initialSize; i++) {
                this.number().next();
            }
        }

    }

    * rationalNumberGenerator (orderOfMagnitude) {

        // enumerates all of the rationals that exist between 0 and 1, using a given number base and order of magnitude > 1
        // e.g. for base = 2 and depth = 1, enumerate [1/2]
        // e.g. for base = 2 and depth = 2, enumerate [1/4, 2/4, 3/4]
        // e.g. for base = 2 and depth = 5, enumerate [1/32, 2/32, 3/32, 4/32... 31/32] (because 32 = 2^5)
        // e.g. for base = 3 and depth = 2, enumerate [1/9, 2/9, 3/9... 8/9]

        // the idea is that if we need new numbers but the interval is closed, we can't increment beyond the interval.
        // for math nerds this is analogous to computing p-adic rationals given a base - but in the worst way I could come up with that still works

        // we stop shy from either n^0 = 1, or numerator = denominator, since they are already added to the set `#sequence`
        // because n is always less than denominator, it will never exceed 1, guaranteeing that the point stays within the interval [0,1]

        for (let numerator=1; numerator < this.#base**orderOfMagnitude; numerator++) {
            yield numerator / this.#base**orderOfMagnitude
        }

    }

    * number() {
        while(true) {
            let maybeNextNumber = this.#generator.next();
            if (!maybeNextNumber.done) {
                if (!this.#sequence.has(maybeNextNumber)) {
                    this.#sequence.add(maybeNextNumber.value)
                    yield maybeNextNumber;
                }
            } else {
                // else:
                // if we've reached our maximum depth and are still looking for more,
                // increase the resolution of the swing numbers by increasing our depth
                this.#depth += 1
                // restart the process
                // TODO: rewrite for memoization?
                this.#generator = this.rationalNumberGenerator(this.#depth)
                // with the new generator, try to get the next number
                yield this.number().next().value;
            }
        }
    }

    get sequence() {
        return Array.from(this.#sequence).sort()
    }

}
export class ColorSchemeClosure {
    #colorMap
    #numberGenerator
    constructor(items=[], colorScheme=d3.interpolateRgbBasisClosed(colors)) {
        this.colorScheme = colorScheme;
        this.#colorMap = new Map();

        // create a sequence of n=`items.length` amount of rational numbers between 0 and 1
        // the `force` flag being true for this instantiation, means that the sequence won't be lazy upto the size
        // that means we can have n numbers to work with already, rather than having to generate it here
        this.#numberGenerator = new LazyRationalNumberPartition(items.length, true);
        if (items.length > 0) {
            items.forEach((item, index) => this.addColor(item, this.#numberGenerator.sequence[index]));
        }
    }

    addColor(item, scale) {
        this.#colorMap.set(item, this.colorScheme(scale));
        return this.#colorMap.get(item);
    }

    getColor(item) {
        // guarantee that a color exists for an item

        // first check if we have the color
        const hasColor = this.#colorMap.has(item);

        // if we don't have the color we need to make it
        if (!hasColor) {
            // we make a color for an item, by assigning it a unique scale value, then adding a color in the usual way (using a color scheme interpolator)
            // we don't have to worry about if the color space is big enough - the number generator takes care of that for us
            // TODO: refactor this call for generator to look make it look more clean?
            this.#colorMap[item] = this.addColor(item, this.#numberGenerator.number().next().value.value);
        }
        return this.#colorMap.get(item);
    }

    colorMap() {
        return Array.from(this.#colorMap.entries());
    }

}

export const GLOBAL_COLOR_SCHEME = new ColorSchemeClosure();
export default colors;
