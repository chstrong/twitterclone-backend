const fs = require('fs')
require('dotenv').config()
const path = require('path')

const VtlReplace = (templatepath, filepath, attributes) => {
    const mappingTemplate = fs.readFileSync(templatepath, 'utf-8');
    var str = mappingTemplate.toString();

    console.log("Before: " + str)

    attributes.forEach((value, key) => {
        //str = str.replace(key, value)
        str = str.split(key).join(value)
    });

    console.log("After: " + str)
    console.log("Writting to:", filepath)

    fs.writeFileSync(filepath,str,{encoding:'utf8',flag:'w'})
}

const dirPath = "../lib/graphql/mapping-templates/"

const attributes = new Map()
attributes.set("{TWEET_TABLE}", process.env.TWEET_TABLE)
attributes.set("{LIKE_TABLE}", process.env.LIKE_TABLE)
attributes.set("{USER_TABLE}", process.env.USER_TABLE)
attributes.set("{RELATIONSHIP_TABLE}", process.env.RELATIONSHIP_TABLE)

const tmplFiles = [
    "UnhydratedTweetsPage.tweets.request",
    "UnhydratedTweetsPage.tweets.response",
    "Mutation.like.request",
    "Mutation.unlike.request",
    "Mutation.follow.request",
    "Mutation.unfollow.request",
    "Reply.inReplyToUsers.request",
    "Reply.inReplyToUsers.response",
    "hydrateFollowers.request",
    "hydrateFollowers.response",
    "hydrateFollowing.request",
    "hydrateFollowing.response",
]

tmplFiles.forEach(function(tmplfile) {
    const tmpl = path.resolve(__dirname, dirPath + tmplfile + "_template.vtl")
    const file = path.resolve(__dirname, dirPath + tmplfile + ".vtl")
    VtlReplace(tmpl, file, attributes)
})