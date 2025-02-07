// Backend: Servidor Node.js com fila de prioridade para banco
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

class Cliente {
    constructor(nome, telefone, prioridade) {
        this.nome = nome;
        this.telefone = telefone;
        this.prioridade = prioridade;
    }
}

class FilaBanco {
    constructor() {
        this.fila = [];
        this.historico = [];
    }

    adicionarCliente(cliente) {
        this.fila.push(cliente);
        this.fila.sort((a, b) => a.prioridade - b.prioridade);
    }

    chamarCliente() {
        if (this.fila.length > 0) {
            const clienteAtendido = this.fila.shift();
            this.historico.push(clienteAtendido);
            return clienteAtendido;
        }
        return null;
    }

    listarFila() {
        return this.fila;
    }

    listarHistorico() {
        return this.historico;
    }

    verificarNotificacao(telefone) {
        for (let i = 0; i < this.fila.length; i++) {
            if (this.fila[i].telefone === telefone && i === 1) {
                return `Olá ${this.fila[i].nome}, sua vez está chegando! Faltam 2 pessoas para seu atendimento.`;
            }
        }
        return null;
    }
}

const filaBanco = new FilaBanco();

// Adicionar cliente
app.post("/adicionar", (req, res) => {
    const { nome, telefone, prioridade } = req.body;
    const cliente = new Cliente(nome, telefone, prioridade);
    filaBanco.adicionarCliente(cliente);
    res.json({ mensagem: "Cliente adicionado com sucesso!", fila: filaBanco.listarFila() });
});

// Chamar cliente
app.get("/chamar", (req, res) => {
    const clienteAtendido = filaBanco.chamarCliente();
    res.json({ clienteAtendido, fila: filaBanco.listarFila(), historico: filaBanco.listarHistorico() });
});

// Listar fila
app.get("/fila", (req, res) => {
    res.json({ fila: filaBanco.listarFila() });
});

// Listar clientes atendidos
app.get("/historico", (req, res) => {
    res.json({ historico: filaBanco.listarHistorico() });
});

// Notificação quando faltar 2 pessoas
app.get("/notificar/:telefone", (req, res) => {
    const telefone = req.params.telefone;
    const mensagem = filaBanco.verificarNotificacao(telefone);
    res.json({ notificacao: mensagem || "Ainda há pessoas na sua frente." });
});

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

// Rota inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Frontend: Arquivo index.html (salve este código em /public/index.html)
const frontendHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fila do Banco</title>
    <script>
        async function atualizarFila() {
            const resposta = await fetch('/fila');
            const dados = await resposta.json();
            document.getElementById("fila").innerText = JSON.stringify(dados.fila, null, 2);
        }

        async function atualizarHistorico() {
            const resposta = await fetch('/historico');
            const dados = await resposta.json();
            document.getElementById("historico").innerText = JSON.stringify(dados.historico, null, 2);
        }

        async function adicionarCliente() {
            const nome = prompt("Nome do cliente:");
            const telefone = prompt("Telefone:");
            const prioridade = parseInt(prompt("Prioridade (número menor = mais prioridade):"));

            await fetch('/adicionar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, telefone, prioridade })
            });

            atualizarFila();
        }

        async function chamarCliente() {
            await fetch('/chamar');
            atualizarFila();
            atualizarHistorico();
        }

        window.onload = function() {
            atualizarFila();
            atualizarHistorico();
        };
    </script>
</head>
<body>
    <h1>Fila do Banco</h1>
    <button onclick="adicionarCliente()">Adicionar Cliente</button>
    <button onclick="chamarCliente()">Chamar Cliente</button>
    <h2>Fila Atual</h2>
    <pre id="fila"></pre>
    <h2>Histórico de Atendidos</h2>
    <pre id="historico"></pre>
</body>
</html>
`;

const fs = require("fs");
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/index.html", frontendHTML);
