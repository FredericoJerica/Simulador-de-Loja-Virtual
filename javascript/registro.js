document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const formRegistro = document.getElementById('formulario-registro');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const btnRegistro = document.getElementById('btn-registro');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');
    const mensagemErro = document.getElementById('mensagem-erro');
    
    // URL do JSON Server (ou localStorage para exemplo)
    const API_URL = 'http://localhost:3000';
    
    // ==================== FUNÇÕES DE VALIDAÇÃO ====================
    
    function validarNome(nome) {
        const erroNome = document.getElementById('erro-nome');
        
        if (!nome.trim()) {
            mostrarErro(erroNome, 'Nome é obrigatório');
            nomeInput.classList.add('error');
            nomeInput.classList.remove('success');
            return false;
        }
        
        if (nome.length < 3) {
            mostrarErro(erroNome, 'Nome muito curto (mínimo 3 caracteres)');
            nomeInput.classList.add('error');
            nomeInput.classList.remove('success');
            return false;
        }
        
        if (nome.length > 100) {
            mostrarErro(erroNome, 'Nome muito longo (máximo 100 caracteres)');
            nomeInput.classList.add('error');
            nomeInput.classList.remove('success');
            return false;
        }
        
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) {
            mostrarErro(erroNome, 'Nome deve conter apenas letras');
            nomeInput.classList.add('error');
            nomeInput.classList.remove('success');
            return false;
        }
        
        limparErro(erroNome);
        nomeInput.classList.remove('error');
        nomeInput.classList.add('success');
        return true;
    }
    
    function validarEmail(email) {
        const erroEmail = document.getElementById('erro-email');
        
        if (!email.trim()) {
            mostrarErro(erroEmail, 'E-mail é obrigatório');
            emailInput.classList.add('error');
            emailInput.classList.remove('success');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarErro(erroEmail, 'Digite um e-mail válido');
            emailInput.classList.add('error');
            emailInput.classList.remove('success');
            return false;
        }
        
        limparErro(erroEmail);
        emailInput.classList.remove('error');
        emailInput.classList.add('success');
        return true;
    }
    
    function validarSenha(senha) {
        const erroSenha = document.getElementById('erro-senha');
        
        if (!senha) {
            mostrarErro(erroSenha, 'Senha é obrigatória');
            senhaInput.classList.add('error');
            senhaInput.classList.remove('success');
            atualizarForcaSenha('');
            return false;
        }
        
        if (senha.length < 8) {
            mostrarErro(erroSenha, 'Senha muito curta (mínimo 8 caracteres)');
            senhaInput.classList.add('error');
            senhaInput.classList.remove('success');
            atualizarForcaSenha(senha);
            return false;
        }
        
        // Verificar força da senha
        const forca = calcularForcaSenha(senha);
        if (forca < 2) {
            mostrarErro(erroSenha, 'Senha muito fraca. Use letras maiúsculas, minúsculas, números e símbolos');
            senhaInput.classList.add('error');
            senhaInput.classList.remove('success');
            atualizarForcaSenha(senha);
            return false;
        }
        
        limparErro(erroSenha);
        senhaInput.classList.remove('error');
        senhaInput.classList.add('success');
        atualizarForcaSenha(senha);
        return true;
    }
    
    function validarConfirmacaoSenha(senha, confirmacao) {
        const erroConfirmar = document.getElementById('erro-confirmar');
        
        if (!confirmacao) {
            mostrarErro(erroConfirmar, 'Confirme sua senha');
            confirmarSenhaInput.classList.add('error');
            confirmarSenhaInput.classList.remove('success');
            return false;
        }
        
        if (senha !== confirmacao) {
            mostrarErro(erroConfirmar, 'As senhas não coincidem');
            confirmarSenhaInput.classList.add('error');
            confirmarSenhaInput.classList.remove('success');
            return false;
        }
        
        limparErro(erroConfirmar);
        confirmarSenhaInput.classList.remove('error');
        confirmarSenhaInput.classList.add('success');
        return true;
    }
    
    function calcularForcaSenha(senha) {
        let forca = 0;
        
        // Comprimento
        if (senha.length >= 8) forca++;
        if (senha.length >= 12) forca++;
        
        // Complexidade
        if (/[a-z]/.test(senha)) forca++;
        if (/[A-Z]/.test(senha)) forca++;
        if (/[0-9]/.test(senha)) forca++;
        if (/[^a-zA-Z0-9]/.test(senha)) forca++;
        
        return forca;
    }
    
    function atualizarForcaSenha(senha) {
        const meter = document.getElementById('strength-meter');
        const text = document.getElementById('strength-text');
        
        if (!senha) {
            meter.style.width = '0%';
            meter.className = 'strength-meter';
            text.textContent = '';
            return;
        }
        
        const forca = calcularForcaSenha(senha);
        let percent = 0;
        let classe = '';
        let texto = '';
        
        if (forca <= 2) {
            percent = 33;
            classe = 'strength-weak';
            texto = 'Fraca';
        } else if (forca <= 4) {
            percent = 66;
            classe = 'strength-medium';
            texto = 'Média';
        } else {
            percent = 100;
            classe = 'strength-strong';
            texto = 'Forte';
        }
        
        meter.style.width = percent + '%';
        meter.className = 'strength-meter ' + classe;
        text.textContent = texto;
    }
    
    function mostrarErro(elemento, mensagem) {
        elemento.textContent = mensagem;
        elemento.style.display = 'block';
    }
    
    function limparErro(elemento) {
        elemento.textContent = '';
        elemento.style.display = 'none';
    }
    
    function mostrarMensagemSucesso(mensagem) {
        mensagemSucesso.textContent = mensagem;
        mensagemSucesso.style.display = 'block';
        mensagemErro.style.display = 'none';
        
        setTimeout(() => {
            mensagemSucesso.style.display = 'none';
        }, 5000);
    }
    
    function mostrarMensagemErro(mensagem) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = 'block';
        mensagemSucesso.style.display = 'none';
        
        setTimeout(() => {
            mensagemErro.style.display = 'none';
        }, 5000);
    }
    
    function mostrarLoading() {
        btnRegistro.innerHTML = '<span class="loader"></span> Criando conta...';
        btnRegistro.disabled = true;
    }
    
    function esconderLoading() {
        btnRegistro.innerHTML = 'Criar Conta';
        btnRegistro.disabled = false;
    }
    
    // ==================== FUNÇÃO DE REGISTRO ====================
    
    // ==================== FUNÇÃO DE REGISTRO ====================

    async function registrarUsuario(usuario) {
        try {
            // Verificar se email já existe no JSON Server
            const checkResponse = await fetch(`${API_URL}/usuarios?email=${encodeURIComponent(usuario.email)}`);
            
            if (!checkResponse.ok) {
                throw new Error('Erro ao verificar email');
            }
            
            const usuariosExistentes = await checkResponse.json();
            
            if (usuariosExistentes.length > 0) {
                throw new Error('Este e-mail já está cadastrado');
            }
            
            // Adicionar data de criação e ID
            usuario.id = Date.now().toString(); // ID único como string
            usuario.dataCadastro = new Date().toISOString();
            usuario.ativo = true;
            usuario.tipo = 'cliente'; // Padrão para usuários normais
            
            // Salvar no JSON Server
            const saveResponse = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuario)
            });
            
            if (!saveResponse.ok) {
                throw new Error('Erro ao criar conta no servidor');
            }
            
            return await saveResponse.json();
            
        } catch (error) {
            throw error;
        }
    }


    
    // ==================== EVENT LISTENERS ====================
    
    // Validação em tempo real
    nomeInput.addEventListener('input', function() {
        validarNome(this.value);
    });
    
    emailInput.addEventListener('input', function() {
        validarEmail(this.value);
    });
    
    senhaInput.addEventListener('input', function() {
        validarSenha(this.value);
        // Atualizar validação da confirmação
        if (confirmarSenhaInput.value) {
            validarConfirmacaoSenha(this.value, confirmarSenhaInput.value);
        }
    });
    
    confirmarSenhaInput.addEventListener('input', function() {
        validarConfirmacaoSenha(senhaInput.value, this.value);
    });
    
    // Mostrar/esconder senha
    document.getElementById('toggle-senha').addEventListener('click', function() {
        const type = senhaInput.type === 'password' ? 'text' : 'password';
        senhaInput.type = type;
        this.textContent = type === 'password' ? '👁️ Mostrar' : '👁️ Ocultar';
    });
    
    document.getElementById('toggle-confirmar').addEventListener('click', function() {
        const type = confirmarSenhaInput.type === 'password' ? 'text' : 'password';
        confirmarSenhaInput.type = type;
        this.textContent = type === 'password' ? '👁️ Mostrar' : '👁️ Ocultar';
    });
    
    // Submit do formulário
    // ==================== SUBMIT DO FORMULÁRIO ====================

    formRegistro.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Coletar dados
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const senha = senhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;
        
        // Validar todos os campos
        const isNomeValido = validarNome(nome);
        const isEmailValido = validarEmail(email);
        const isSenhaValida = validarSenha(senha);
        const isConfirmacaoValida = validarConfirmacaoSenha(senha, confirmarSenha);
        
        if (!isNomeValido || !isEmailValido || !isSenhaValida || !isConfirmacaoValida) {
            mostrarMensagemErro('Por favor, corrija os erros no formulário');
            return;
        }
        
        // ⚠️ ATENÇÃO: Em produção, a senha DEVE ser hasheada no backend!
        // Isso é apenas para demonstração com JSON Server
        const usuario = {
            nome: nome,
            email: email,
            senha: senha, // ⚠️ EM PRODUÇÃO: NUNCA armazene senhas em texto claro!
            dataCadastro: new Date().toISOString().split('T')[0]
        };
        
        mostrarLoading();
        
        try {
            // Registrar no JSON Server
            const usuarioCriado = await registrarUsuario(usuario);
            console.log('Usuário criado:', usuarioCriado);
            
            // Limpar formulário
            formRegistro.reset();
            document.querySelectorAll('input').forEach(input => {
                input.classList.remove('success', 'error');
            });
            atualizarForcaSenha('');
            
            // Mostrar mensagem de sucesso
            mostrarMensagemSucesso('✅ Conta criada com sucesso! Redirecionando para login...');
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Erro no registro:', error);
            mostrarMensagemErro(error.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            esconderLoading();
        }
    });
    
    // Foco no primeiro campo
    nomeInput.focus();
});



        const formLogin = document.getElementById('formulario-login');
        const mensagemErro = document.getElementById('mensagem-erro');
        const API_URL = 'http://localhost:3000'; // URL do JSON Server

        // Evento de login
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const email = document.getElementById('email').value.trim().toLowerCase();
            const senha = document.getElementById('senha').value;
            
            // Validação básica
            if (!email || !senha) {
                mensagemErro.style.display = 'block';
                setTimeout(() => {
                    mensagemErro.style.display = 'none';
                }, 3000);
                return;
            }
            
            // Mostrar loading
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            const btnTextoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<span class="loader"></span> Entrando...';
            btnSubmit.disabled = true;
            
            try {
                // Buscar usuário no JSON Server pelo email
                const response = await fetch(`${API_URL}/usuarios?email=${encodeURIComponent(email)}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao conectar com o servidor');
                }
                
                const usuarios = await response.json();
                
                // Verificar se encontrou algum usuário
                if (usuarios.length === 0) {
                   mensagemErro.style.display = 'block';
                setTimeout(() => {
                    mensagemErro.style.display = 'none';
                }, 3000);
                    return;
                }
                
                const usuario = usuarios[0];
                
                // Verificar senha (⚠️ EM PRODUÇÃO: Use bcrypt/hashing!)
                if (usuario.senha !== senha) {
                   mensagemErro.style.display = 'block';
                setTimeout(() => {
                    mensagemErro.style.display = 'none';
                }, 3000);
                    return;
                }
                
                // Preparar dados para salvar no localStorage
                const dadosUsuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo || 'cliente', // Padrão: cliente
                    dataCadastro: usuario.dataCadastro || new Date().toISOString().split('T')[0]
                };
                
                // Salvar no localStorage
                localStorage.setItem('usuario_logado', JSON.stringify(dadosUsuario));
                
                
                // Redirecionar conforme o tipo de usuário
                setTimeout(() => {
                    if (usuario.tipo === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'minha_conta.html'; 
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Erro no login:', error);
                mostrarErro('Erro ao fazer login. Tente novamente mais tarde.');
            } finally {
                // Restaurar botão
                btnSubmit.innerHTML = btnTextoOriginal;
                btnSubmit.disabled = false;
            }
        });