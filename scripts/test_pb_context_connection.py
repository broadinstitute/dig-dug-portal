import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
DEMO = '/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/test'
MOCK = r'''#!/usr/bin/env python3
import fcntl,json,os,shlex,sys,subprocess,tarfile,time
from pathlib import Path
name=Path(sys.argv[0]).name
args=sys.argv[1:]
root=Path(os.environ['TEST_REMOTE_ROOT'])
if os.environ.get('TEST_PRIVATE_HOME'):
    root=Path(os.environ['TEST_PRIVATE_HOME'])/'.pb-context-demo'
with Path(os.environ['TEST_LOG']).open('a') as log: log.write(json.dumps([name,args])+'\n')
state='RUNNING' if (root/'submitted').exists() else os.environ.get('TEST_STATE','RUNNING')
if name=='ssh':
    if os.environ.get('TEST_SSH_FAILURE'): sys.exit(255)
    if '-J' in args:
        (root/'tunnel_monitor.sh').write_text(sys.stdin.read())
        print(json.dumps(args));sys.exit(0)
    if 'bash' in args:
        extra=args[args.index('--')+2:]
        result=subprocess.run(['bash','-s','--',str(root),*extra],input=sys.stdin.read(),text=True)
        sys.exit(result.returncode)
    command=args[-1]
    if command=='id -un': print('reviewer')
    elif command=='printf "%s\\n" "$HOME"': print(os.environ['TEST_PRIVATE_HOME'])
    elif command.startswith('bash -c ') and 'pb-stage' in command:
        _,release=shlex.split(command)[-2:]
        with tarfile.open(fileobj=sys.stdin.buffer,mode='r|') as archive:
            for member in archive:
                assert member.name.startswith('scripts/') and member.isfile()
                target=root/'releases'/release/member.name
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(archive.extractfile(member).read())
    elif command.startswith('squeue '): sys.exit(subprocess.run(shlex.split(command)).returncode)
    elif '/runtime/node' in command: print('compute-test')
    elif '/runtime/job_id' in command: print((root/'runtime/job_id').read_text().strip())
    elif '/runtime/bioindex_host' in command: print('http://100.80.30.199:5000')
    elif '/runtime/ports' in command: print('39001 39002 39003 39004')
    else: sys.exit(2)
elif name=='squeue':
    if os.environ.get('TEST_SQUEUE_FAILURE'):
        print('Unable to contact slurm controller',file=sys.stderr);sys.exit(1)
    active_id=os.environ.get('TEST_ACTIVE_ID','456' if (root/'submitted').exists() else '123')
    if '-j' in args:
        requested=args[args.index('-j')+1]
        if requested!=active_id or state=='EXPIRED':
            print('slurm_load_jobs error: Invalid job id specified',file=sys.stderr);sys.exit(1)
        print(state)
    elif state in ('RUNNING','PENDING','CONFIGURING'):
        print(active_id+' '+state)
elif name=='sbatch':
    time.sleep(float(os.environ.get('TEST_SUBMIT_DELAY','0')))
    (root/'submitted').write_text('yes')
    (root/'runtime/job_id').write_text('456\n')
    print('456')
elif name=='flock':
    fcntl.flock(int(args[-1]),fcntl.LOCK_EX)
elif name=='lsof':
    if os.environ.get('TEST_LISTENER_PID'):
        pid=os.environ['TEST_LISTENER_PID']
        try: os.kill(int(pid),0)
        except ProcessLookupError: sys.exit(1)
        print(pid)
    elif os.environ.get('TEST_LISTENER'): print('123')
    else: sys.exit(1)
elif name=='ps':
    if args[-1]=='comm=': print('ssh')
    elif args[-1]=='uid=': print(os.getuid())
    else:
        user=os.environ.get('TEST_LISTENER_USER','reviewer')
        forwards=' '.join('-L 127.0.0.1:%s:127.0.0.1:%s'%p for p in [(8092,18092),(8094,18094),(8095,18096),(8096,18097)])
        node=os.environ.get('TEST_LISTENER_NODE','compute-test')
        print('ssh -N -J review-e3 '+forwards+' '+user+'@'+node)
elif name=='curl':
    sys.exit(7 if os.environ.get('TEST_BAD_HEALTH') else 0)
'''


class ContextConnectionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root/'runtime').mkdir()
        (self.root/'runtime/job_id').write_text('123\n')
        self.bin = self.root/'bin'
        self.bin.mkdir()
        for name in ['ssh','squeue','sbatch','flock','lsof','ps','curl']:
            path=self.bin/name
            path.write_text(MOCK)
            path.chmod(0o755)
        self.log=self.root/'calls.jsonl'
        self.env={k:v for k,v in os.environ.items() if not k.startswith('PB_CONTEXT_')}
        self.env.update(PATH=str(self.bin)+os.pathsep+os.environ['PATH'], TEST_REMOTE_ROOT=str(self.root),
                        TEST_LOG=str(self.log), PB_CONTEXT_DEMO_ROOT=DEMO,
                        PB_CONTEXT_SSH_HOST='review-e3')

    def run_script(self, name, **settings):
        return subprocess.run(['bash',str(ROOT/'scripts'/name)],env={**self.env,**settings},
                              text=True,capture_output=True,timeout=15)

    def calls(self, name):
        return [args for command,args in map(json.loads,self.log.read_text().splitlines()) if command==name]

    def test_uses_own_remote_identity_and_configured_jump_host(self):
        ready=self.root/'ready'
        result=self.run_script('connect_pb_context_demo.sh',PB_CONTEXT_READY_FILE=str(ready))
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(ready.read_text().strip(),'opening')
        args=json.loads(result.stdout.splitlines()[-1])
        self.assertEqual(args[args.index('-J')+1],'review-e3')
        self.assertIn('reviewer@compute-test',args)
        self.assertEqual(args.count('-L'),4)
        self.assertNotIn('ch239693',self.log.read_text())

    def test_new_account_stages_current_code_and_submits_its_own_job(self):
        home=self.root/'reviewer-home'
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_DEMO_ROOT='',TEST_PRIVATE_HOME=str(home),TEST_STATE='COMPLETED')
        self.assertEqual(result.returncode,0,result.stderr)
        deployment=home/'.pb-context-demo'
        self.assertTrue((deployment/'submitted').exists())
        self.assertFalse((self.root/'submitted').exists())
        release=(deployment/'runtime/submitted_release_id').read_text().strip()
        self.assertRegex(release,r'^[a-f0-9]{64}$')
        stage=deployment/'releases'/release
        self.assertEqual((stage/'scripts/gene_score_association.R').read_bytes(),(ROOT/'scripts/gene_score_association.R').read_bytes())
        self.assertIn(str(stage/'scripts/run_pb_context_demo.sbatch'),self.calls('sbatch')[0])
        self.assertIn('127.0.0.1:8096:127.0.0.1:39004',self.calls('ssh')[-1])

    def test_personal_launcher_rejects_running_stale_code(self):
        home=self.root/'reviewer-home'
        runtime=home/'.pb-context-demo/runtime'
        runtime.mkdir(parents=True)
        (runtime/'job_id').write_text('123\n')
        (runtime/'submitted_release_id').write_text('old\n')
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_DEMO_ROOT='',TEST_PRIVATE_HOME=str(home))
        self.assertEqual(result.returncode,2,result.stderr)
        self.assertIn('uses older source',result.stderr)
        self.assertFalse(self.calls('sbatch'))

    def test_explicit_compute_user_needs_no_identity_lookup(self):
        result=self.run_script('connect_pb_context_demo.sh',PB_CONTEXT_COMPUTE_USER='other-user')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('other-user@compute-test',json.loads(result.stdout.splitlines()[-1]))
        self.assertFalse(any(args[-1]=='id -un' for args in self.calls('ssh')))

    def test_reuses_matching_healthy_tunnels(self):
        ready=self.root/'ready'
        result=self.run_script('connect_pb_context_demo.sh',TEST_LISTENER='1',PB_CONTEXT_READY_FILE=str(ready))
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(ready.read_text().strip(),'reused')
        self.assertIn('All API tunnels are already available',result.stdout)
        self.assertFalse(any('-J' in args for args in self.calls('ssh')))

    def test_rejects_tunnel_owned_by_different_user(self):
        ready=self.root/'ready'
        result=self.run_script('connect_pb_context_demo.sh',TEST_LISTENER='1',TEST_LISTENER_USER='different',PB_CONTEXT_READY_FILE=str(ready))
        self.assertNotEqual(result.returncode,0)
        self.assertIn('not the requested SSH tunnel',result.stderr)
        self.assertFalse(ready.exists())

    def test_reuses_job_by_id_without_hardcoded_owner(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertFalse((self.root/'submitted').exists())
        self.assertIn(['-h','-o','%i %T'],self.calls('squeue'))
        self.assertNotIn('ch239693',self.log.read_text())

    def test_legacy_zero_setting_does_not_block_automatic_restart(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0',TEST_STATE='COMPLETED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(self.calls('sbatch')),1)

    def test_maintainer_mode_can_submit_when_enabled(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='1',TEST_STATE='COMPLETED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertTrue((self.root/'submitted').exists())
        self.assertEqual((self.root/'runtime/submitted_job_id').read_text(),'456\n')
        self.assertIn('--time=7-00:00:00',self.calls('sbatch')[0])

    def test_expired_job_is_replaced_when_submission_enabled(self):
        result=self.run_script('start_pb_context_demo.sh',TEST_STATE='EXPIRED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(self.calls('sbatch')),1)
        self.assertEqual((self.root/'runtime/submitted_job_id').read_text(),'456\n')

    def test_expired_job_with_legacy_zero_setting_restarts(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0',TEST_STATE='EXPIRED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(self.calls('sbatch')),1)

    def test_stale_submission_id_does_not_hide_running_runtime_job(self):
        (self.root/'runtime/submitted_job_id').write_text('999\n')
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('Compute job 123;',result.stdout)
        self.assertEqual(self.calls('sbatch'),[])

    def test_scheduler_failure_does_not_submit_another_job(self):
        result=self.run_script('start_pb_context_demo.sh',TEST_SQUEUE_FAILURE='1')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Unable to contact slurm controller',result.stderr)
        self.assertEqual(self.calls('sbatch'),[])

    def test_invalid_settings_and_failed_ssh_stop(self):
        for script,settings in [('connect_pb_context_demo.sh',{'PB_CONTEXT_SSH_HOST':'-unsafe'}),
                                ('connect_pb_context_demo.sh',{'PB_CONTEXT_COMPUTE_USER':'bad user'}),
                                ('connect_pb_context_demo.sh',{'TEST_SSH_FAILURE':'1'})]:
            with self.subTest(settings=settings):
                self.assertNotEqual(self.run_script(script,**settings).returncode,0)

    def test_concurrent_starts_submit_only_one_job(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda _: self.run_script('start_pb_context_demo.sh',
                              TEST_STATE='EXPIRED',TEST_SUBMIT_DELAY='0.2'),range(2)))
        for result in results:
            self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(self.calls('sbatch')),1)

    def test_restart_clears_only_stale_connection_metadata(self):
        (self.root/'runtime/node').write_text('compute-old')
        (self.root/'runtime/pid').write_text('999999')
        (self.root/'inputs.ready').touch()
        (self.root/'logs').mkdir()
        (self.root/'logs/previous.log').write_text('previous run')
        result=self.run_script('start_pb_context_demo.sh',TEST_STATE='EXPIRED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertFalse((self.root/'runtime/pid').exists())
        self.assertFalse((self.root/'runtime/node').exists())
        self.assertTrue((self.root/'inputs.ready').exists())
        self.assertEqual((self.root/'logs/previous.log').read_text(),'previous run')

    def test_replaces_owned_tunnel_to_previous_node(self):
        with subprocess.Popen(['sleep','30']) as listener:
            threading.Thread(target=listener.wait,daemon=True).start()
            try:
                result=self.run_script('connect_pb_context_demo.sh',TEST_LISTENER_PID=str(listener.pid),
                                       TEST_LISTENER_NODE='compute-old')
                self.assertEqual(result.returncode,0,result.stderr)
                self.assertIn('Closing expired analysis tunnel',result.stdout)
                self.assertEqual(json.loads(result.stdout.splitlines()[-1]).count('-L'),4)
                self.assertEqual(listener.wait(timeout=2),-15)
            finally:
                if listener.poll() is None: listener.terminate()

    def test_tunnel_monitor_exits_when_job_metadata_is_removed(self):
        result=self.run_script('connect_pb_context_demo.sh')
        self.assertEqual(result.returncode,0,result.stderr)
        (self.root/'runtime/job_id').unlink()
        result=subprocess.run(['bash',str(self.root/'tunnel_monitor.sh'),str(self.root),'123'],
                              capture_output=True,text=True,timeout=2)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('analysis job ended',result.stdout)


if __name__=='__main__':
    unittest.main()
