# expenses-v2

Wep app to upload, tag and view transactions.

# Running in Docker

Need to first create a .env file in the project root using the template in `env.md`.

```shell
$ scripts/build.sh
$ scripts/run.sh
```

The app will be available on localhost:3000.

# Transactions JSON Format

The outer most object should be an array where each element represents a
transaction with the following keys:

- "date": (string) Date the transaction occurred in the format `yyyy/mm/dd`.
- "description": (string) A description of the transaction.
- "amount": (number) The amount that was transacted. Negative numbers imply money flowed out of the account.
- "institution": (string) Name of the financial institution + account the transaction occurred in.
- "tag": (string, optional) A tag or category for the transaction.

Example JSON below:

```JSON
[
    {"date": "2020/01/01", "description": "Monthly fee", "amount": "-8.95", "institution": "TD_CHEQUING", "tag": "banking"},
    {"date": "2020/01/01", "description": "Tim Hortons", "amount": "-1.98", "institution": "TD_VISA", "tag": "food"},
    {"date": "2020/01/02", "description": "Interac Transfer - John Doe", "amount": "-2950", "institution": "TD_CHEQUING", "tag": "rent"},
    {"date": "2020/01/03", "description": "Payroll Deposit - Acme Corp", "amount": "100", "institution": "TD_CHEQUING", "tag": "salary"},
]
```

# DB Access for Development

```shell

# On the Kubernetes node running the Postgres db
kubectl -n expenses port-forward svc/expenses-db-cluster-rw 5432:5432

# On the development machine, create ssh tunnel to Kubernete node
ssh -L 5432:localhost:5432 user@ssh_server_address
```
