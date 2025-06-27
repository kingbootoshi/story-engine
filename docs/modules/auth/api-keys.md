# API Key Authentication

The Story Engine supports API key authentication for SDK and programmatic access alongside the existing JWT-based authentication for web users.

## Overview

API keys provide a secure way to authenticate API requests without requiring a full OAuth flow. They are ideal for:
- SDK integrations
- CI/CD pipelines
- Server-to-server communication
- Automated scripts

## How It Works

1. **Generation**: Users generate API keys through the authenticated API endpoints
2. **Storage**: Keys are hashed using bcrypt before storage (never stored in plain text)
3. **Authentication**: Clients send the API key via `X-API-Key` header
4. **Authorization**: API keys grant the same permissions as the user who created them

## API Endpoints

### Create API Key
```http
POST /api/auth/apiKeys/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Production SDK Key",
  "expires_at": "2025-12-31T23:59:59Z" // optional
}
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Production SDK Key",
  "key": "se_1234567890abcdef...", // Only shown once!
  "key_prefix": "se_1234567...",
  "created_at": "2024-01-01T00:00:00Z",
  "expires_at": "2025-12-31T23:59:59Z",
  "message": "Store this key securely. It will not be shown again."
}
```

### List API Keys
```http
GET /api/auth/apiKeys/list
Authorization: Bearer <jwt-token>
```

Response:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production SDK Key",
    "key_prefix": "se_1234567...",
    "created_at": "2024-01-01T00:00:00Z",
    "last_used_at": "2024-01-15T10:30:00Z",
    "expires_at": "2025-12-31T23:59:59Z",
    "is_active": true
  }
]
```

### Revoke API Key
```http
POST /api/auth/apiKeys/revoke
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "keyId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Update API Key Name
```http
POST /api/auth/apiKeys/update
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Key Name"
}
```

## Using API Keys

### Making Authenticated Requests

Include the API key in the `X-API-Key` header:

```bash
curl -X GET https://api.story-engine.com/api/worlds/list \
  -H "X-API-Key: se_your_api_key_here"
```

### JavaScript/TypeScript Example

```typescript
const response = await fetch('https://api.story-engine.com/api/worlds/list', {
  headers: {
    'X-API-Key': process.env.STORY_ENGINE_API_KEY,
    'Content-Type': 'application/json'
  }
});

const worlds = await response.json();
```

### Python Example

```python
import requests
import os

headers = {
    'X-API-Key': os.environ['STORY_ENGINE_API_KEY'],
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.story-engine.com/api/worlds/list',
    headers=headers
)

worlds = response.json()
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** to store keys
3. **Rotate keys regularly** (every 90 days recommended)
4. **Set expiration dates** when creating keys
5. **Revoke unused keys** immediately
6. **Use different keys** for different environments (dev, staging, prod)
7. **Monitor key usage** via the `last_used_at` field

## Technical Details

- **Key Format**: `se_` prefix followed by 32 bytes of cryptographically secure random data
- **Hashing**: bcrypt with cost factor 10
- **Caching**: Valid keys are cached for 15 minutes to improve performance
- **Rate Limiting**: API key endpoints are rate-limited to prevent abuse
- **Audit Trail**: All key operations are logged with correlation IDs

## Migration from JWT

Existing endpoints that support JWT authentication via `Authorization: Bearer <token>` also support API key authentication via `X-API-Key: <key>`. No code changes are required on the client side beyond switching the authentication method.

## Troubleshooting

### Invalid API Key
- Ensure the key starts with `se_`
- Check if the key has been revoked
- Verify the key hasn't expired
- Confirm you're using the full key, not just the prefix

### Permission Denied
- API keys inherit the permissions of the user who created them
- Ensure the user has access to the requested resource

### Rate Limiting
- API keys are subject to the same rate limits as JWT authentication
- Consider implementing exponential backoff in your client