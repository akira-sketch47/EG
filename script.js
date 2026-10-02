const CHAVE_USUARIOS = "institutoVitalis.usuarios";
const CHAVE_SESSAO = "institutoVitalis.sessao";
const formularioCadastro = document.getElementById("form-cadastro");
const formularioLogin = document.getElementById("form-login");
const feedback = document.getElementById("feedback");
const abas = [
    { botao: document.getElementById("tab-login"), painel: document.getElementById("painel-login") },
    { botao: document.getElementById("tab-cadastro"), painel: document.getElementById("painel-cadastro") }
];

function validarEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email.trim());
}

function validarNome(nome) {
    return nome.trim().length >= 3;
}

function validarSenha(senha) {
    return senha.length >= 6 && /\d/.test(senha);
}

function lerUsuarios(armazenamento) {
    const dados = armazenamento.getItem(CHAVE_USUARIOS);
    if (dados === null) {
        return [];
    }

    const usuarios = JSON.parse(dados);
    if (!Array.isArray(usuarios)) {
        throw new Error("Os dados de cadastro salvos estão em um formato inválido.");
    }
    return usuarios;
}

function registrarUsuario(dados, armazenamento) {
    if (!validarNome(dados.nome)) {
        return { ok: false, campo: "nome", mensagem: "Informe seu nome completo (mínimo 3 caracteres)." };
    }
    if (!validarEmail(dados.email)) {
        return { ok: false, campo: "email", mensagem: "Informe um e-mail válido, como voce@exemplo.com." };
    }
    if (!validarSenha(dados.senha)) {
        return { ok: false, campo: "senha", mensagem: "A senha precisa ter pelo menos 6 caracteres e 1 número." };
    }
    if (dados.senha !== dados.confirmar) {
        return { ok: false, campo: "confirmar", mensagem: "As senhas não são iguais. Confira e tente novamente." };
    }

    const emailNormalizado = dados.email.trim().toLowerCase();
    const usuarios = lerUsuarios(armazenamento);
    if (usuarios.some(function(usuario) {
        return usuario.email.toLowerCase() === emailNormalizado;
    })) {
        return { ok: false, campo: "email", mensagem: "Este e-mail já possui uma conta. Faça login." };
    }

    usuarios.push({
        nome: dados.nome.trim(),
        email: emailNormalizado,
        senha: dados.senha
    });
    armazenamento.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
    return { ok: true, usuario: usuarios[usuarios.length - 1] };
}

