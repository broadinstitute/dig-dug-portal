let generate = function () {
    let sessionId =
        fourHexDigits(new Date().getTime() % 65536) +
        fourHexDigits(window.crypto.getRandomValues(new Uint16Array(1))[0]);
    //this.setSessionId(sessionId, false);
    return sessionId;
};

let fourHexDigits = function (num) {
    return ("000" + num.toString(16)).slice(-4);
};

let getInSession = function (RAW, INSESSION, COLUMN) {
    let inSessionPhs = INSESSION.map((p) => p.name);
    let newData = [];

    RAW.map((d) => {
        if (inSessionPhs.includes(d[COLUMN])) {
            newData.push(d);
        }
    });
    return newData;
};

export default {
    generate,
    getInSession,
};
