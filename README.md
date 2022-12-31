# Welcome to the Twitter Clone Backend

This is a Typescript CDK Backend version of the Twitter Clone that is built with the Serverless Framework in Yan's School (The Burning Monk).

https://school.theburningmonk.com/courses/appsync-masterclass-premium

## AWS Services

Following are the AWS services used for this backend stack:

- AppSync GraphQL API
- Cognito
- DynamoDB

## How to build

### Required NPM libraries

#### Required CDK Alpha libraries

The backend is using some of the CDK's alpha status libraries for some newer features:

```
npm i @aws-cdk/aws-appsync-alpha
npm i @aws-cdk/aws-cognito-identitypool-alpha
```

If you encounter version conflicts during installation, make sure that aws-cdk and aws-cdk-lib in package.json are set to the same version as the alpha packages you install. You will see the version in the error message.

Once you've changed the version to whatever version the alpha packages are pointing to type "npm install". Then try install the packages again.

#### AWS SDK

We need to install the AWS SDK for a Cognito Lambda Trigger function, that will write the user information into the DynamoDB user table.

```
npm i aws-sdk
npm i @types/aws-lambda --save-dev
```

#### ESBuild

NodejsFunction requires esbuild. So we will need to install it.

```
npm i esbuild --save-dev
```

#### Chance

This helps with generation of data.

```
npm i chance --save-dev
npm i @types/chance --save-dev
```

#### dotenv (might not...)

```
npm i dotenv --save-dev
```

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

### cdk-env.json

In order to to be able and use the latest configuration from CDK when we deploy our application we can use --outputs-file=cdk-env.json.

This will create a file with all the CnfOutputs that we can use, especially in our test scripts.

```
cdk deploy --all --outputs-file=cdk-env.json
```

We want to ensure that this file, as it contains sensitive data is not checked into Git.

```
npm install -g envfile
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
