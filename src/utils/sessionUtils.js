let generate = function () {

    let sessionId =
        fourHexDigits(new Date().getTime() % 65536) +
        fourHexDigits(Math.floor(Math.random() * 65537));
    //this.setSessionId(sessionId, false);
    return sessionId;
}

let fourHexDigits = function (num) {
    return ("000" + num.toString(16)).substr(-4);
}

export default {
    generate,
}
