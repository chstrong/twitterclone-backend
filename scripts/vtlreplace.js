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

const templatepath = path.resolve(__dirname, '../lib/graphql/mapping-templates/TimelinePage.tweets.request_template.vtl')
const filepath = path.resolve(__dirname, '../lib/graphql/mapping-templates/TimelinePage.tweets.request.vtl')
VtlReplace(templatepath, filepath, attributes)
