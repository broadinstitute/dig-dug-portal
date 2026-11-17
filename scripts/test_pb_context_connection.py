"""Check portable SSH configuration without contacting HPC or submitting jobs."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
DEMO = '/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/test'
MOCK = r'''#!/usr/bin/env python3
import json,os,sys,subprocess
from pathlib import Path
name=Path(sys.argv[0]).name
args=sys.argv[1:]
root=Path(os.environ['TEST_REMOTE_ROOT'])
with Path(os.environ['TEST_LOG']).open('a') as log: log.write(json.dumps([name,args])+'\n')
state='RUNNING' if (root/'submitted').exists() else os.environ.get('TEST_STATE','RUNNING')
if name=='ssh':
    if os.environ.get('TEST_SSH_FAILURE'): sys.exit(255)
    if '-N' in args:
        print(json.dumps(args));sys.exit(0)
    if 'bash' in args:
        allow=args[-1]
        result=subprocess.run(['bash','-s','--',str(root),allow],input=sys.stdin.read(),text=True)
        sys.exit(result.returncode)
    command=args[-1]
    if command=='id -un': print('reviewer')
    elif command.startswith('squeue '): print(state)
    elif '/runtime/node' in command: print('compute-test')
    elif '/runtime/job_id' in command: print((root/'runtime/job_id').read_text().strip())
    elif '/runtime/bioindex_host' in command: print('http://100.80.30.199:5000')
    else: sys.exit(2)
elif name=='squeue':
    print(state)
elif name=='sbatch':
    (root/'submitted').write_text('yes')
    (root/'runtime/job_id').write_text('456\n')
    print('456')
elif name=='lsof':
    if os.environ.get('TEST_LISTENER'): print('123')
    else: sys.exit(1)
elif name=='ps':
    if args[-1]=='comm=': print('ssh')
    else:
        user=os.environ.get('TEST_LISTENER_USER','reviewer')
        forwards=' '.join('-L 127.0.0.1:%s:127.0.0.1:%s'%p for p in [(8092,18092),(8094,18094),(8095,18096)])
        print('ssh -N -J review-e3 '+forwards+' '+user+'@compute-test')
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
        for name in ['ssh','squeue','sbatch','lsof','ps','curl']:
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
        result=self.run_script('connect_pb_context_demo.sh')
        self.assertEqual(result.returncode,0,result.stderr)
        args=json.loads(result.stdout.splitlines()[-1])
        self.assertEqual(args[args.index('-J')+1],'review-e3')
        self.assertEqual(args[-1],'reviewer@compute-test')
        self.assertEqual(args.count('-L'),3)
        self.assertNotIn('ch239693',self.log.read_text())

    def test_explicit_compute_user_needs_no_identity_lookup(self):
        result=self.run_script('connect_pb_context_demo.sh',PB_CONTEXT_COMPUTE_USER='other-user')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertTrue(result.stdout.rstrip().endswith('"other-user@compute-test"]'))
        self.assertFalse(any(args[-1]=='id -un' for args in self.calls('ssh')))

    def test_reuses_matching_healthy_tunnels(self):
        result=self.run_script('connect_pb_context_demo.sh',TEST_LISTENER='1')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('All API tunnels are already available',result.stdout)
        self.assertFalse(any('-N' in args for args in self.calls('ssh')))

    def test_rejects_tunnel_owned_by_different_user(self):
        result=self.run_script('connect_pb_context_demo.sh',TEST_LISTENER='1',TEST_LISTENER_USER='different')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('not the requested SSH tunnel',result.stderr)

    def test_reuses_job_by_id_without_hardcoded_owner(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertFalse((self.root/'submitted').exists())
        self.assertIn(['-h','-j','123','-o','%T'],self.calls('squeue'))
        self.assertNotIn('ch239693',self.log.read_text())

    def test_trial_mode_never_submits_job(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='0',TEST_STATE='COMPLETED')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Ask the maintainer',result.stderr)
        self.assertFalse((self.root/'submitted').exists())
        self.assertEqual(self.calls('sbatch'),[])

    def test_maintainer_mode_can_submit_when_enabled(self):
        result=self.run_script('start_pb_context_demo.sh',PB_CONTEXT_ALLOW_SUBMIT='1',TEST_STATE='COMPLETED')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertTrue((self.root/'submitted').exists())
        self.assertEqual((self.root/'runtime/submitted_job_id').read_text(),'456\n')

    def test_invalid_settings_and_failed_ssh_stop(self):
        for script,settings in [('connect_pb_context_demo.sh',{'PB_CONTEXT_SSH_HOST':'-unsafe'}),
                                ('connect_pb_context_demo.sh',{'PB_CONTEXT_COMPUTE_USER':'bad user'}),
                                ('start_pb_context_demo.sh',{'PB_CONTEXT_ALLOW_SUBMIT':'yes'}),
                                ('connect_pb_context_demo.sh',{'TEST_SSH_FAILURE':'1'})]:
            with self.subTest(settings=settings):
                self.assertNotEqual(self.run_script(script,**settings).returncode,0)


if __name__=='__main__':
    unittest.main()
