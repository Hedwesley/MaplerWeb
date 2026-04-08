import express from "express"
import cors from "cors"
import executarController from "./controllers/executarController.js"

const app = express()

app.use(cors())
app.use(express.json())

app.post("/executar", executarController.executar)

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001")
})