
 const MISSING_VALUES = new Set(['', '.', 'NA', 'N/A', 'n/a', 'nan', '-nan', 'NaN', '-NaN', 'null', 'NULL', 'None', null]);
 const REGEX_MARKER = /^(?:chr)?([a-zA-Z0-9]+?)[_:-](\d+)[_:|-]?(\w+)?[/_:|-]?([^_]+)?_?(.*)?/;
 const REGEX_PVAL = /([\d.-]+)([\sxeE]*)([0-9-]*)/;
 
 
 function has(num) {
     return Number.isInteger(num);
 }
 
 function missingToNull(values, nulls = MISSING_VALUES, placeholder = null) {
     return values.map((v) => (nulls.has(v) ? placeholder : v));
 }
 
 function parseMarker(value, test = false) {
     const match = value.match(REGEX_MARKER);
     if (match) {
         return match.slice(1);
     }
     if (!test) {
         throw new Error('Could not understand marker format. Must be of format chr:pos or chr:pos_ref/alt');
     } else {
         return null;
     }
 }
 
 function parsePvalToLog(value, is_neg_log = false) {
     if (value === null) {
         return value;
     }
     const val = +value;
     if (is_neg_log) {
         return val;
     }
     if (val < 0 || val > 1) {
         throw new Error('p value is not in the allowed range');
     }
     if (val === 0) {
         if (value === '0') {
             return Infinity;
         }
 
         let [, base, , exponent] = value.match(REGEX_PVAL);
         base = +base;
 
         if (exponent !== '') {
             exponent = +exponent;
         } else {
             exponent = 0;
         }
         if (base === 0) {
             return Infinity;
         }
         return -(Math.log10(+base) + +exponent);
     }
     return -Math.log10(val);
 }
 
 function parseAlleleFrequency({ freq, allele_count, n_samples, is_alt_effect = true }) {
     if (freq !== undefined && allele_count !== undefined) {
         throw new Error('Frequency and allele count options are mutually exclusive');
     }
 
     let result;
     if (freq === undefined && (MISSING_VALUES.has(allele_count) || MISSING_VALUES.has(n_samples))) {
         return null;
     }
     if (freq === undefined && allele_count !== undefined) {
         result = +allele_count / +n_samples / 2;
     } else if (MISSING_VALUES.has(freq)) {
         return null;
     } else {
         result = +freq;
     }
 
     if (result < 0 || result > 1) {
         throw new Error('Allele frequency is not in the allowed range');
     }
     if (!is_alt_effect) {
         return 1 - result;
     }
     return result;
 }
 
 export {
     MISSING_VALUES, REGEX_MARKER,
     missingToNull as _missingToNull,
     has,
     parseAlleleFrequency,
     parseMarker,
     parsePvalToLog,
 };
 