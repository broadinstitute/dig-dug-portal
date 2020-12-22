// Matches the .reference.color-N and .text.color-N values in colors.css
// so they can be used in code by index as well.
class SwingNumberSet {

    // private variable declarations
    #depth
    #base
    #numberGenerator
    #swingSequence

    constructor(depth=2, base=2) {
        this.#depth = depth;
        this.#base = base;
        this.#numberGenerator = this.rationalNumberGenerator(this.#depth)
        this.#swingSequence = new Set([0,1])
    }

    * rationalNumberGenerator (depth) {
        // enumerates all of the rationals that exist with a within a given base and order of magnitude
        // because n is always less than denominator, it will never exceed 1, guaranteeing that the point stays within the interval
        for (let numerator=1; numerator < this.#base**depth; numerator++) {
            yield numerator / this.#base**depth
        }
    }

    * swingNumber() {
        while(true) {
            let maybeNextSwingNumber = this.#numberGenerator.next();
            if (!maybeNextSwingNumber.done) {
                if (!this.#swingSequence.has(maybeNextSwingNumber)) {
                    this.#swingSequence.add(maybeNextSwingNumber.value)
                    yield maybeNextSwingNumber
                }
            } else {
                // else:
                // if we've reached our maximum depth and are still looking for more,
                // increase the resolution of the swing numbers by increasing our depth
                this.#depth += 1
                // restart the process
                this.#numberGenerator = this.rationalNumberGenerator(this.#depth)
                yield this.swingNumber().next()
            }
        }
    }

    interleave(sequence) {
        const left = sequence.slice(0, Math.ceil(sequence.length / 2));
        const right = sequence.slice(Math.ceil(sequence.length / 2), sequence.length).reverse();
        let interleaved = [];
        for (let i = 0; i < left.length || i < right.length; i++) {
            // can't do double bang/!! - the items are numbers, which means it would skip over `0` which is a valid value.
            if (typeof left[i !== 'undefined']) interleaved.push(left[i])
            if (typeof right[i !== 'undefined']) interleaved.push(right[i])
        }
        return interleaved;
    }

    get sequence() {
        return this.interleave(Array.from(this.#swingSequence).sort())
    }
}

function makeSwingNumberSet(size, base=2) {
    let depth = Math.ceil(Math.log(size)/Math.log(base));
    let sns = new SwingNumberSet(depth, base);
    for (let i = 0; i < size; i++) {
        // the sequence is generated as a side effect of the generation
        sns.swingNumber().next();
    }
    return sns.sequence;
}

sns = makeSwingNumberSet(3000);
console.log(sns)
// take categoricals and map them into a color space
class GlobalColorScheme {
    #itemValueMap
    #itemColorMap
    constructor(items, colorScheme) {
        this.#itemValueMap = new Map();
        this.#itemColorMap = new Map();

        this.colorScheme = colorScheme;

        // TODO: refactor to D3 interpolator interface
        const resolution = Math.ceil(Math.log(items.length) / Math.log(base));
        this.swingNumberSet = new SwingNumberSet(resolution, base=2);

    }

    addColor(itemName) {
        // associate to the item, a value that can be interpolated into a continuous color space (hopefully one with a lot of discontinuity)
        const interpolationPoint = this.swingNumberSet.swingNumber().next();
        this.#itemValueMap.set(itemName, interpolationPoint);
        this.#itemColorMap.set(itemName, this.colorScheme(this.#itemValueMap.get(itemName)));
        return this.#itemColorMap.get(itemName);
    }

    colorFor(itemName) {
        // guarantee that a color exists for an item
        const hasColor = this.#itemColorMap.has(itemName);
        if (!hasColor) {
            this.#itemColorMap[itemName] = this.addColor(itemName);
        }
        return this.#itemColorMap[itemName];
    }
}

// export {
//     GlobalColorScheme
// }

// export default [
//     '#048845',
//     '#8490C8',
//     '#BF61A5',
//     '#EE3124',
//     '#FCD700',
//     '#5555FF',
//     '#9ACA3C',
//     '#9F78AC',
//     '#F88084',
//     '#F5A4C7',
//     '#CEE6C1',
//     '#FFFF00',
//     '#6FC7B6',
//     '#D5A768',
//     '#D4D4D4',
// ];
