import Vue from "vue";
//import VueCodeMirror from "vue-codemirror";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import VueCodemirror from "vue-codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";

Vue.use(BootstrapVue);
Vue.use(VueCodemirror);
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
        Alert
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    mounted() {
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
            setInterval(this.updatePendingStatuses, 300);
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
            let oldSessionId;
            let key;
            let value;
            const queryParts = window.location.search.substring(1).split("&");
            queryParts.forEach(queryPart => {
                let allParts = queryPart.split("=");
                value = allParts.pop();
                key = allParts[0];
                if (key === "session" && this.isWellFormedSessionId(value)) {
                    oldSessionId = value;
                }
            });
            if (oldSessionId) {
                this.loadSession(oldSessionId);
            } else {
                this.generateSession();
            }
        },

        generateSession() {
            // Use cryptographically secure randomness for session ID
            const randVals = window.crypto.getRandomValues(new Uint16Array(2));
            let sessionId =
                this.fourHexDigits(randVals[0]) +
                this.fourHexDigits(randVals[1]);
            this.setSessionId(sessionId, false);
        },

        setSessionId(sessionId, oldSession=false) {
            const sessionIdArea = document.getElementById("session-id-area");
            sessionIdArea.innerText = "Session ID is " + sessionId + ".";
            if (oldSession){
                this.lunarisVariantPredictor.oldSessionId = sessionId;
            } else {
                this.lunarisVariantPredictor.sessionId = sessionId;
            }
        },

        // TODO figure out why actual session job list length is less than submitted

        loadSession(idToLoad) {
            fetch("//eggserver.org/lunaris/predictor/session/" + idToLoad)
                .then(response => response.json())
                .then(session => {
                    if (session.error) {
                        this.setSessionMsg("Error:\n" + session.message);
                        window.log(session.report);
                    } else if (session.found) {
                        this.setSessionId(idToLoad, true);
                        if (session.filter) {
                            this.setMask(session.filter);
                        }
                        if (session.format) {
                            this.setOutputFormat(session.format);
                        }
                        this.clearSubmissions();
                        this.clearStatusArea();
                        session.jobs.forEach(job => {
                            const id = job.id;
                            const path = job.inputFile;
                            const inputFileName = path.substring(
                                path.lastIndexOf("/") + 1
                            );
                            this.addStatusEntry(inputFileName, id);
                        });
                        this.setSessionMsg(
                            "Loading session " + idToLoad + "."
                        );
                    } else {
                        const sessionMsg =
                            "Unknown session " +
                            idToLoad +
                            ".\nNote that sessions are only saved when something is submitted.";
                        this.setSessionMsg(sessionMsg);
                    }
                });
        },

        getIdAndLoadSession() {
            //TODO switch all DOM manipulation to real vue stuff
            const sessionId = this.sessionInput;
            if (sessionId) {
                if (this.isWellFormedSessionId(sessionId)) {
                    this.loadSession(sessionId);
                } else {
                    this.setSessionMsg(
                        sessionId + " is not a valid session ID."
                    );
                }
            }
        },

        setSessionMsg(msg) {
            const sessionArea = document.getElementById("session-invalid");
            sessionArea.textContent = msg;
        },

        setEmptySubmissionArea() {
            const submissionArea = document.getElementById("submit-table-body");
            submissionArea.innerHTML = "";
        },

        clearSubmissions() {
            this.setEmptySubmissionArea();
            this.clearInputs();
            this.filters = [];
            this.filterNames = []; // TODO evaluate in case this is custom
            this.inputFiles = [];
            this.outputFormats = [];
            this.refGenomes = [];
        },

        isValidEmail(string) {
            if (!string || string.trim().length === 0) {
                return false;
            }
            const parts = string.split("@");
            if (parts.length !== 2) {
                return false;
            }
            const [user, domain] = parts;
            const domainParts = domain.split(".");
            return (
                user &&
                user.trim().length > 0 &&
                domainParts.length > 1 &&
                domainParts.every(domainPart => domainPart.trim().length > 0)
            );
        },

        showOnBadge(e) {
            // is this a good way to do this or not?
            const inputValue = e.target.value;
            const badgeId = e.target.getAttribute("id") + "-badge";
            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.textContent = inputValue;
            }
            if (badgeId == "inputfile-badge") {
                const retrieveText = badge.textContent;
                badge.textContent = retrieveText.split("\\").pop();
            }
        },

        clearBadges() {
            const badges = document.getElementsByClassName("badge");
            for (let i = 0; i < badges.length; i++) {
                badges[i].textContent = "";
            }
        },

        setEmailMsg(msg) {
            const emailInvalidArea = document.getElementById("email-invalid");
            emailInvalidArea.textContent = msg;
        },

        generateEmailMsg(email, isValid) {
            let emailMsg = "";
            if (isValid) {
                emailMsg =
                    "Submitting jobs. Notification will be sent to " + email;
            } else {
                emailMsg =
                    email +
                    " is not a valid email. Your job has not been submitted. Please try again.";
            }
            this.setEmailMsg(emailMsg);
        },

        setSaveJobMessage(message, isError = true) {
            const saveJobMessage = document.getElementById("save-job-message");
            //saveJobMessage.innerText = errorMessage;
            if (isError) {
                saveJobMessage.innerHTML = `<span class="save-job-message">${message}</span>`;
            } else {
                saveJobMessage.innerHTML = message;
            }
        },

        saveJob() {
            const filter = this.codeMirror;
            if (filter == "" || filter == this.codeMirrorDefault) {
                this.setSaveJobMessage("Select a filter to proceed.");
                return false;
            }

            const inputFile = this.getInputFile();
            if (inputFile == "") {
                this.setSaveJobMessage("Select an input file to proceed.");
                return false;
            }

            const format = this.formatSelect;
            if (format == this.formatSelectDefault) {
                this.setSaveJobMessage("Select an output format to proceed.");
                return false;
            }

            const hg = this.hgSelect;
            if (hg == this.hgSelectDefault) {
                this.setSaveJobMessage("Select a genome to proceed.");
                return false;
            }            
            let maskName = this.maskSelect;
            if (maskName == this.maskSelectDefault){
                maskName = "Custom";
            }
            this.filters.push(filter);
            this.filterNames.push(maskName); // TODO evaluate in case this is custom
            this.inputFiles.push(inputFile);
            this.outputFormats.push(format);
            this.refGenomes.push(hg);

            let successMessage = "";
            if (this.inputFiles.length == 1){
                successMessage = "Saving job. 1 job queued.";
            } else {
                successMessage = `Saving job. ${this.inputFiles.length} jobs queued.`;
            }

            this.setSaveJobMessage(successMessage, false);
            this.showNewQueuedJob(maskName, inputFile, format, hg);
            this.setEmailMsg("");
            return true;
        },

        createJobFormData(index, email) {
            const jobFormData = new FormData();
            jobFormData.append("filter", this.filters[index]);
            jobFormData.append("inputFile", this.inputFiles[index]);
            jobFormData.append("format", this.outputFormats[index]);
            jobFormData.append(
                "session",
                this.lunarisVariantPredictor.sessionId
            );
            jobFormData.append("hg", this.refGenomes[index]);
            jobFormData.append("email", email);
            return jobFormData;
        },

        saveJobAndCreateNew() {
            if (this.saveJob()) {
                // We don't want to clear the mask someone may have entered if they missed a field and it didn't save.
                this.clearInputs();
            }
        },

        clearInputs() {
            this.resetFilters();
            // Can't be done with a v-model.
            document.getElementById("inputfile").value = "";
            
            this.hgSelect = this.hgSelectDefault;
            this.formatSelect = this.formatSelectDefault;
            this.maskSelect = this.maskSelectDefault;
            this.clearBadges();
        },

        showNewQueuedJob(filter, inputFile, format, hg) {
            const newRow = document.createElement("tr");
            this.setUpRow(newRow, false);

            this.displayInputFile(newRow, this.trimFilename(inputFile));
            this.displayRefGenome(newRow, hg);
            this.displayFilterName(newRow, filter);
            this.displayOutputFormat(newRow, format);

            const submitTableBody = document.getElementById("submit-table-body");
            submitTableBody.append(newRow);
        },

        displayInputFile(row, inputFilename) {
            const inputFileCell = row.getElementsByClassName("input-file-cell" )[0];
            inputFileCell.innerText = inputFilename;
        },

        displayRefGenome(row, refGenome) {
            const refGenomeCell = row.getElementsByClassName("ref-genome-cell")[0];
            refGenomeCell.innerText = refGenome;
        },

        displayFilterName(row, filterName) {
            const filterNameCell = row.getElementsByClassName(
                "filter-name-cell"
            )[0];
            filterNameCell.innerText = filterName;
        },

        displayOutputFormat(row, outputFormat) {
            const outputFormatCell = row.getElementsByClassName(
                "output-format-cell"
            )[0];
            outputFormatCell.innerText = outputFormat;
        },

        trimFilename(inputFile) {
            const longFilename = inputFile.name;
            const shortFilename = longFilename.split("\\").pop();
            if (shortFilename) {
                return shortFilename;
            }
            return inputFile;
        },

        // When submitted through the old site (eggserver.org) all jobs are included in a session.
        // This is reflected when the session is loaded even on the new site.
        // When submitted through the new site, only 2 jobs show up in a session.
        // This is reflected when the session is loaded even on the old site.
        //
        submitAll() {
            const emailInput = document.getElementById("email").value;
            const descriptionInput = document.getElementById("session-desc").value;
            if (this.inputFiles.length == 0) {
                setEmailMsg("There are no jobs queued for submission.");
                return;
            }

            if (descriptionInput == "") {
                setEmailMsg("Enter a description for this session in order to continue.");
                return;
            }
            // As of now, must have email in order to submit.
            if (emailInput == "") {
                setEmailMsg("Enter your email to continue.");
                return;
            }
            if (this.isValidEmail(emailInput)) {
                this.lunarisVariantPredictor.email = emailInput;
                this.generateEmailMsg(emailInput, true);
            } else {
                this.generateEmailMsg(emailInput, false);
                return;
            }

            // New session - we don't append to any old one.
            //this.generateSession();
            this.clearStatusArea();
            this.setSessionId(this.lunarisVariantPredictor.sessionId, false);

            for (let i = 0; i < this.inputFiles.length; i++) {
                const formData = this.createJobFormData(i, emailInput);
                const inputFile = this.inputFiles[i].name;
                let thisJob = this.fetchJob(formData);
                thisJob.then(response => {
                        if (!response.ok) {
                            throw "Could not submit " +
                                inputFile +
                                ": " +
                                response.statusText;
                        }
                        return response.text();
                    })
                    .then(id => {
                        this.addStatusEntry(
                            inputFile,
                            id,
                            this.refGenomes[i],
                            this.filterNames[i],
                            this.outputFormats[i]
                        );
                        this.getStatus(id);
                    })
                    .catch(this.showCouldNotSubmit);
            }
            this.clearSubmissions();
        },

        async fetchJob(formData) {
            try {
                let jobResponse = await fetch("//eggserver.org/lunaris/predictor/upload", {
                    method: "POST",
                    body: formData
                });
                if (!jobResponse.ok){
                    throw new Error("Error: " + jobResponse.status);
                }
                return jobResponse;
            } catch (error){
                console.error(error);
            }
            
            
        },

        clearStatusArea() {
            this.getStatusAreaNode().innerHTML = "";
        },

        getSchema() {
            fetch("//eggserver.org/lunaris/predictor/schema")
                .then(response => {
                    return response.json();
                })
                .then(schema => {
                    if (schema.isError) {
                        const statusTextNode = this.getStatusAreaNode();
                        statusTextNode.innerText =
                            "Unable to load available fields: " +
                            schema.message;
                    }
                    if (schema.col_names) {
                        this.lunarisVariantPredictor.fieldNames =
                            schema.col_names;
                        const fieldsSelectNode = document.getElementById("fields");
                        this.setOptionsForSelect(
                            fieldsSelectNode,
                            schema.col_names
                        );
                    }
                });
        },

        getStatusAreaNode() {
            return document.getElementById("status_area");
        },

        getSubmissionAreaNode() {
            return document.getElementById("submit-table-body");
        },

        showCouldNotSubmit(message) {
            console.error("Error: " + message);
        },

        addStatusEntry(
            inputFileName,
            id,
            refGenome = "genome",
            filterName = "filter",
            outputFormat = "format"
        ) {
            this.lunarisVariantPredictor.inputFileNames[id] = inputFileName;
            this.lunarisVariantPredictor.idsPending.push(id);
            const statusRow = document.createElement("tr");
            const statusAreaNode = this.getStatusAreaNode();
            statusAreaNode.appendChild(statusRow);
            statusRow.setAttribute("id", id);
            this.showInitialStatus(
                statusRow,
                inputFileName,
                refGenome,
                filterName,
                outputFormat
            );
        },

        setUpRow(row, isStatus) {
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

            if (isStatus) {
                const outputFileCell = document.createElement("td");
                outputFileCell.setAttribute("class", "output-file-cell");

                const restoreJobCell = document.createElement("td");
                restoreJobCell.setAttribute("class", "restore-job-cell");

                row.appendChild(outputFileCell);
                row.appendChild(restoreJobCell);
            }
        },

        showInitialStatus(
            statusRow,
            inputFileName = "name",
            refGenome = "genome",
            filterName = "filter",
            outputFormat = "format"
        ) {
            // Include the file name, reference genome, mask filter, output format, and restore link
            this.setUpRow(statusRow, true);
            this.displayInputFile(statusRow, inputFileName);
            this.displayRefGenome(statusRow, refGenome);
            this.displayFilterName(statusRow, filterName);
            this.displayOutputFormat(statusRow, outputFormat);

            const outputFileCell = statusRow.getElementsByClassName(
                "output-file-cell"
            )[0];
            outputFileCell.innerText = "Processing...";

            const restoreJobCell = statusRow.getElementsByClassName(
                "restore-job-cell"
            )[0];
            restoreJobCell.innerHTML = "<a>Restore</a>";
        },

        getStatus(id) {
            fetch("//eggserver.org/lunaris/predictor/status/" + id)
                .then(response => response.json())
                .then(status => {
                    this.lunarisVariantPredictor.statuses[id] = status;
                    this.showStatus(id);
                });
        },

        soManyErrors(nSnags) {
            if (nSnags === 0) {
                return "No errors";
            } else if (nSnags === 1) {
                return "One error";
            } else {
                return `${nSnags} errors`;
            }
        },

        showStatus(id) {
            const statusRow = document.getElementById(id);
            const outputFileCell = statusRow.getElementsByClassName(
                "output-file-cell"
            )[0];
            const inputFileName = this.lunarisVariantPredictor.inputFileNames[
                id
            ];
            const status = this.lunarisVariantPredictor.statuses[id];
            if (status) {
                if (status.succeeded) {
                    const linkNode = document.createElement("a");
                    const outputFile = id + ".tsv";
                    linkNode.setAttribute(
                        "href",
                        "//eggserver.org/lunaris/predictor/results/" +
                            outputFile
                    );
                    linkNode.setAttribute("download", outputFile);
                    linkNode.innerText = "Click here to download";
                    outputFileCell.innerHTML = "";
                    outputFileCell.append(linkNode);
                }
                const snagMessages = status.snagMessages;
                const nSnags = snagMessages.length;
                if (nSnags) {
                    console.error(nSnags);
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
            options.forEach(option => {
                selectNode.options.add(new Option(option));
            });
        },

        resetFilters() {
            this.codeMirror = "";
        },

        initMasksSelector() {
            fetch("//eggserver.org/lunaris/predictor/masks/list")
                .then(response => response.json())
                .then(masksList => {
                    this.lunarisVariantPredictor.masksList = masksList;
                    const selectNode = this.getMaskSelectNode();
                    this.setOptionsForSelect(
                        selectNode,
                        this.lunarisVariantPredictor.masksList
                    );
                });
        },

        getMaskSelectNode() {
            return document.getElementById("masks");
        },

        setOutputFormat(format) {
            this.formatSelect = format;
        },

        getInputFile() {
            let files = document.getElementById("inputfile").files;
            if (files.length == 0){
                return "";
            } else {
                return files[0];
            }

        },

        setMask(mask) {
            if (mask.slice(0, 5) == "ERROR") {
                mask = "";
            }
            this.codeMirror = mask;
        },

        setPredefinedMask(e) {
            const maskSelectNode = this.getMaskSelectNode();
            const maskName = maskSelectNode.value;
            fetch("//eggserver.org/lunaris/predictor/masks/" + maskName)
                .then(response => response.text())
                .then(mask => {
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
                theme: "material",
                lineNumbers: true
            },

            codeMirror: "Select a mask from the list above, or compose a custom mask in this field.",
            codeMirrorDefault: "Select a mask from the list above, or compose a custom mask in this field.",
            hgSelectDefault: "-- Choose genome --",
            hgSelect: "-- Choose genome --",
            maskSelectDefault: "-- Choose mask --",
            maskSelect: "-- Choose mask --",
            formatSelectDefault: "-- Choose format --",
            formatSelect: "-- Choose format --",
            sessionInput: null
        };
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
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", {
                page: "about",
                portal: group.name
            });
        }
    }
}).$mount("#app");
