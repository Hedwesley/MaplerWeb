import { useEffect, useRef, useState } from "react"

import { EditorView } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

function App() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)

  const [output, setOutput] = useState("")

  useEffect(() => {
    if (!editorRef.current) return

    const startState = EditorState.create({
      doc: `variaveis
x: inteiro;

inicio
x <- 10;
escrever(x);
fim`,
      extensions: [basicSetup, javascript()]
    })

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current
    })
  }, [])

  const executarCodigo = async () => {
    const codigo = viewRef.current.state.doc.toString()

    try {
      const resposta = await fetch("http://localhost:3001/executar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ codigo })
      })

      const data = await resposta.json()

      setOutput(JSON.stringify(data, null, 2))

    } catch (erro) {
      setOutput("Erro ao conectar com o backend")
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mapler Web</h1>

      <div
        ref={editorRef}
        style={{
          border: "1px solid #ccc",
          height: "300px",
          marginBottom: "10px"
        }}
      />

      <button onClick={executarCodigo}>
        ▶ Executar
      </button>

      <pre style={{ marginTop: "20px", background: "#eee", padding: "10px" }}>
        {output}
      </pre>
    </div>
  )
}

export default App