require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

//jest.setTimeout(100000)
jest.useFakeTimers()
//jest.retryTimes(3)

describe('Given authenticated users, user A and B', () => {
  let userA: any, userB: any, userAsProfile: any, userBsProfile: any
  let userBsTweet1: any, userBsTweet2: any
  beforeAll(async () => {
    setTimeout(async () => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userAsProfile = await when.a_user_calls_getMyProfile(userA)
      userBsProfile = await when.a_user_calls_getMyProfile(userB)
      userBsTweet1 = await when.a_user_calls_tweet(userB, chance.paragraph())
      userBsTweet2 = await when.a_user_calls_tweet(userB, chance.paragraph())
    }, 3000)
  })

  describe("When user A follows user B", () => {
    beforeAll(async () => {
      setTimeout(async () => {
        await when.a_user_calls_follow(userA, userB.username)
      }, 3000)
    })

    it("User A should see following as true when viewing user B's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

        expect(following).toBe(true)
        expect(followedBy).toBe(false)
      }, 3000)
    })

    it("User B should see followedBy as true when viewing user A's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

        expect(following).toBe(false)
        expect(followedBy).toBe(true)
      }, 3000)
    })

    it("Adds user B's tweets to user A's timeline", async () => {
      setTimeout(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
        expect(tweets).toHaveLength(2)
        expect(tweets).toEqual([
          expect.objectContaining({
            id: userBsTweet2.id
          }),
          expect.objectContaining({
            id: userBsTweet1.id
          })
        ])
      }, 3000)
    })

    describe("User B sends a tweet", () => {
      let tweet: any
      const text = chance.string({ length: 16 })

      beforeAll(async () => {
        setTimeout(async () => {
          tweet = await when.a_user_calls_tweet(userB, text)
          //console.log(`UserB (${userB.username}) sends tweet (${text}), UserA (${userA.username}) should receive it`)
        }, 3000)
      })

      it("Should appear in user A's timeline", async () => {
        setTimeout(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

          expect(tweets).toHaveLength(3)
          expect(tweets[0].id).toEqual(tweet.id)
        }, 3000)
      })
    })
  })

  describe("When user B follows user A back", () => {
    beforeAll(async () => {
      setTimeout(async () => {
        await when.a_user_calls_follow(userB, userA.username)
      }, 3000)
    })

    it("User A should see both following and followedBy as true when viewing user B's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

        expect(following).toBe(true)
        expect(followedBy).toBe(true)
      }, 3000)
    })

    it("User B should see both following and followedBy as true when viewing user A's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

        expect(following).toBe(true)
        expect(followedBy).toBe(true)
      }, 3000)
    })

    describe("User A sends a tweet", () => {
      let tweet: any
      const text = chance.string({ length: 16 })

      beforeAll(async () => {
        setTimeout(async () => {
          tweet = await when.a_user_calls_tweet(userA, text)
          //console.log(`UserA (${userA.username}) sends tweet (${text}), UserB (${userB.username}) should receive it`)
        }, 3000)
      })

      it("Should appear in user B's timeline", async () => {
        setTimeout(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)

          expect(tweets).toHaveLength(4)
          expect(tweets[0].id).toEqual(tweet.id)
        }, 3000)
      })
    })
  })

  describe("When user A unfollows user B", () => {
    beforeAll(async () => {
      setTimeout(async () => {
        await when.a_user_calls_unfollow(userA, userB.username)
      }, 3000)
    })

    it("User A should see following as false when viewing user B's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

        expect(following).toBe(false)
        expect(followedBy).toBe(true)
      }, 3000)
    })

    it("User B should see followedBy as false when viewing user A's profile", async () => {
      setTimeout(async () => {
        const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

        expect(following).toBe(true)
        expect(followedBy).toBe(false)
      }, 3000)
    })

    it("Remove user B's tweets from user A's timeline", async () => {
      setTimeout(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets).toEqual([
          expect.objectContaining({
            profile: {
              id: userA.username
            }
          }),
        ])
      }, 3000)
    })
  })
})

export { }