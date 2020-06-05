let sort = function (data, key, keyType, way) {
    return data.sort(function (a, b) {
        if (keyType == "number") {
            var x = a[key].replace(/\,/g, "");
            x = Number(x);
            var y = b[key].replace(/\,/g, "");
            y = Number(y);
        } else {
            var x = a[key].toLowerCase();
            var y = b[key].toLowerCase();
        }

        if (way === "asc") {
            return x < y ? -1 : x > y ? 1 : 0;
        }
        if (way === "desc") {
            return x > y ? -1 : x < y ? 1 : 0;
        }
    });
}

export default {
    sort,
}
