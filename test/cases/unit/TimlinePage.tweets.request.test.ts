require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('UnhydratedTweetsPage.tweets.request template', () => {
  it("Should return empty array if source.tweets is empty", () => {
    const templatePath = path.resolve(__dirname, '../../../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.request.vtl')

    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, {}, { tweets: [] })
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual([])
  })

  it("Should convert timeline tweets to BatchGetItem keys", () => {
    const templatePath = path.resolve(__dirname, '../../../lib/graphql/mapping-templates/UnhydratedTweetsPage.tweets.request.vtl')

    const username = chance.guid()
    const tweetId = chance.guid()
    const tableName:string = process.env.TWEET_TABLE!
    const tweets = [{
        userId: username,
        tweetId
    }]
    const context = given.an_appsync_context({ username }, {}, {}, { tweets })
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual({
        "version" : "2018-05-29",
        "operation" : "BatchGetItem",
        "tables" : {
          [tableName]: {
            "keys": [{
                id: { "S": tweetId },
          }],
            "consistentRead": false
          }
        }
      })
  })
})

export {}