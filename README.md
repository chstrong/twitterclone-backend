# Welcome to the Twitter Clone Backend

This is a Typescript CDK Backend version of the Twitter Clone that is built with Serverless Framework based on Yan's School (The Burning Monk).

https://school.theburningmonk.com/courses/appsync-masterclass-premium

## AWS Services

Following are the AWS services used for this backend stack:

- AppSync GraphQL API
- Cognito
- DynamoDB

## How to build

### NPM dependencies

The backend is using some of the CDK's alpha status libraries for some newer features:

```
npm i @aws-cdk/aws-appsync-alpha
npm i @aws-cdk/aws-cognito-identitypool-alpha
```

If you encounter version conflicts during installation, make sure that aws-cdk and aws-cdk-lib in package.json are set to the same version as the alpha packages you install. You will see the version in the error message.

Once you've changed the version to whatever version the alpha packages are pointing to type "npm install". Then try install the packages again.

### config.json

In order to import JSON files such as in our case the config.json file, following parameters have to be added to tsconfig.json:

```
{
  "compilerOptions": {
    ...
    "esModuleInterop": true,
    "resolveJsonModule": true,
  },
```

## CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
