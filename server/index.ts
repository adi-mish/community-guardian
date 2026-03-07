import 'dotenv/config'
import { createApp } from './app.ts'

const app = createApp()

const port = Number(process.env.PORT ?? '8787')
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
