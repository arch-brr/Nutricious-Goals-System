# Security and privacy baseline

This application stores account data and potentially sensitive personal food-consumption records. Apply these safeguards from the first implementation slice.

- Use a maintained authentication mechanism; hash passwords with a modern password hashing scheme if the app manages passwords.
- Protect sessions with secure, HTTP-only, same-site cookies where applicable; rotate and expire credentials appropriately.
- Keep API keys and database credentials on the server and outside version control. Never expose secrets in browser bundles or logs.
- Validate and normalize all input on the server. Apply request limits and appropriate rate limits, especially to sign-in and external API proxy routes.
- Enforce ownership for every plan, log, profile, and custom food operation. Do not rely on hidden UI controls as authorization.
- Use least-privilege roles. Restrict and audit administrator operations.
- Use parameterized database access and framework protections against common web vulnerabilities, including CSRF where cookie-based sessions are used.
- Use HTTPS in deployed environments. Rely on documented database/hosting encryption controls and secure backups.
- Avoid logging passwords, tokens, API keys, or unnecessary detailed nutrition records. Define log retention.
- Check external provider terms for attribution, caching, retention, and display requirements before storing or presenting catalog data.
- Provide an understandable account deletion and data retention policy before public use.
- Label nutrition summaries as informational. Do not diagnose conditions or prescribe treatment.

This baseline is not a substitute for a deployment-specific security review. Applicable privacy obligations depend on deployment location and audience and must be confirmed before launch.
