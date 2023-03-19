const fs = require('fs')
require('dotenv').config()
const path = require('path')

const VtlReplace = (templatepath, filepath, attributes) => {
    const mappingTemplate = fs.readFileSync(templatepath, 'utf-8');
    var str = mappingTemplate.toString();

    console.log("Before: " + str)

    attributes.forEach((value, key) => {
        str = str.replace(key, value)
    });

    console.log("After: " + str)

    fs.writeFileSync(filepath,str,{encoding:'utf8',flag:'w'})
}

const attributes = new Map()
attributes.set("{TWEET_TABLE}", process.env.TWEET_TABLE)
attributes.set("{LIKE_TABLE}", process.env.LIKE_TABLE)
attributes.set("{USER_TABLE}", process.env.USER_TABLE)

const unhydratedTweetsPageTweetsRequestTmpl = path.resolve(__dirname, '../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.request_template.vtl')
const unhydratedTweetsPageTweetsRequestFile = path.resolve(__dirname, '../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.request.vtl')
VtlReplace(unhydratedTweetsPageTweetsRequestTmpl, unhydratedTweetsPageTweetsRequestFile, attributes)

const unhydratedTweetsPageTweetsResponseTmpl = path.resolve(__dirname, '../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.response_template.vtl')
const unhydratedTweetsPageTweetsResponseFile = path.resolve(__dirname, '../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.response.vtl')
VtlReplace(unhydratedTweetsPageTweetsResponseTmpl, unhydratedTweetsPageTweetsResponseFile, attributes)

const mutationLikeRequestTmpl = path.resolve(__dirname, '../lib/graphql/mapping-templates/Mutation.like.request_template.vtl')
const mutationLikeRequestFile = path.resolve(__dirname, '../lib/graphql/mapping-templates/Mutation.like.request.vtl')
VtlReplace(mutationLikeRequestTmpl, mutationLikeRequestFile, attributes)

const mutationUnlikeRequestTmpl = path.resolve(__dirname, '../lib/graphql/mapping-templates/Mutation.unlike.request_template.vtl')
const mutationUnlikeRequestFile = path.resolve(__dirname, '../lib/graphql/mapping-templates/Mutation.unlike.request.vtl')
VtlReplace(mutationUnlikeRequestTmpl, mutationUnlikeRequestFile, attributes)