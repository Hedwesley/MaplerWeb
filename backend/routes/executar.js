import express from "express"
import { executar } from "../controllers/executarController.js"

const router = express.Router()

router.post("/executar", executar)

export default router