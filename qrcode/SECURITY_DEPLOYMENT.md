# Login protection deployment

The login protection is fail-closed and requires all of these production settings:

1. Apply `supabase/migrations/202608080001_server_side_login_protection.sql`.
2. Set `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) only in the server environment.
3. Set `LOGIN_RATE_LIMIT_SECRET` to a long random value.
4. Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` from the same Cloudflare Turnstile widget.
5. In Supabase Dashboard, open **Authentication → Bot and Abuse Protection**, enable CAPTCHA protection, select Cloudflare Turnstile, and enter the Turnstile secret key. This setting is required to protect the public Supabase password endpoint used by Dashboard login.

Never prefix the Supabase secret key or the rate-limit secret with `NEXT_PUBLIC_`.
