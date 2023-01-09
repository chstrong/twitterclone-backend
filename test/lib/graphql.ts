const http = require('axios')
const _ = require('lodash')

interface ErrorParameters {
    query:any,
    variables:any,
    errors:any
}

type AuthHeaders = {
    Authorization?:any
}

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

const GraphQL = async (url: any, query: any, variables = {}, auth: any) => {
    const headers: AuthHeaders = {}
    if (auth) {
        headers.Authorization = auth
    }

    try {
        const resp = await http({
            method: 'post',
            url,
            headers,
            data: {
                query,
                variables: JSON.stringify(variables)
            }
        })

        const { data, errors } = resp.data
        throwOnErrors({ query, variables, errors })
        return data
    } catch(error) {
        const errors = _.get(error, 'response.data.errors')
        throwOnErrors({query, variables, errors})
        throw error
    }
}

export { GraphQL }