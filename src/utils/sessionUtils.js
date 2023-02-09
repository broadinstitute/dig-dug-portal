let generate = function () {
    let sessionId =
        fourHexDigits(new Date().getTime() % 65536) +
        fourHexDigits(Math.floor(Math.random() * 65537));
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
