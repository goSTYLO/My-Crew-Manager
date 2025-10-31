# EMAIL_VERIFICATION_README.md
# Email Verification (Django + DRF)

## Setup

Add to `.env` (Gmail App Password required):

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=mycrewmanager.ml@gmail.com
EMAIL_HOST_PASSWORD=nlxu bovq nqfs jzfo
DEFAULT_FROM_EMAIL=My Crew Manager <mycrewmanager.ml@gmail.com>
VERIFICATION_CODE_TTL_MIN=10
VERIFICATION_MAX_ATTEMPTS=5
VERIFICATION_RESEND_COOLDOWN_SEC=60
```

Run migrations:

```
python manage.py makemigrations users
python manage.py migrate
```

## Endpoints

- POST `/api/user/email/request`
  - Body: `{ "email": "user@example.com" }`
  - Response: `204 No Content`

- POST `/api/user/email/verify`
  - Body: `{ "email": "user@example.com", "code": "123456" }`
  - Success: `200 { "verified": true }`
  - Failure: `400 { "detail": "invalid or expired" }` or `429 { "detail": "too many attempts" }`

## Behavior

- 6‑digit codes
- TTL: 10 minutes
- Max attempts: 5 (locks record)
- Resend cooldown: 60 seconds per email
- Only code hashes stored (no plaintext codes)

## Testing

Use in-memory email backend:

```
EMAIL_BACKEND=django.core.mail.backends.locmem.EmailBackend
```

Add unit tests for: successful verify, wrong code increments attempts, expiry handling.

## Troubleshooting

- Ensure Gmail 2FA + App Password configured
- Check env values loaded (see `backend/config/settings.py`)

