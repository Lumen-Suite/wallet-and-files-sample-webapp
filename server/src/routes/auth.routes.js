import { Router } from 'express'
import { callLumen } from '../lumenClient.js'
import { validateQuery, loginConfigBody, requireUserToken } from '../middleware/validateQuery.js'

const r = Router()

r.post('/auth/login-config', validateQuery(loginConfigBody, 'body'), async (req, res, next) => {
  try {
    const { data } = await callLumen({
      method: 'POST',
      url: '/Custodial/login-config',
      data: req.body,
    })
    res.json(data)
  } catch (e) { next(e) }
})

r.get('/auth/access-token', async (req, res, next) => {
  try {
    const authCode = req.headers['lumen-authentication-code']
    if (!authCode) {
      const err = new Error('Missing lumen-authentication-code header')
      err.status = 400
      throw err
    }
    const { data } = await callLumen({
      method: 'GET',
      url: '/Custodial/access-token',
      _authCode: authCode,
    })
    res.json(data)
  } catch (e) { next(e) }
})

r.get('/auth/authenticate', requireUserToken, async (req, res, next) => {
  try {
    const { data } = await callLumen({
      method: 'GET',
      url: '/Custodial/authenticate',
      _userToken: req.userToken,
    })
    res.json(data)
  } catch (e) { next(e) }
})

r.delete('/auth/logout', requireUserToken, async (req, res, next) => {
  try {
    const { data } = await callLumen({
      method: 'DELETE',
      url: '/Custodial/logout',
      _userToken: req.userToken,
    })
    res.json(data)
  } catch (e) { next(e) }
})

export default r
