# migrate-permanent-fusionauth

[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)
[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

This is a one-off [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load)
script for migrating user credentials from the
[Permanent.org](https://permanent.org) application database to
[FusionAuth](https://fusionauth.com), an authentication vendor.

It connects directly to the Permanent MySQL database,
and knows the relevant parts of the database schema at the time it was written.

After extracting the data, it transforms it into the
[FusionAuth user import schema](https://fusionauth.io/docs/v1/tech/apis/users/#import-users).
This includes spliting the bcrypt hash into the fields FusionAuth expects,
as [the FusionAuth user import endpoint cannot parse bcrypt hash
strings](https://fusionauth.io/community/forum/topic/1048/issue-with-bcrypt-on-import-of-users).

Finally, it loads the data into FusionAuth using their
[bulk user import API](https://fusionauth.io/docs/v1/tech/apis/users/#import-users).

## Usage

Copy `.env.template` to `.env`, set the values, and run `npm run start`.
