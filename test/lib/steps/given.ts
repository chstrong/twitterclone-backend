const chance = require('chance').Chance()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const a_random_user = () => {
    const firstName = chance.first({ nationality: 'en' })
    const lastName = chance.last({ nationality: 'en' })
    const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' })
    const name = `${firstName} ${lastName} ${suffix}`
    const password = chance.string({ length: 6 })
    const email = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${suffix}@test.com`

    return { name, password, email }
}

const an_appsync_context = (identity: any, args: any) => {
    const util = velocityUtil.create([], new Date(), Object())
    const context = {
        identity: identity,
        args,
        arguments: args,
    }
    return {
        context: context,
        ctx: context,
        util: util,
        utils: util
    }
}

module.exports = {
    a_random_user,
    an_appsync_context
}