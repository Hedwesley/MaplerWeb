import express from "express"
import cors from "cors"
import executarController from "./controllers/executarController.js"

const app = express()
const PORT = process.env.PORT || 3001;

app.use(cors())
app.use(express.json())

app.post("/executar", executarController.executar)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});