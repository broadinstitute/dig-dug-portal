# Run the prototype on your computer

1. **Before starting:** use macOS or Linux with Git, Node.js/npm, Python 3.11 or later, OpenSSH and rsync. Connect to the company VPN. Your own e3 SSH login must work (`ssh e3 'id -un'`), with access to group `rc_rc-data-science_gnomad-e2` and permission to submit analysis jobs. Do not use another person's SSH credentials.

2. **Clone the prototype.**

   ```bash
   git clone --depth 1 --single-branch --branch kyuryung/bch-prototype https://github.com/broadinstitute/dig-dug-portal.git dig-dug-portal-bch-prototype
   cd dig-dug-portal-bch-prototype
   ```

3. **Install application dependencies.**

   ```bash
   python3 -m venv .pb-private-data/venv
   source .pb-private-data/venv/bin/activate
   python3 -m pip install -r scripts/requirements-pb-local.txt
   npm install
   ```

4. **Download the approved data and create local settings.** No script editing is needed.

   ```bash
   npm run setup:pb-runtime
   ```

   This downloads 15 files (about 845 MiB) from `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/prototype_runtime_data` over SSH, verifies SHA-256 checksums, builds the genotype index, and creates `.pb-private-data/local.env`. Data stays outside Git. Rerun the same command after an interrupted download; verified files are reused. If your SSH alias differs, use `npm run setup:pb-runtime -- --ssh-host YOUR_SSH_ALIAS`.

5. **Terminal 1: connect to the e3 analysis service.** Run from the cloned directory and leave this terminal open.

   ```bash
   source .pb-private-data/local.env
   bash scripts/start_pb_context_demo.sh
   ```

   Continue after the script reports opening or reusing the API tunnels, with no SSH error. The command reuses an active job or automatically starts a new one with a seven-day limit. Ended jobs clear their API processes and connection metadata; their SSH tunnels close automatically. The next start also recovers metadata/tunnels left by a forced shutdown. Inputs, results and logs persist. Older `PB_CONTEXT_ALLOW_SUBMIT=0` settings no longer prevent automatic startup. Use `bash scripts/connect_pb_context_demo.sh` if you only want to connect to an existing job without submitting one.

6. **Terminal 2: start the browser application.** Open another terminal in the same cloned directory and leave it open.

   ```bash
   source .pb-private-data/venv/bin/activate
   source .pb-private-data/local.env
   npm run serve:pb-phenotype
   ```

7. **Open [the prototype](http://127.0.0.1:8098/pb_front.html).** Search for a gene or phenotype, select a profile, and click **Apply** to run analyses through the browser. Gene example: [GJB2](http://127.0.0.1:8098/pb_gene2.html?query=GJB2). Keep VPN and both terminals connected. Use **Control+C** in each terminal when finished; `npm run stop:pb` clears a previous local application instance if needed.

The data download is separate from source and npm dependencies. `node_modules` and build caches are not included in Git. A fresh installation generates its own cache. This workflow has been checked against the prepared release; access from a second user's PC must still be confirmed with that user's own account.
