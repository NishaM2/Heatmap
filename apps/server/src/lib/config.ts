const required = (name: string) => {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required env var: ${name}`)
    return value.replace(/\/$/, '')
}

export const CLIENT_URL = required('CLIENT_URL')
export const SERVER_URL = required('BETTER_AUTH_URL')