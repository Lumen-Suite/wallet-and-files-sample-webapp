import { Router } from 'express'
import { callLumenFiles } from '../lumenClient.js'
import { validateQuery, directoryListQuery } from '../middleware/validateQuery.js'

const r = Router()

r.get('/directoryItems', validateQuery(directoryListQuery), async (req, res, next) => {
  try {
    const { path, ...rest } = req.query
    const { data } = await callLumenFiles({
      method: 'GET',
      url: `/directoryItems/${encodeURIComponent(path)}`,
      params: rest,
    })
    res.json(data)
  } catch (e) {
    next(e)
  }
})

export default r
