const chance = require('chance').Chance()

const a_random_user = () => {
    const firstName = chance.first({nationality: 'en'})
    const lastName = chance.last({nationality: 'en'})
    const suffix = chance.string({length: 4, pool: 'abcdefghijklmnopqrstuvwxyz'})
    const name = `${firstName} ${lastName} ${suffix}`
    const password = chance.string({length: 6})
    const email = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${suffix}@test.com`

    return { name, password, email }
}

module.exports = {
    a_random_user
}