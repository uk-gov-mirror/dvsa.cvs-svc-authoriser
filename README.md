# cvs-svc-authoriser
Custom authentication and authorisation mechanism for all CVS API Gateway calls.

* Calls to CVS APIG trigger Lambda handler [authorizer.ts][authorizer-ts], as described on [AWS Lambda Authorizer Input][lambda-authorizer-input].
* This Lambda will return a policy document, as described on [AWS Lambda Authorizer Input][lambda-authorizer-input].

## Documentation
See the [Lambda Authorizer Confluence page][confluence].

## Configuration
* Configuration is a TS object of type `AuthorizerConfig`.
* Both `AuthorizerConfig` and the configuration itself are in [configuration.ts][configuration-ts].
* A (fake) example can be found [here][fake-config].

## Prerequisites
### Node JS
Check you have Node and NPM in your terminal:
```shell script
node --version
npm --version
```

**We strongly recommend [`nvm`][nvm] to manage your Node installations** ([`nvm-windows`][nvm-windows] on Windows). The project's `.nvmrc` (root directory) contains the recommended Node version.

To install on Linux:
```shell script
sudo apt install nodejs
```

To install on MacOS, either:
* Download from [official site][nodejs]
* Use [Homebrew][homebrew]: `brew install node`

To install on Windows, either:
* Download from [official site][nodejs]
* Use [Chocolatey][chocolatey]: `cinst nodejs.install`

## Dependencies
```shell script
npm install
```

Note the project's `.npmrc` intentionally specifies [`save-exact`][save-exact]. This means dependencies at runtime will be locked to the specific version present in `package.json`.

## Environment variables
This project does not have a `.env` file. Environment variables are not needed for local development, including for running tests. *If this changes in future, please update this documentation.*

Policy documents (authorizer return values) use four environment variables:

| Environment variable   | Default     |
|------------------------|-------------|
| `AWS_REGION `          | `eu-west-1` |
| `AWS_ACCOUNT_ID`       | `*`         |
| `AWS_APIG_ID`          | `*`         |
| `AWS_APIG_STAGE`       | `*`         |

Currently, **none of these are explicitly set by Terraform**, so the default values are important.

In addition, all Terraform'd Lambda functions in DVSA share three environment variables:

* `BRANCH`, currently set in `package.json` scripts. Doesn't make a difference when running locally.
* `BUCKET`, unused.
* `SECRET_NAME`, unused.

## Build
```shell script
npm run build
```

Output folder: `build/` (Git-ignored)

On Windows, you will need to use [Git Bash][git-bash]. You may also need to:
* replace `export` statements with your own environment variable configuration.
* find binaries for things like `cpio`.

## Test
```shell script
npm test
```

This project only contains unit tests. For integration tests, see [cvs-svc-auto][cvs-svc-auto].

## Run
This Lambda is an authorizer and shouldn't be directly executed.

For debugging purposes, available choices are:
   * Call the Lambda manually (it's not exposed directly via APIG) with [the right input][lambda-authorizer-input].
   * Protect something with the authorizer (e.g. an existing non-prod endpoint) and call it.

[confluence]: https://wiki.dvsacloud.uk/display/HVT/Lambda+Authoriser
[nvm]: https://github.com/nvm-sh/nvm
[nvm-windows]: https://github.com/coreybutler/nvm-windows
[nodejs]: https://nodejs.org
[homebrew]: https://brew.sh
[chocolatey]: https://chocolatey.org
[git-bash]: https://git-scm.com/downloads
[save-exact]: https://docs.npmjs.com/cli/v6/using-npm/config#save-exact
[cvs-svc-auto]: https://github.com/dvsa/cvs-auto-svc
[authorizer-ts]: https://github.com/dvsa/cvs-svc-authoriser/blob/develop/src/functions/authorizer.ts
[configuration-ts]: https://github.com/dvsa/cvs-svc-authoriser/blob/develop/src/services/configuration.ts
[fake-config]: https://github.com/dvsa/cvs-svc-authoriser/blob/develop/tests/resources/config-test.yml
[lambda-authorizer-input]: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html
[lambda-authorizer-output]: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
