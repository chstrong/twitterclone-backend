require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

jest.setTimeout(30000)

describe('Given authenticated users, user A and B', () => {
  let userA: any, userB: any, userAsProfile: any, userBsProfile: any
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
    userBsProfile = await when.a_user_calls_getMyProfile(userB)
  })

  describe("When user A follows user B", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userA, userB.username)
    })

    it("User A should see following as true when viewing user B's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })

    it("User B should see followedBy as true when viewing user A's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })

    describe("User B sends a tweet", () => {
      let tweet: any
      const text = chance.string({ length: 16 })

      beforeAll(async () => {
        tweet = await when.a_user_calls_tweet(userB, text)
        //console.log(`UserB (${userB.username}) sends tweet (${text}), UserA (${userA.username}) should receive it`)
      })

      it("Should appear in user A's timeline", async () => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

          expect(tweets).toHaveLength(1)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000,
        })
      })
    })
  })

  describe("When user B follows user A back", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userB, userA.username)
    })

    it("User A should see both following and followedBy as true when viewing user B's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    it("User B should see both following and followedBy as true when viewing user A's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    describe("User A sends a tweet", () => {
      let tweet: any
      const text = chance.string({ length: 16 })

      beforeAll(async () => {
        tweet = await when.a_user_calls_tweet(userA, text)
        //console.log(`UserA (${userA.username}) sends tweet (${text}), UserB (${userB.username}) should receive it`)
      })

      it("Should appear in user B's timeline", async () => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)

          expect(tweets).toHaveLength(2)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000,
        })
      })
    })    
  })
})

export { }