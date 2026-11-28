# Configuração do projeto (Management API, segredos redigidos)

| campo | valor |
|---|---|
| projeto | Task_Gifts_V2 |
| região | us-east-2 |
| URL | https://eidsaqymojyuhprobfpn.supabase.co |
| schemas expostos (PostgREST) | public,graphql_public |
| max_rows (PostgREST) | 1000 |
| extra_search_path | public, extensions |
| PITR | não |
| branches | 1 |

```json
{
  "backups_config": {
    "pitr_enabled": false,
    "region": "us-east-2",
    "walg_enabled": true
  },
  "branches": [
    {
      "git_branch": "main",
      "id": "369c2317-0f9a-48f1-b8ec-3f53e7f71e16",
      "is_default": true,
      "name": "main",
      "persistent": false,
      "status": "FUNCTIONS_DEPLOYED"
    }
  ],
  "custom_hostname": null,
  "network_restrictions": {
    "config": {
      "dbAllowedCidrs": [
        "0.0.0.0/0"
      ],
      "dbAllowedCidrsV6": [
        "::/0"
      ]
    },
    "entitlement": "allowed",
    "status": "applied"
  },
  "pooler_config": [
    {
      "connectionString": "postgresql://postgres.eidsaqymojyuhprobfpn:[REDACTED]@aws-0-us-east-2.pooler.supabase.com:6543/postgres",
      "connection_string": "[REDACTED]",
      "database_type": "PRIMARY",
      "db_host": "aws-0-us-east-2.pooler.supabase.com",
      "db_name": "postgres",
      "db_port": 6543,
      "db_user": "postgres.eidsaqymojyuhprobfpn",
      "default_pool_size": null,
      "identifier": "eidsaqymojyuhprobfpn",
      "is_using_scram_auth": true,
      "max_client_conn": null,
      "pool_mode": "transaction"
    }
  ],
  "postgres_config": {},
  "postgrest_config": {
    "db_extra_search_path": "public, extensions",
    "db_pool": null,
    "db_pool_acquisition_timeout": 10,
    "db_pool_max_idletime": 30,
    "db_pool_max_lifetime": 1800,
    "db_schema": "public,graphql_public",
    "jwt_secret": "[REDACTED]",
    "max_rows": 1000
  },
  "project": {
    "created_at": "2026-07-24T18:01:19.135202Z",
    "id": "eidsaqymojyuhprobfpn",
    "name": "Task_Gifts_V2",
    "organization_id": "cbrlzjdoqdynorjnmmrg",
    "region": "us-east-2",
    "status": "ACTIVE_HEALTHY"
  },
  "ssl_enforcement": {
    "appliedSuccessfully": true,
    "currentConfig": {
      "database": false
    }
  },
  "url": "https://eidsaqymojyuhprobfpn.supabase.co"
}
```