function autenticarUsuario(email, senha, armazenamento) {
    if (!validarEmail(email)) {
        return { ok: false, campo: "email", mensagem: "Informe um e-mail válido." };
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = lerUsuarios(armazenamento).find(function(item) {
        return item.email.toLowerCase() === emailNormalizado && item.senha === senha;
    });
    if (!usuario) {
        return { ok: false, campo: "senha", mensagem: "E-mail ou senha incorretos." };
    }

    armazenamento.setItem(CHAVE_SESSAO, JSON.stringify({
        nome: usuario.nome,
        email: usuario.email
    }));
    return { ok: true, usuario: usuario };
}

function mostrarFeedback(tipo, texto) {
    feedback.textContent = texto;
    feedback.className = "feedback visible " + tipo;
}

function limparFeedback() {
    feedback.textContent = "";
    feedback.className = "feedback";
}

function limparErros(formulario) {
    formulario.querySelectorAll("input").forEach(function(campo) {
        campo.classList.remove("erro", "sucesso");
        campo.removeAttribute("aria-invalid");
        const erro = document.getElementById(campo.id + "-erro");
        if (erro) {
            erro.textContent = "";
        }
    });
}

function marcarCampo(campo, mensagem) {
    campo.classList.add("erro");
    campo.setAttribute("aria-invalid", "true");
    const mensagemCampo = document.getElementById(campo.id + "-erro");
    if (mensagemCampo) {
        mensagemCampo.textContent = mensagem;
    }
    campo.focus();
}

function selecionarAba(abaSelecionada) {
    abas.forEach(function(aba) {
        const selecionada = aba === abaSelecionada;
        aba.botao.classList.toggle("active", selecionada);
        aba.botao.setAttribute("aria-selected", String(selecionada));
        aba.painel.hidden = !selecionada;
    });
    limparFeedback();
}

abas.forEach(function(aba) {
    aba.botao.addEventListener("click", function() {
        selecionarAba(aba);
    });
});

document.querySelectorAll("input").forEach(function(campo) {
    campo.addEventListener("input", function() {
        campo.classList.remove("erro", "sucesso");
        campo.removeAttribute("aria-invalid");
        const mensagemCampo = document.getElementById(campo.id + "-erro");
        if (mensagemCampo) {
            mensagemCampo.textContent = "";
        }
        limparFeedback();
    });
});

formularioCadastro.addEventListener("submit", function(event) {
    event.preventDefault();
    limparErros(formularioCadastro);
    limparFeedback();

    const dados = {
        nome: document.getElementById("cadastro-nome").value,
        email: document.getElementById("cadastro-email").value,
        senha: document.getElementById("cadastro-senha").value,
        confirmar: document.getElementById("cadastro-confirmar").value
    };
    const resultado = registrarUsuario(dados, window.localStorage);

    if (!resultado.ok) {
        const campo = document.getElementById("cadastro-" + resultado.campo);
        marcarCampo(campo, resultado.mensagem);
        mostrarFeedback("error", resultado.mensagem);
        return;
    }

    formularioCadastro.reset();
    mostrarFeedback("success", "Conta criada com sucesso! Agora entre com seu e-mail e senha.");
    selecionarAba(abas[0]);
    mostrarFeedback("success", "Conta criada com sucesso! Entre com seu e-mail e senha.");
});

formularioLogin.addEventListener("submit", function(event) {
    event.preventDefault();
    limparErros(formularioLogin);
    limparFeedback();

    const campoEmail = document.getElementById("login-email");
    const campoSenha = document.getElementById("login-senha");
    const resultado = autenticarUsuario(campoEmail.value, campoSenha.value, window.localStorage);

    if (!resultado.ok) {
        const campo = resultado.campo === "email" ? campoEmail : campoSenha;
        marcarCampo(campo, resultado.mensagem);
        mostrarFeedback("error", resultado.mensagem);
        return;
    }

    campoSenha.value = "";
    campoEmail.classList.add("sucesso");
    mostrarFeedback("success", "Login realizado! Olá, " + resultado.usuario.nome + ". Seja bem-vindo(a) ao portal.");
});

function executarTestes() {
    const relatorio = [];
    function verificar(nome, condicao) {
        console.assert(condicao, nome);
        relatorio.push({ teste: nome, resultado: condicao ? "PASSOU" : "FALHOU" });
    }

    verificar("TU01 - e-mail válido", validarEmail("teste@gmail.com") === true);
    verificar("TU02 - e-mail inválido", validarEmail("teste@") === false);
    verificar("TU03 - senha válida", validarSenha("123456") === true);
    verificar("TU04 - senha sem número", validarSenha("abcdef") === false);
    verificar("TU05 - nome com 3 caracteres", validarNome("Ana") === true);
    verificar("TU06 - nome curto", validarNome("Jo") === false);

    const dadosValidos = {
        nome: "Maria Silva",
        email: "maria@exemplo.com",
        senha: "abc123",
        confirmar: "abc123"
    };
    const armazenamentoTeste = {
        dados: {},
        getItem: function(chave) {
            return Object.prototype.hasOwnProperty.call(this.dados, chave) ? this.dados[chave] : null;
        },
        setItem: function(chave, valor) {
            this.dados[chave] = String(valor);
        }
    };

    verificar("CT01 - nome obrigatório", registrarUsuario({ ...dadosValidos, nome: " " }, armazenamentoTeste).campo === "nome");
    verificar("CT02 - formato de e-mail", registrarUsuario({ ...dadosValidos, email: "teste@" }, armazenamentoTeste).campo === "email");
    verificar("CT03 - senha segura", registrarUsuario({ ...dadosValidos, senha: "123", confirmar: "123" }, armazenamentoTeste).campo === "senha");
    verificar("CT04 - confirmação de senha", registrarUsuario({ ...dadosValidos, confirmar: "abc12" }, armazenamentoTeste).campo === "confirmar");

    const cadastro = registrarUsuario(dadosValidos, armazenamentoTeste);
    const usuariosSalvos = lerUsuarios(armazenamentoTeste);
    verificar("CT05 - cadastro válido salvo no armazenamento", cadastro.ok && usuariosSalvos.length === 1);
    verificar("TI01 - login com cadastro realizado", autenticarUsuario("maria@exemplo.com", "abc123", armazenamentoTeste).ok);
    verificar("TI02 - login com senha incorreta", !autenticarUsuario("maria@exemplo.com", "errada1", armazenamentoTeste).ok);
    verificar("TI03 - login com usuário inexistente", !autenticarUsuario("naoexiste@exemplo.com", "abc123", armazenamentoTeste).ok);
    verificar("TI04 - sessão salva sem senha", JSON.parse(armazenamentoTeste.getItem(CHAVE_SESSAO)).senha === undefined);
    verificar("CT06 - e-mail duplicado", registrarUsuario(dadosValidos, armazenamentoTeste).campo === "email");

    console.info("Testes automatizados do cadastro e login:");
    console.table(relatorio);
    console.info(relatorio.every(function(item) {
        return item.resultado === "PASSOU";
    }) ? "✅ Todos os testes passaram." : "❌ Há testes com falha.");
}

executarTestes();
