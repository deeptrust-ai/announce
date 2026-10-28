#!/usr/bin/env python3
"""Build and deploy only to the explicitly confirmed DeepTrust sandbox account."""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = 'deeptrust-sandbox'
REGION = 'us-east-1'
ACCOUNT = '272183979614'
STACK = 'deeptrust-announcement-mocks'
AWS = ['aws', '--profile', PROFILE, '--region', REGION]


def run(*args):
    subprocess.run(list(args), cwd=ROOT, check=True)


def read(*args):
    result = subprocess.run([*AWS, *args, '--output', 'json'], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--skip-build', action='store_true', help='Use the existing dist/ production build.')
args = parser.parse_args()
identity = read('sts', 'get-caller-identity')
if identity['Account'] != ACCOUNT:
    raise SystemExit('Refusing deployment: this is not the confirmed DeepTrust sandbox account.')
if not args.skip_build:
    run('npm', 'run', 'build')
for route in ['index.html', 'doppel/index.html', 'keycard/index.html']:
    if not (ROOT / 'dist' / route).is_file():
        raise SystemExit(f'Missing production output: {route}')
print('Confirmed DeepTrust sandbox; deploying the S3/CloudFront stack.', flush=True)
run(*AWS, 'cloudformation', 'deploy', '--template-file', 'infra/announcements.cfn.json', '--stack-name', STACK,
    '--no-fail-on-empty-changeset', '--tags', 'Project=DeepTrust', 'Environment=Sandbox', 'Application=AnnouncementMocks')
stack = read('cloudformation', 'describe-stacks', '--stack-name', STACK)['Stacks'][0]
outputs = {item['OutputKey']: item['OutputValue'] for item in stack['Outputs']}
bucket = 's3://' + outputs['BucketName']
# Upload dependencies first, then publish the three HTML entry points. Keep old
# hashed assets for clients with an earlier HTML document still open.
run(*AWS, 's3', 'sync', 'dist/', bucket + '/', '--exclude', '*.html', '--exclude', 'assets/*', '--cache-control', 'public,max-age=3600', '--only-show-errors')
run(*AWS, 's3', 'sync', 'dist/assets/', bucket + '/assets/', '--cache-control', 'public,max-age=31536000,immutable', '--only-show-errors')
run(*AWS, 's3', 'cp', 'dist/', bucket + '/', '--recursive', '--exclude', '*', '--include', '*.html', '--cache-control', 'no-cache', '--content-type', 'text/html', '--only-show-errors')
invalidation = read('cloudfront', 'create-invalidation', '--distribution-id', outputs['DistributionId'], '--paths', '/*')['Invalidation']['Id']
print('Files uploaded. Waiting for CloudFront invalidation.', flush=True)
run(*AWS, 'cloudfront', 'wait', 'invalidation-completed', '--distribution-id', outputs['DistributionId'], '--id', invalidation)
metadata = {'AccountId': ACCOUNT, 'Profile': PROFILE, 'Region': REGION, 'StackName': STACK, **outputs}
(ROOT / 'infra' / 'sandbox-deployment.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2), flush=True)
