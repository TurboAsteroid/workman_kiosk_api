let express = require('express')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let app = express()
let config = require('./config')

const process = require('process')

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  if (config.ips.indexOf(ip) === -1) {
    res.status(403).send('У вас нет доступа')
  }

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

const kioskRouter = require('./routes/kiosk')
app.use('/kiosk', kioskRouter)

module.exports = app
