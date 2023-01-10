// https://dev.to/aws-builders/strategies-to-test-aws-appsync-vtl-templates-1ede

const given = require('../steps/given')
const when = require('../steps/when')
const path = require('path')
const chance = require('chance').Chance()

describe('Query.getMyProfile.request template', () => {
  it("Should use username as 'id'", () => {

    // Construct the template path
    const templatePath: String = path.resolve(__dirname, '../../lib/graphql/mapping-templates/Query.getMyProfile.request.vtl')

    // Define an email address
    const username: string = chance.guid()

    // Create the identity parameters. In our case want to use the email as the id
    const identityParams = {
      username: username
    }

    // Create the arguments parameters. We don't use any here.
    const argsParams = {}

    // Construct the appsync context
    const context = given.an_appsync_context(identityParams, argsParams)
    
    // Invoke the VTL template and transform it with the context
    const result = when.we_invoke_an_appsync_template(templatePath, context)
    
    // Check if the result is equal to what we expect
    expect(result).toEqual({
      "version": "2018-05-29",
      "operation": "GetItem",
      "key": {
        "id": {
          "S": username
        }
      }
    })
  })
})

export { }