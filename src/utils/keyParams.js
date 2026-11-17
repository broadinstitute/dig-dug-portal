
import queryString from "query-string";
import Url from "url-parse";
import $ from "jquery";

const qs = window.location.search;
let params = queryString.parse(qs, {
    parseNumbers: true,
    parseBooleans: true,
});

let paramsWrapper = {
    set(paramMap) {
        let url = Url(window.location.href);

        Object.assign(params, paramMap);
        Object.keys(params).forEach(key => {
            if (!params[key]) {
                delete params[key];
            }
        });

        url.set('query', queryString.stringify(params));

        if (window.history && window.history.pushState) {
            $(window).on('popstate', function () {
                var hashLocation = location.hash;
                var hashSplit = hashLocation.split("#!/");
                var hashName = hashSplit[1];

                if (hashName !== '') {
                    var hash = window.location.hash;
                    if (hash === '') {

                        location.reload(true);

                    }
                }
            });

        }
        window.history.pushState({ path: url.href }, '', url.href);

    },
};

Object.setPrototypeOf(paramsWrapper, params);

export default paramsWrapper;
