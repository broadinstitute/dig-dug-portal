
import querystring from "query-string";
import cookie from "cookie";
import Vue from "vue";

let session_cookie = undefined;

if (!!document.cookie) {
    session_cookie = cookie.parse(document.cookie).session;
}

export const BIO_INDEX_HOST = "SERVER_IP_ADDRESS";
export const BIO_INDEX_HOST_PRIVATE = "SERVER_IP_PRIVATE";

function bioIndexHost(query_private = false) {
    if (query_private && typeof window !== "undefined" && window.BIOINDEX_HOST_PRIVATE_OVERRIDE) {
        return window.BIOINDEX_HOST_PRIVATE_OVERRIDE;
    }
    if (!query_private && typeof window !== "undefined" && window.BIOINDEX_HOST_OVERRIDE) {
        return window.BIOINDEX_HOST_OVERRIDE;
    }
    return query_private ? BIO_INDEX_HOST_PRIVATE : BIO_INDEX_HOST;
}

export function apiUrl(path, query_private = false) {
    if (path.startsWith("/")) {
        path = path.substr(1);
    }

    if (query_private) {
        return `${bioIndexHost(true)}/${path}`;
    } else {
        return `${bioIndexHost(false)}/${path}`;
    }
}

export function rawUrl(path, query_params, query_private=false) {
    let qs = querystring.stringify(query_params, { skipNull: true });
    let rawURL = `${apiUrl(path, query_private)}${qs ? "?" + qs : ""}`
    if(path.includes("/log/")){
        rawURL = `${apiUrl(path, query_private)}${qs ? "?" + qs : ""}${"|"+Vue.prototype.$useremail}`
    }
    return rawURL;
}

export async function request(path, query_params, query_private=false, options={}) {
    return fetch(rawUrl(path, query_params, query_private), {
        headers: {
            "x-bioindex-access-token": session_cookie,
        },
        signal: options.signal,
    });
}

export async function query(index, q, opts = {}, query_private=false) {
    let { limit, onResolve, onError, onLoad, limitWhile} = opts;
    let req = request(`/api/bio/query/${index}`, { q, limit }, query_private);
    if (query_private == true){
        request(`/api/bio/log/${index}`, { q, limit }, query_private);
    }
    return await processRequest(req, onResolve, onError, onLoad, limitWhile, query_private);
}

export async function match(index, q, opts = {},query_private=false) {
    let { limit, onLoad, onResolve, onError } = opts;
    let req = request(`/api/bio/match/${index}`, { q, limit }, query_private);

    return await processRequest(req, onResolve, onError, onLoad, query_private);
}

function limitRecordsWhile(json, limitWhile) {
    let data = json.data;

    if (!!limitWhile) {
        data = json.data.filter(limitWhile);

        if (data.length < json.count) {
            json.continuation = null;
        }
    }

    return data;
}

async function processRequest(req, onResolve, onError, onLoad, limitWhile, query_private=false) {
    let resp = await req;
    let json = await resp.json();
    let data = [];


    if (resp.status === 200) {
        data = limitRecordsWhile(json, limitWhile);

        if (!!onResolve) {
            onResolve(json);
        }

        while (!!json.continuation) {
            let req = request(`/api/bio/cont`, { token: json.continuation }, query_private);

            resp = await req;
            json = await resp.json();

            if (resp.status === 200) {
                data = data.concat(limitRecordsWhile(json, limitWhile));

                if (!!onResolve) {
                    onResolve(json);
                }
            }
        }

        if (!!onLoad) {
            onLoad(json);
        }
    }

    if (resp.status !== 200) {
        if (!!onError) {
            onError(json);
        }
    }
    return data;
}

export default {
    query,
    match,
    apiUrl,
    request,
    rawUrl,
    BIO_INDEX_HOST,
    BIO_INDEX_HOST_PRIVATE,
};
