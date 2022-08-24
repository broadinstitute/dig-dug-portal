/* Importing this module will automatically parse the query string in the
 * current href for any parameters this page should use. For example:
 *
 * HREF: http://localhost:8090/page.html?chr=X&start=1000000&phenotype=T2D
 *
 * import keyParams from "@/utils/keyParams";
 *
 * console.log(keyParams);
 *
 * // The above should output:
 * // {'chr': 'X', 'start': 1000000, 'phenotype': 'T2D'}
 */

import queryString from "query-string";
import Url from "url-parse";
import $ from "jquery";

// get the query string
const qs = window.location.search;
let params = queryString.parse(qs, {
    parseNumbers: true,
    parseBooleans: true,
});

let paramsWrapper = {
    set(paramMap) {
        let url = Url(window.location.href);
        //let params = queryString.parse(url.query);

        // update the params, remove undefined
        Object.assign(params, paramMap);
        Object.keys(params).forEach(key => {
            if (!params[key]) {
                delete params[key];
            }
        });

        // update the query string in the url
        url.set('query', queryString.stringify(params));

        // update the url
        if (window.history && window.history.pushState) {
            $(window).on('popstate', function () {
                var hashLocation = location.hash;
                var hashSplit = hashLocation.split("#!/");
                var hashName = hashSplit[1];

                if (hashName !== '') {
                    var hash = window.location.hash;
                    if (hash === '') {
                        //alert('Back button was pressed.');

                        location.reload(true);

                    }
                }
            });

        }
        window.history.pushState({ path: url.href }, '', url.href);

    },
};

Object.setPrototypeOf(paramsWrapper, params);

// Parse the query string of the URL to get the parameters of this page.
export default paramsWrapper;
