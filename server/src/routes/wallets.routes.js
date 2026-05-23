import { Router } from 'express'
import { callLumen } from '../lumenClient.js'
import { validateQuery, listQuery } from '../middleware/validateQuery.js'

const r = Router()

r.get('/wallets/Custodial/:addr/transactions', validateQuery(listQuery), async (req, res, next) => {
  try {
    const { data } = await callLumen({
      method: 'GET',
      url: `/wallets/Custodial/${encodeURIComponent(req.params.addr)}/transactions`,
      params: req.query,
    })
    res.json(data)
  } catch (e) {
    next(e)
  }
})

export default r
