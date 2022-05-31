import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;


import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";


new Vue({
    store,

    components: {
        StaticPageInfo,
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.init();
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        
init() {
    this.initSession();
    this.getSchema();
    this.initMasksSelector();
    const codeMirrorParent = document.getElementById("code_mirror_parent");
    // TODO set this up
    codeMirror = CodeMirror(codeMirrorParent, codeMirrorConfig);
    codeMirror.setSize("100%", "7.5em");
    this.setUpInputDisplays();
    setInterval(updatePendingStatuses, 300);
},

setUpInputDisplays(){
    const badgeInputs = document.getElementsByClassName("has-badge");
    let badgeInput;
    for (let i = 0; i < badgeInputs.length; i++) {
        badgeInput = badgeInputs[i];
        badgeInput.onchange = this.showOnBadge;
    }
    let maskInput = document.getElementById("masks");
    maskInput.onchange = this.setPredefinedMask;
},

fourHexDigits(num) {
    return ("000" + num.toString(16)).substr(-4);
},

isWellFormedSessionId(id) {
    const sessionIdRegex = /^[0-9a-f]{8}$/;
    return id.match(sessionIdRegex);
},

initSession() {
    let sessionId;
    let key;
    let value;
    const queryParts = window.location.search.substring(1).split("&");
    queryParts.forEach ( queryPart => {
        //[key, value] = queryPart.split("=");
        value = queryPart.split("=").pop();
        key = queryPart;
        if(key === "session" && this.isWellFormedSessionId(value)) {
            sessionId = value;
        }
    })
    if(sessionId) {
        this.loadSession(sessionId);
    } else {
        sessionId =
            this.fourHexDigits((new Date).getTime() % 65536) + this.fourHexDigits(Math.floor(Math.random() * 65537));
        this.setSessionId(sessionId);
    }
},

setSessionId(sessionId) {
    document.getElementById("session_id_area").innerText = sessionId;
    this.lunarisVariantPredictor.sessionId = sessionId;
},

loadSession(sessionId) {
    fetch("http://eggserver.org:8080/lunaris/predictor/session/" + sessionId)
        .then((response) => response.json())
        .then((session) => {
            if(session.error) {
                this.setSessionMsg("Error:\n" + session.message);
                window.log(session.report);
            } else if(session.found) {
                this.setSessionId(sessionId);
                if(session.filter) {
                    this.setMask(session.filter);
                }
                if(session.format) {
                    this.setOutputFormat(session.format);
                }
                this.setEmptySubmissionArea();
                session.jobs.forEach(job => {
                    console.log(job);
                    const id = job.id;
                    const path = job.inputFile;
                    const inputFileName = path.substring(path.lastIndexOf("/") + 1);
                    this.addStatusEntry(inputFileName, id);
                });
                this.setSessionMsg("Loading session " + sessionId + ".");
            } else {
                const sessionMsg = "Unknown session " + sessionId +
                    ".\nNote that sessions are only saved when something is submitted.";
                this.setSessionMsg(sessionMsg);
            }
        });
},

getIdAndLoadSession(){
    const sessionInput = document.getElementById("sessioninput");
    const sessionId = sessionInput.value;
    if (sessionId){
        if(this.isWellFormedSessionId(sessionId)){
            this.loadSession(sessionId);
        } else {
            this.setSessionMsg(sessionId + " is not a valid session ID.");
        }
    }
},

setSessionMsg(msg) {
    const sessionArea = document.getElementById("session-invalid");
    sessionArea.textContent = msg;
},

setEmptySubmissionArea() {
    const submissionArea = document.getElementById("submission_area");
    submissionArea.innerHTML = "";
},


isValidEmail(string) {
    if(!string || string.trim().length === 0) {
        return false;
    }
    const parts = string.split("@");
    if(parts.length !== 2) {
        return false;
    }
    const [user, domain] = parts;
    const domainParts = domain.split("\.");
    return user && user.trim().length > 0 && domainParts.length > 1 &&
        domainParts.every(domainPart => domainPart.trim().length > 0);
},

showOnBadge(e){
    // is this a good way to do this or not?
    const inputValue = e.target.value;
    const badgeId = e.target.getAttribute("id") + "-badge";
    const badge = document.getElementById(badgeId);
    if (badge){
        badge.textContent = inputValue;
    }
    if (badgeId == "inputfile-badge"){
        const retrieveText = badge.textContent;
        badge.textContent = retrieveText.split("\\").pop();
    }

},

clearBadges(){
    const badges = document.getElementsByClassName("badge");
    for (let i = 0; i < badges.length; i++){
        badges[i].textContent = "";
    }
},

setEmailMsg(msg){
    const emailInvalidArea = document.getElementById("email-invalid");
    emailInvalidArea.textContent = msg;
},

generateEmailMsg(email, isValid){
    let emailMsg = "";
    if (isValid){
        emailMsg = "Submitting job. Notification will be sent to " + email;
    } else {
        emailMsg = email + " is not a valid email. Your job has not been submitted. Please try again.";
    }
    setEmailMsg(emailMsg);
},

setSaveJobMessage(errorMessage){
    const saveJobMessage = document.getElementById("save-job-message");
    saveJobMessage.innerText = errorMessage;
},

saveJob(){
    const filter = codeMirror.getValue();
    if (filter == ""){
        setSaveJobMessage("Select a filter to proceed.");
        return false;
    }

    const inputFile = this.getInputFile();
    if (inputFile == ""){
        setSaveJobMessage("Select an input file to proceed.");
        return false;
    }

    const format = this.getOutputFormat();
    if (format == ""){
        setSaveJobMessage("Select an output format to proceed.");
        return false;
    }

    const hg = this.getHg();
    if (hg == ""){
        setSaveJobMessage("Select a genome to proceed.");
        return false;
    }

    this.setSaveJobMessage("");

    this.filters.push(filter);
    this.filterNames.push(getMaskSelectNode().value); // TODO evaluate in case this is custom
    this.inputFiles.push(inputFile);
    this.outputFormats.push(format);
    this.refGenomes.push(hg);

    const maskName = getMaskSelectNode().value;
    this.showNewQueuedJob(maskName, inputFile, format, hg);
    this.setEmailMsg("");
    return true;
},

createJobFormData(index, email){
    const jobFormData = new FormData();
    jobFormData.append("filter", this.filters[index]);
    jobFormData.append("inputFile", this.inputFiles[index]);
    jobFormData.append("format", this.outputFormats[index]);
    jobFormData.append("session", this.lunarisVariantPredictor.sessionId);
    jobFormData.append("hg", this.refGenomes[index]);
    jobFormData.append("email", email);
    return jobFormData;
},

saveJobAndCreateNew(){
    if (this.saveJob()){
        // We don't want to clear the mask someone may have entered if they missed a field and it didn't save.
        this.clearInputs();
    }
},

clearInputs(){
    this.resetFilters();
    document.getElementById("inputfile").value = "";
    // First options on these select boxes are placeholders. We'll restore them.
    document.getElementById("hg").value = document.querySelector("#hg option").textContent;
    document.getElementById("formats").value =
        document.querySelector("#formats option").textContent;
    document.getElementById("masks").value =
        document.querySelector("#masks option").textContent;
    this.clearBadges();
},

showNewQueuedJob(filter, inputFile, format, hg){
    const newRow = document.createElement("tr");
    this.setUpRow(newRow, false);

    this.displayInputFile(newRow, trimFilename(inputFile));
    this.displayRefGenome(newRow, hg);
    this.displayFilterName(newRow, filter);
    this.displayOutputFormat(newRow, format);

    const submitTableBody = document.getElementById("submit-table-body");
    submitTableBody.append(newRow);

},

displayInputFile(row, inputFilename){
    const inputFileCell = row.getElementsByClassName("input-file-cell")[0];
    inputFileCell.innerText = inputFilename;
},

displayRefGenome(row, refGenome){
    const refGenomeCell = row.getElementsByClassName("ref-genome-cell")[0];
    refGenomeCell.innerText = refGenome;
},

displayFilterName(row, filterName){
    const filterNameCell = row.getElementsByClassName("filter-name-cell")[0];
    filterNameCell.innerText = filterName;
},

displayOutputFormat(row, outputFormat){
    const outputFormatCell = row.getElementsByClassName("output-format-cell")[0];
    outputFormatCell.innerText = outputFormat;
},

trimFilename(inputFile){
    const longFilename = inputFile.name;
    const shortFilename = longFilename.split("\\").pop();
    if (shortFilename){
        return shortFilename;
    }
    return inputFile;
},

submitAll(){
    const emailInput = document.getElementById("email").value;
    const descriptionInput = document.getElementById("session-desc").value;

    if (inputFiles.length == 0){
        setEmailMsg("There are no jobs queued for submission.");
        return;
    }

    if (descriptionInput == ""){
        setEmailMsg("Enter a description for this session in order to continue.");
        return;
    }
    // As of now, must have email in order to submit.
    if (emailInput == ""){
        setEmailMsg("Enter your email to continue.");
        return;
    }
    if(isValidEmail(emailInput)) {
        lunarisVariantPredictor.email = emailInput;
        this.generateEmailMsg(emailInput, true);
    } else {
        this.generateEmailMsg(emailInput, false);
        return;
    }

    for (let i = 0; i < inputFiles.length; i++){
        const formData = this.createJobFormData(i, emailInput);
        const inputFile = inputFiles[i];
        // TODO ACCOUNT for multiple fetch requests - this is a loop
        fetch("http://eggserver.org/lunaris/predictor/upload", {method: "POST", body: formData})
            .then((response) => {
                if (!response.ok) {
                    throw "Could not submit " + inputFile + ": " + response.statusText;
                }
                return response.text();
            })
            .then((id) => {
                this.addStatusEntry(inputFile, id, refGenomes[i], filterNames[i], outputFormats[i]);
                this.getStatus(id);
            }).catch(this.showCouldNotSubmit);
    }
},

getSchema() {
    fetch("http://eggserver.org/lunaris/predictor/schema")
        .then((response) => {
            return response.json();
        })
        .then((schema) => {
            if (schema.isError) {
                const statusTextNode = this.getStatusAreaNode();
                statusTextNode.innerText = "Unable to load available fields: " + schema.message;
            }
            if (schema.col_names) {
                this.lunarisVariantPredictor.fieldNames = schema.col_names;
                const fieldsSelectNode = document.getElementById("fields");
                this.setOptionsForSelect(fieldsSelectNode, schema.col_names);
            }
        })
},

getStatusAreaNode() {
    return document.getElementById("status_area");
},

getSubmissionAreaNode() {
    return document.getElementById("submission_area");
},

showCouldNotSubmit(message) {
    /*const pNode = document.createElement("p");
    pNode.innerText = message;
    const statusAreaNode = getSubmissionAreaNode();
    statusAreaNode.append(pNode);*/
    console.log(message);
},

addStatusEntry(inputFileName, id, refGenome="genome", filterName="filter", outputFormat="format") {
    lunarisVariantPredictor.inputFileNames[id] = inputFileName;
    lunarisVariantPredictor.idsPending.push(id);
    const statusRow = document.createElement("tr");
    const statusAreaNode = this.getSubmissionAreaNode();
    statusAreaNode.appendChild(statusRow);
    statusRow.setAttribute("id", id);
    this.showInitialStatus(statusRow, inputFileName, refGenome, filterName, outputFormat);
},

setUpRow(row, isStatus){
    const inputFileCell = document.createElement("td");
    inputFileCell.setAttribute("class", "input-file-cell");

    const refGenomeCell = document.createElement("td");
    refGenomeCell.setAttribute("class", "ref-genome-cell");

    const filterNameCell = document.createElement("td");
    filterNameCell.setAttribute("class", "filter-name-cell");

    const outputFormatCell = document.createElement("td");
    outputFormatCell.setAttribute("class", "output-format-cell");

    row.appendChild(inputFileCell);
    row.appendChild(refGenomeCell);
    row.appendChild(filterNameCell);
    row.appendChild(outputFormatCell);

    if (isStatus){
        const outputFileCell = document.createElement("td");
        outputFileCell.setAttribute("class", "output-file-cell");

        const restoreJobCell = document.createElement("td");
        restoreJobCell.setAttribute("class", "restore-job-cell");

        row.appendChild(outputFileCell);
        row.appendChild(restoreJobCell);
    }
},

showInitialStatus(statusRow, inputFileName="name", refGenome="genome", filterName="filter", outputFormat="format") {
    // Include the file name, reference genome, mask filter, output format, and restore link
    this.setUpRow(statusRow, true);
    this.displayInputFile(statusRow, inputFileName);
    this.displayRefGenome(statusRow, refGenome);
    this.displayFilterName(statusRow, filterName);
    this.displayOutputFormat(statusRow, outputFormat);

    const outputFileCell = statusRow.getElementsByClassName("output-file-cell")[0];
    outputFileCell.innerText = "Processing...";

    const restoreJobCell = statusRow.getElementsByClassName("restore-job-cell")[0];
    restoreJobCell.innerHTML = "<a>Restore</a>";
},

getStatus(id) {
    fetch("http://eggserver.org/lunaris/predictor/status/" + id)
        .then((response) => response.json())
        .then((status) => {
            lunarisVariantPredictor.statuses[id] = status;
            this.showStatus(id);
        });
}, 

soManyErrors(nSnags) {
    if(nSnags === 0) {
        return "No errors";
    } else if(nSnags === 1) {
        return "One error";
    } else {
        return `${nSnags} errors`;
    }
},

showStatus(id) {
    const statusRow = document.getElementById(id);
    const outputFileCell = statusRow.getElementsByClassName("output-file-cell")[0];
    const inputFileName = lunarisVariantPredictor.inputFileNames[id];
    const status = lunarisVariantPredictor.statuses[id];
    if (status) {
        if (status.succeeded) {
            const linkNode = document.createElement("a");
            const outputFile = id + ".tsv"
            linkNode.setAttribute("href", "/lunaris/predictor/results/" + outputFile);
            linkNode.setAttribute("download", outputFile);
            linkNode.innerText = "Click here to download";
            outputFileCell.innerHTML = "";
            outputFileCell.append(linkNode);
        }
        const snagMessages = status.snagMessages;
        const nSnags = snagMessages.length;
        if(nSnags) {
            console.log(nSnags);
            /*const snagNode = document.createTextNode(" " + soManyErrors(nSnags));
            const snagNodeSpan = document.createElement("span");
            snagNodeSpan.style.color = "red";
            snagNodeSpan.appendChild(snagNode)
            outputFileCell.append(snagNodeSpan);
            const snagMessagesClass = "snagMessages";
            if(!statusRow.getElementsByClassName(snagMessagesClass).length) {
                const snagsDivNode = document.createElement("div");
                snagsDivNode.innerText = snagMessages.join("\n");
                snagsDivNode.classList.add(snagMessagesClass);
                snagsDivNode.style.height = "5em";
                snagsDivNode.style.width = "95%"
                snagsDivNode.style.margin = "auto";
                snagsDivNode.style.overflowY = "scroll";
                snagsDivNode.style.color = "red";
                statusRow.appendChild(snagsDivNode);
            }*/
        }
    } else {
        this.showInitialStatus(statusRow, inputFileName);
    }
},

updatePendingStatuses() {
    const idsPendingNew = [];
    let i = 0;
    const idsPending = this.lunarisVariantPredictor.idsPending;
    while (i < idsPending.length) {
        const id = idsPending[i];
        this.getStatus(id);
        const status = this.lunarisVariantPredictor.statuses[id];
        if (!status.completed) {
            idsPendingNew.push(id);
        }
        i++;
    }
    this.lunarisVariantPredictor.idsPending = idsPendingNew;
}, 

setOptionsForSelect(selectNode, options) {
    options.forEach((option) => {
        selectNode.options.add(new Option(option));
    })
},

resetFilters() {
    codeMirror.setValue("");
},

initMasksSelector() {
    fetch("http://eggserver.org/lunaris/predictor/masks/list")
        .then((response) => response.json())
        .then((masksList) => {
            lunarisVariantPredictor.masksList = masksList;
            const selectNode = this.getMaskSelectNode();
            this.setOptionsForSelect(selectNode, lunarisVariantPredictor.masksList);
        });
},

getMaskSelectNode() {
    return document.getElementById("masks");
},


getOutputFormatNode() {
    return document.getElementById("formats");
},

setOutputFormat(format) {
    getOutputFormatNode().value = format;
},

getOutputFormat() {
    const selection = this.getOutputFormatNode().value;
    if (selection == "-- Choose format --"){
        return "";
    }
    return selection;
},

getInputFile(){
    return document.getElementById("inputfile").files[0];

},

getHg() {
    const selection = document.getElementById("hg").value;
    if (selection == "-- Choose genome --"){
        return "";
    }
    return selection;
},

setMask(mask) {
    if (mask.slice(0, 5) == "ERROR"){
        mask = "";
    }
    codeMirror.setValue(mask);
},

setPredefinedMask(e) {
    const maskSelectNode = this.getMaskSelectNode();
    const maskName = maskSelectNode.value;
    fetch("https://eggserver.org/lunaris/predictor/masks/" + maskName)
        .then((response) => response.text())
        .then((mask) => {
            this.setMask(mask);
        });
}
    },

    data() {
        return {
            lunarisVariantPredictor: {
                inputFileNames: {},
                statuses: {},
                idsPending: [],
            fieldNames: [],
            stringOperators: ["==", "=~", "!=", "!=~"],
            numericalOperators: ["<", "<=", ">", ">="],
            operators: ["==", "=~", "!=", "!=~", "<", "<=", ">", ">="],
            filterGroupCounter: 0,
            filterCounter: 0,
            filters: [],
            masksList: []
        },
        
        filters: [],
        filterNames: [],
        inputFiles: [],
        refGenomes: [],
        outputFormats: [],
        
        codeMirrorConfig: {
            theme: "liquibyte",
            lineNumbers: true,
        },
        
        codeMirror: null,
    }
    },

    computed: {

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },




    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", { "page": "about", "portal": group.name });
        },

    }
}).$mount("#app");
