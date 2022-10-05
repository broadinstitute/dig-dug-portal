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

function biDomain() {
    let content = url.port == ""
        ? "https://bioindex.hugeamp.org"
        : "https://bioindex-dev.hugeamp.org";

    return content;
}


export default {
    url,

    //BioIndex domain for BYOR

    biDomain,

    // the domain name
    domain: host,

    // the sub domain from the host
    subDomain: (parts.length > 0) ? parts.join('.') : null,

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
