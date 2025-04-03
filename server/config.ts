import express from 'express'
import { createServer } from 'node:http'

const app = express()
export const httpServer = createServer(app)
