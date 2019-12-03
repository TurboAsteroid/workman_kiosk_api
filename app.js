let express = require('express')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let app = express()
require('./helpers/passport')

const process = require('process')

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By') // чтобы не палить кто сервер
  next()
})
app.use(logger('dev'))
app.use(express.json()) // it is body-parser
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

process.on('uncaughtException', (err, origin) => {
  console.log(`Caught exception: ${err} Exception origin: ${origin}`)
})

const kioskRouter = require('./node_modules/kiosk')
app.use('/kiosk', kioskRouter)

module.exports = app
