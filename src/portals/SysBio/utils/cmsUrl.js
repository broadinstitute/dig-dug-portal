import { USE_REMOTE_CMS, BASE_URL } from "@/utils/runtimeConfig";

const REMOTE = "https://hugeampkpncms.org";
const LOCAL = `${BASE_URL.replace(/\/$/, "")}/cmsdata`;

export function cmsUrl(kind, id) {
    if (USE_REMOTE_CMS) {
        switch (kind) {
            case "byor_content":
                return `${REMOTE}/rest/byor_content?id=${id}`;
            case "news_list":
                return `${REMOTE}/rest/news_list?project=${id}`;
            case "news":
                return `${REMOTE}/rest/news?id=${id}`;
            case "directcsv":
                return `${REMOTE}/rest/directcsv?id=${id}`;
            case "asset":
                return `${REMOTE}${id.startsWith("/") ? id : "/" + id}`;
        }
    } else {
        switch (kind) {
            case "byor_content":
                return `${LOCAL}/rest/byor_content/${id}.json`;
            case "news_list":
                return `${LOCAL}/rest/news_list/${id}.json`;
            case "news":
                return `${LOCAL}/rest/news/${id}.json`;
            case "directcsv":
                return `${LOCAL}/rest/directcsv/${id}.json`;
            case "asset":
                return `${LOCAL}${id.startsWith("/") ? id : "/" + id}`;
        }
    }
    throw new Error(`cmsUrl: unknown kind ${kind}`);
}
