# migrate-permanent-auth0

[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)
[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

This is a one-off [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load)
script for migrating user credentials from the
[Permanent.org](https://permanent.org) application database to
[Auth0](https://auth0.com), an authentication vendor.

It connects directly to the Permanent MySQL database,
and knows the relevant parts of the database schema at the time it was written.

After extracting the data, it performs two transformations.
First, it replaces the PHP-specific `$2y$` bcrypt hash type prefix with
the standard `$2a$`, as Auth0 does not recognize that prefix; see also this
[history of BCrypt variants](https://stackoverflow.com/a/36225192).
Second, it formats the data into
[Auth0's user import schema](https://auth0.com/docs/users/import-and-export-users/bulk-user-import-database-schema-and-examples).

Finally, it loads the data into Auth0 using their
[bulk user import API](https://auth0.com/docs/users/import-and-export-users/bulk-user-imports).
(If our production data turns out to be larger than the 500KB limit,
then this will also handle splitting it into smaller chunks and submitting
multiple import jobs.)
