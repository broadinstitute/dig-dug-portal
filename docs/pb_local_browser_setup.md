# Run the prototype on your computer

1. **Before starting:** use macOS or Linux with Git, Node.js/npm, Python 3.11 or later, OpenSSH and rsync. Connect to the company VPN. Your own e3 SSH login must work (`ssh e3 'id -un'`), with access to group `rc_rc-data-science_gnomad-e2` and permission to submit analysis jobs. Do not use another person's SSH credentials.

2. **Clone the prototype.**

   ```bash
   git clone --depth 1 --single-branch --branch kyuryung/bch-prototype https://github.com/broadinstitute/dig-dug-portal.git dig-dug-portal-bch-prototype
   cd dig-dug-portal-bch-prototype
   ```

3. **Start the prototype.**

   ```bash
   npm run start:pb
   ```

   The first run downloads and verifies 16 approved files (about 845 MiB), builds the GT index and installs application dependencies. It stages the checkout's analysis code, opens the e3 tunnel and starts the frontend. Later runs reuse verified inputs and an active job for the same code. For another SSH alias, use `npm run start:pb -- --ssh-host YOUR_SSH_ALIAS`.

4. **Open [the prototype](http://127.0.0.1:8098/pb_front2.html)** when the frontend reports it is ready. Keep VPN and this terminal connected. **Control+C** closes the local frontend and any tunnel opened by this command. The personal Slurm job is reusable for later sessions.

Maintainers can run `npm run setup:pb-runtime`, source `.pb-private-data/local.env`, run `bash scripts/start_pb_context_demo.sh` in one terminal, and run `npm run serve:pb-phenotype` with the Python venv active in another. Use `npm run setup:pb-runtime -- --verify-only` to verify local inputs.
