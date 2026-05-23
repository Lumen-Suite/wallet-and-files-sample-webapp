import { Router } from 'express'
import { callLumen, encodePath } from '../lumenClient.js'
import {
  validateQuery,
  listQuery,
  pathOnlyQuery,
  uploadBody,
  requireUserToken,
} from '../middleware/validateQuery.js'

const r = Router()

r.get('/user/files', requireUserToken, validateQuery(listQuery), async (req, res, next) => {
  try {
    const { data } = await callLumen({
      method: 'GET',
      url: '/user/files',
      params: req.query,
      _userToken: req.userToken,
    })
    res.json(data)
  } catch (e) { next(e) }
})

r.post('/user/files',
  requireUserToken,
  validateQuery(pathOnlyQuery),
  validateQuery(uploadBody, 'body'),
  async (req, res, next) => {
    try {
      const { path } = req.query
      const { data } = await callLumen({
        method: 'POST',
        url: `/user/files/${encodePath(path)}`,
        data: { ...req.body, Path: path },
        _userToken: req.userToken,
      })
      res.json(data)
    } catch (e) { next(e) }
  },
)

export default r
