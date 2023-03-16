const http = require('axios')
const _ = require('lodash')

interface ErrorParameters {
    query: any,
    variables: any,
    errors: any
}

type AuthHeaders = {
    Authorization?: any
}

const fragments: any = {}
const registerFragment = (name: any, fragment: any) => fragments[name] = fragment

const throwOnErrors = ({ query, variables, errors }: ErrorParameters) => {
    if (errors) {
        const errorMessage = `
  query: ${query.substr(0, 100)}
    
  variales: ${JSON.stringify(variables, null, 2)}
    
  error: ${JSON.stringify(errors, null, 2)}
  `
        throw new Error(errorMessage)
    }
}

function* findUsedFragments(query:any, usedFragments = new Set()) {
    for (const name of Object.keys(fragments)) {
        if (query.includes(name) && !usedFragments.has(name)) {
            usedFragments.add(name)
            yield name

            const fragment = fragments[name]
            const nestedFragments:any = findUsedFragments(fragment, usedFragments)

            for (const nestedName of Array.from(nestedFragments)) {
                yield nestedName
            }
        }
    }
}

module.exports.registerFragment = registerFragment
const GraphQL = async (url: any, query: any, variables = {}, auth: any) => {
    const headers: AuthHeaders = {}
    if (auth) {
        headers.Authorization = auth
    }

    const usedFragments = Array
        .from(findUsedFragments(query))
        .map(name => fragments[name as any])

    try {
        const resp = await http({
            method: 'post',
            url,
            headers,
            data: {
                query: [query, ...usedFragments].join('\n'),
                variables: JSON.stringify(variables)
            }
        })

        const { data, errors } = resp.data
        throwOnErrors({ query, variables, errors })
        return data
    } catch (error) {
        const errors = _.get(error, 'response.data.errors')
        throwOnErrors({ query, variables, errors })
        throw error
    }
}

export { GraphQL }