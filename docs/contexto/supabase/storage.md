# Storage

Policies de `storage.objects`/`storage.buckets` em `policies.md`. Contagens em `stats.md`.

| bucket | público | limite por arquivo | mime permitidos | criado em |
|---|---|---|---|---|
| course-uploads | não | 10.0 MB | application/pdf, text/plain, text/markdown | 2026-08-06 16:19:15.149578+00 |
| org-assets | não | 10.0 MB | image/png, image/jpeg, image/webp, image/svg+xml, application/pdf | 2026-09-01 15:46:10.130316+00 |

## Configuração (Management API)

```json
{
  "capabilities": {
    "iceberg_catalog": true,
    "list_v2": true,
    "object_versioning": false
  },
  "external": {
    "upstreamTarget": "canary"
  },
  "features": {
    "icebergCatalog": {
      "enabled": true,
      "maxCatalogs": 2,
      "maxNamespaces": 10,
      "maxTables": 10
    },
    "imageTransformation": {
      "enabled": true
    },
    "purgeCache": {
      "enabled": true
    },
    "s3Protocol": {
      "enabled": true
    },
    "vectorBuckets": {
      "enabled": true,
      "maxBuckets": 10,
      "maxIndexes": 5
    }
  },
  "fileSizeLimit": 52428800,
  "migrationVersion": "s3-multipart-uploads-parts-index"
}
```
