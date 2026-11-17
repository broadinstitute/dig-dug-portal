import parseUrl from "url-parse";

// The url, parsed as an object.
const url = parseUrl(window.location.href);

// extract the domain from the url
let parts = url.hostname.split('.');
let host = parts.pop();

// strip the full domain name (handle localhost)
if (host !== 'localhost') {
    host = `${parts.pop()}.${host}`;
}

export default {
    url,

    // the domain name
    domain: host,

    // the sub domain from the host
    // Every page of this portal (header, footer, front-page contents, news,
    // datasets) runs as the "aggregator" group, whatever host serves it.
    subDomain: 'aggregator',

    // return a new Url object replacing the sub domain of the current
    urlWithSubdomain(s) {
        if (s) {
            url.set('hostname', `${s}.${host}`);
        } else {
            url.set('hostname', host);
        }

        return url;
    },
}
