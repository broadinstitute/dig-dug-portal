let sort = function (data, key, isNumeric, isAscending) {
    return data.sort(function (a, b) {
        var x = a[key].toLowerCase();
        var y = b[key].toLowerCase();

        if (isNumeric) {
            x = Number(x.replace(/\,/g, ""));
            y = Number(y.replace(/\,/g, ""));
        }

        if (isAscending) {
            return x < y ? -1 : x > y ? 1 : 0;
        } else {
            return x > y ? -1 : x < y ? 1 : 0;
        }
    });
}

const uniqBy = (arr, predicate) => {
    const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];
    
    return [...arr.reduce((map, item) => {
      const key = (item === null || item === undefined) ? 
        item : cb(item);
      
      map.has(key) || map.set(key, item);
      
      return map;
    }, new Map()).values()];
};

export default {
    sort,
    uniqBy,
}
