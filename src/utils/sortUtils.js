let sort = function (data, key, isNumeric, isAscending) {
    return data.sort(function (a, b) {
        if (isNumeric) {
            var x = a[key].replace(/\,/g, "");
            x = Number(x);
            var y = b[key].replace(/\,/g, "");
            y = Number(y);
        } else {
            var x = a[key].toLowerCase();
            var y = b[key].toLowerCase();
        }

        if (isAscending) {
            return x < y ? -1 : x > y ? 1 : 0;
        } else {
            return x > y ? -1 : x < y ? 1 : 0;
        }
    });
}

export default {
    sort,
}
