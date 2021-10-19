-- name: version
SELECT version()

-- name: userCredentials
SELECT
  account.primaryEmail AS email,
  COALESCE(account.emailStatus = 'status.auth.verified', false) AS emailVerified,
  account.fullName AS name,
  account_password.updatedDT AS passwordDate,
  account_password.password AS passwordHash,
  account.primaryPhone AS phone,
  COALESCE(account.phoneStatus = 'status.auth.verified', false) AS phoneVerified,
  account.createdDT as accountDate
FROM account
  INNER JOIN account_password USING (accountId)
WHERE
  account_password.account_passwordId = (
    SELECT MIN(account_passwordId)
    FROM account_password
    WHERE accountId = account.accountId
  )
  AND account.status = 'status.auth.ok'
