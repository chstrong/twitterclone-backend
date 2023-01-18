// https://dev.to/aws-builders/strategies-to-test-aws-appsync-vtl-templates-1ede

const given = require('../../steps/given')
const when = require('../../steps/when')
const path = require('path')
const chance = require('chance').Chance()

describe('Mutation.editMyProfile.request template', () => {
  it("Should use 'newProfile' fields in expression values", () => {

    // Construct the template path
    const templatePath: String = path.resolve(__dirname, '../../../lib/graphql/mapping-templates/Mutation.editMyProfile.request.vtl')

    // Define an email address
    const username: string = chance.guid()

    // Create the identity parameters. In our case want to use the email as the id
    const identityParams = {
      username: username
    }

    // Create the arguments parameters. We don't use any here.
    const args = {
      newProfile: {
        name: 'Yan',
        imageUrl: null,
        backgroundImageUrl: null,
        bio: 'test',
        location: null,
        website: null,
        birthdate: null,
      }
    }

    // Construct the appsync context
    const context = given.an_appsync_context(identityParams, args)

    // Invoke the VTL template and transform it with the context
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    // Check if the result is equal to what we expect
    expect(result).toEqual({
      "version": "2018-05-29",
      "operation": "UpdateItem",
      "key": {
        "id": {
          S: username
        }
      },
      "update": {
        "expression": "set #name = :name, imageUrl = :imageUrl, backgroundImageUrl = :backgroundImageUrl, bio = :bio, #location = :location, website = :website, birthdate = :birthdate",
        "expressionNames": {
          "#name": "name",
          "#location": "location"
        },
        "expressionValues": {
          ":name": {
            S: 'Yan'
          },
          ":imageUrl": {
            NULL: true
          },
          ":backgroundImageUrl": {
            NULL: true
          },
          ":bio": {
            S: 'test'
          },
          ":location": {
            NULL: true
          },
          ":website": {
            NULL: true
          },
          ":birthdate": {
            NULL: true
          },
        }
      },
      "condition": {
        "expression": "attribute_exists(id)"
      }
    })
  })
})

export { }