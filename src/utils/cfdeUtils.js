export function kcURL(path) {
    //quality of life helper
    //converts short kc urls from "/r/<pageid>?<query>""
    //to "/research.html?pageid=<pageid>&<query>"" when on localhost

    //example use 
    //kcURL("/r/kc_landing")
    //if on localhost, returns "/r/research.html?pageid=kc_landing"
    //if on dev or prod, returns "/r/kc_landing"

    const isLocalhost = window.location.hostname === 'localhost';

    if (isLocalhost) {

        // Extract pageid and query params
        const match = path.match(/^\/r\/([^?]+)\?(.*)$/);

        console.log("match", match);
        if (!match) return path;

        const pageid = match[1];
        const query = match[2];
        return `/research.html?pageid=${pageid}&${query}`;
    } else {
        // Production URL
        return path;
    }
}

export function setSimpleLink(path) {
    const isLocalhost = window.location.hostname === 'localhost';

    if (isLocalhost) {
        const page = path.match(/^\/r\/([^/]+)/)[1];

        return `/research.html?pageid=${page}`;

    } else {
        return path;
    }
}