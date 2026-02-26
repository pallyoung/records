# API Error Codes

- `AUTH_INVALID_CREDENTIALS`: invalid login credentials
- `AUTH_TOKEN_EXPIRED`: access token expired
- `AUTH_REFRESH_REVOKED`: refresh token revoked or unknown
- `FORBIDDEN_RESOURCE_ACCESS`: user does not own requested resource
- `FILE_UPLOAD_SIGNATURE_FAILED`: failed to generate upload signature
- `FILE_DOWNLOAD_SIGNATURE_FAILED`: failed to generate download signature
- `SYNC_OPERATION_CONFLICT`: stale base version during sync push
- `SYNC_INVALID_CURSOR`: malformed or expired sync cursor
- `AI_PROVIDER_TIMEOUT`: model provider timeout
- `AI_PROVIDER_ERROR`: model provider request failed
