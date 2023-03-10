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

#### Amplify Appsync Simulator

This is required to test the VTL templates

```
npm i amplify-appsync-simulator --save-dev
npm i amplify-velocity-template --save-dev
```

#### Axios

This is required to connect to GraphQL

```
npm i axios --save-dev
```

#### Lodash

```
npm i lodash --save-dev
```

#### ULID

```
npm i ulid --save-dev
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

## Signup a user through AWS CLI

aws cognito-idp --region us-east-1 sign-up --client-id 3sve8sftvq6f37thh7n8vbupks --username test@test.com --password 123456 --user-attributes Name=name,Value=Testuser

## Testing

Running a single test file.

```
npx jest Foo.test.js
```

## Changes to course

- Partition and Sort key have to be provided mandatory when both are specified. This wasn't the case in earlier versions of DynamoDB queries.

- followers and followedBy are not yet set and can't be tested in getTweets query.

## Issues

- In "Implement getTweets Query", under Otherprofile, following and followedBy have not been implemented yet.

- "Add acceptance test for tweet mutation" is cut off to early. When implementing "Add acceptance test for getTweets" the a_user_calls_tweets function has already been modified and looks different.

## Tips

- When testing queries in the console and they fail, there is a small LOGS checkbox below the output field. Enable this, run the query and you can then jump to the Cloudwatch logs by clicking on the link.

## CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

      email: 'jean-massey-zilr@test.com',
      password: 'J)Xr64',

query MyQuery {
  getMyTimeline(limit: 10) {
    nextToken
    tweets {
      id
      createdAt
      profile {
        id
        name
        screenName
      }
      ... on Tweet {
        likes
        replies
        retweets
        text
      }
    }
  }
}