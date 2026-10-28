# Sandbox static hosting

Deploys to the user-confirmed **DeepTrust sandbox account 272183979614** using
profile `deeptrust-sandbox`, in `us-east-1`. The deployment script verifies STS
identity and refuses a different account.

```sh
python3 scripts/deploy-sandbox.py
```

The script builds all three entry points, applies the CloudFormation stack,
uploads assets before HTML, then invalidates CloudFront. `--skip-build` uses an
already completed production build. It does not run tests or touch the dev server.

- Root: black page with white `Loaded 200 OK` text.
- `/doppel/`: Doppel scene.
- `/keycard/`: Keycard scene.

The bucket blocks all public access. CloudFront uses signed origin access
control and a bucket policy restricted to this distribution. HTTPS is enforced.
A viewer-request function maps directory routes to their own `index.html`;
unknown routes do not fall back to the root. Scene query parameters are handled
in the browser and excluded from the CloudFront cache key.

HTML uses `no-cache`, hashed build assets are immutable, and unchanged branding
and model assets cache for one hour. Old hashed assets are retained for open
clients. S3 versioning is enabled. The bucket is retained if the stack is deleted.
No custom domain or DNS records are created. CloudFront's default HTTPS hostname
is used. Deployment outputs are recorded in `sandbox-deployment.json` only after
stack creation, upload, and invalidation succeed.

References:
- [AWS: S3 origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [AWS: Directory-index rewrite](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example_cloudfront_functions_url_rewrite_single_page_apps_section.html)
