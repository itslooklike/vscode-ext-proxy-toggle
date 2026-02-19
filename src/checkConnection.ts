import * as https from 'https'

export async function checkConnection(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5_000,
    }

    const req = https.request(options, (res) => {
      resolve(!!(res.statusCode && res.statusCode >= 200 && res.statusCode < 400))
    })

    req.on('error', () => resolve(false))

    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}
