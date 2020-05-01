let COUNTER_ID = 1;

export default {
    getUniqueId: function(prefix) {
        const id = `${!!prefix ? prefix : ""}_${Date.now()}_${COUNTER_ID}`;
        COUNTER_ID += 1;
        return id;
    }
};
