# Hacking

If you want to hack this package, you will have to:
 - create an account on npmjs.com (https://www.npmjs.com/signup)
 - enable 2FA in `auth-only` mode (https://docs.npmjs.com/getting-started/using-two-factor-authentication)
 - generate a read-write token (https://docs.npmjs.com/getting-started/working_with_tokens)
 - change the name of this package (so that it does not collide with my version on npmjs.com)
 - publish it manually for the first time (`npm publish --tag testing`)
 - change the version number each time you scratch your jenkins (`npm version patch`)
