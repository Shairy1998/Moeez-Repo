import 'dotenv/config'
import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

app.listen(config.PORT, () => {
  console.log(`Riverside HMS API running on http://localhost:${config.PORT}`)
})
