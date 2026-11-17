import parseUrl from "url-parse";

const url = parseUrl(window.location.href);

let parts = url.hostname.split('.');
let host = parts.pop();

if (host !== 'localhost') {
    host = `${parts.pop()}.${host}`;
}

export default {
    url,

    domain: host,

    subDomain: (parts.length > 0) ? parts.join('.') : null,

    urlWithSubdomain(s) {
        if (s) {
            url.set('hostname', `${s}.${host}`);
        } else {
            url.set('hostname', host);
        }

        return url;
    },
}
