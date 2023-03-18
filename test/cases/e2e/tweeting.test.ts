require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

jest.setTimeout(8000)

describe('Given an authenticated user', () => {
    let user: any
    beforeAll(async () => {
        user = await given.an_authenticated_user()
        console.log(user)
    })

    describe('When he sends a tweet', () => {
        let tweet: any
        const text = chance.string({ length: 16 })

        beforeAll(async () => {
            tweet = await when.a_user_calls_tweet(user, text)
        })

        it('Should return the new tweet', () => {
            expect(tweet).toMatchObject({
                text,
                replies: 0,
                likes: 0,
                retweets: 0,
                liked: false
            })
        })

        describe('When he calls getTweets', () => {
            let tweets: any, nextToken: string
            beforeAll(async () => {
                const result = await when.a_user_calls_getTweets(user, user.username, 25)
                tweets = result.tweets
                nextToken = result.nextToken
            })

            it('He will see the new tweet in the tweets array', () => {
                expect(nextToken).toBeNull()
                expect(tweets.length).toEqual(1)
                expect(tweets[0]).toEqual(tweet)
            })

            it('He cannot ask for more than 25 tweets in a page', async () => {
                await expect(when.a_user_calls_getTweets(user, user.username, 26))
                    .rejects
                    .toMatchObject({
                        message: expect.stringContaining('max limit is 25')
                    })
            })
        })

        describe('When he calls getMyTimeline', () => {
            let tweets: any, nextToken: string
            beforeAll(async () => {
                const result = await when.a_user_calls_getMyTimeline(user, 25)
                tweets = result.tweets
                nextToken = result.nextToken
            })

            it('He will see the new tweet in the tweets array', () => {
                expect(nextToken).toBeNull()
                expect(tweets.length).toEqual(1)
                expect(tweets[0]).toEqual(tweet)
            })

            it('He cannot ask for more than 25 tweets in a page', async () => {
                await expect(when.a_user_calls_getMyTimeline(user, 26))
                    .rejects
                    .toMatchObject({
                        message: expect.stringContaining('max limit is 25')
                    })
            })

            describe('When he likes the tweet', () => {
                beforeAll(async () => {
                    await when.a_user_calls_like(user, tweet.id)
                })

                it('Should see Tweet.liked as true', async () => {
                    const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)

                    expect(tweets).toHaveLength(1)
                    expect(tweets[0].id).toEqual(tweet.id)
                    expect(tweets[0].liked).toEqual(true)
                })

                it('Should not be able to like the same tweet a second time', async () => {
                    await expect(() => when.a_user_calls_like(user, tweet.id))
                        .rejects
                        .toMatchObject({
                            message: expect.stringContaining('DynamoDB transaction error')
                        })
                })

                describe('When he unlikes the tweet', () => {
                    beforeAll(async () => {
                        await when.a_user_calls_unlike(user, tweet.id)
                    })

                    it('Should see Tweet.liked as false', async () => {
                        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25)

                        expect(tweets).toHaveLength(1)
                        expect(tweets[0].id).toEqual(tweet.id)
                        expect(tweets[0].liked).toEqual(false)
                    })

                    it('Should not be able to unlike the same tweet a second time', async () => {
                        await expect(() => when.a_user_calls_unlike(user, tweet.id))
                            .rejects
                            .toMatchObject({
                                message: expect.stringContaining('DynamoDB transaction error')
                            })
                    })
                })
            })
        })
    })
})

export { }