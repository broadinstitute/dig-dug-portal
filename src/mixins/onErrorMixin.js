export const onErrorMixin = {
    methods: {
        onError: function(payLoad) {
            EventBus.$emit("NEW_ERROR", payLoad);
        }
    }
};
