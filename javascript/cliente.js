 // ==================== VERIFICAÇÃO DE LOGIN ====================
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
        
        // Verificar se é cliente (não admin) e está logado
        if (!usuarioLogado || usuarioLogado.tipo !== 'cliente') {
            window.location.href = 'login.html';
        }
        
        
        let usuarioDados = null;
        
        setTimeout(() => {
            if (usuarioLogado) {
                localStorage.removeItem('usuario_logado');
                alert('Sessão expirada. Por favor, faça login novamente.');
                window.location.reload();
            }
        }, 30 * 60 * 1000);
        
        
        // ==================== FUNÇÃO PARA CARREGAR DADOS DO USUÁRIO ====================
        async function carregarDadosUsuario() {
            try {
                if (!usuarioLogado || !usuarioLogado.id) {
                    window.location.href = 'login.html';
                    return;
                }

                console.log('Carregando dados do usuário ID:', usuarioLogado.id);
                
                // 1. Carregar dados do usuário
                const response = await fetch(`${API_URL}/usuarios/${usuarioLogado.id}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar dados do usuário');
                }
                
                usuarioDados = await response.json();
                
                // 2. Atualizar interface
                document.getElementById('usuario-nome').textContent = usuarioDados.nome || 'Usuário';
                document.getElementById('usuario-email').textContent = usuarioDados.email || '';
                document.getElementById('usuario-bemvindo').textContent = `Olá, ${usuarioDados.nome || 'Usuário'}`;
                
                // 3. Preencher formulário de perfil
                document.getElementById('perfil-nome').value = usuarioDados.nome || '';
                document.getElementById('perfil-email').value = usuarioDados.email || '';
                document.getElementById('perfil-data-cadastro').value = usuarioDados.dataCadastro || 'Não informada';
                
                // 4. Carregar contadores
                await carregarContadores(usuarioLogado.id);
                
                // 5. Inicializar sistema
                inicializarSistema();
                
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar seus dados. Tente novamente.');
            }
        }
        
        // ==================== CARREGAR CONTADORES ====================
        async function carregarContadores(usuarioId) {
            try {

                const pedidosResponse = await fetch(`${API_URL}/pedidos?usuarioId=${usuarioId}`);
                const pedidos = pedidosResponse.ok ? await pedidosResponse.json() : [];
                              
                // Último pedido
                if (pedidos.length > 0) {
                    const ultimoPedido = pedidos[pedidos.length - 1];
                    const dataFormatada = new Date(ultimoPedido.data).toLocaleDateString('pt-PT');
                    document.getElementById('perfil-ultimo-pedido').value = `${dataFormatada}`;
                }
                document.getElementById('badge-pedidos').textContent = pedidos.length
                
                // Favoritos
                const favoritosResponse = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioId}`);
                const favoritos = favoritosResponse.ok ? await favoritosResponse.json() : [];
                document.getElementById('badge-favoritos').textContent = favoritos.length;
                document.getElementById('total-favoritos').textContent = favoritos.length;
                
            } catch (error) {
                console.error('Erro ao carregar contadores:', error);
            }
        }
        
        // ==================== INICIALIZAR SISTEMA ====================
        function inicializarSistema() {
            inicializarNavegacao();
            carregarDadosPagina('produtos');
        }
        
        // ==================== NAVEGAÇÃO ====================
        function inicializarNavegacao() {
            // Menu lateral
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                    document.querySelectorAll('.admin-page').forEach(page => page.classList.remove('active'));
                    
                    this.classList.add('active');
                    const pageId = this.getAttribute('data-page');
                    document.getElementById(`page-${pageId}`).classList.add('active');
                    
                    carregarDadosPagina(pageId);
                });
            });
            
            // Logout
            document.getElementById('btn-logout').addEventListener('click', function() {
                if (confirm('Tem certeza que deseja sair da sua conta?')) {
                    // Remove todos os dados do usuário
                    localStorage.removeItem('usuario_logado');
                    
                    
                    // Redireciona para login
                    window.location.href = 'login.html';
                }
            });
            
            // Botões explorar produtos
            document.getElementById('btn-explorar-produtos')?.addEventListener('click', () => {
                document.querySelector('[data-page="produtos"]').click();
            });
            
            document.getElementById('btn-explorar-produtos-favoritos')?.addEventListener('click', () => {
                document.querySelector('[data-page="produtos"]').click();
            });
            
            // Botão cancelar perfil
            document.getElementById('btn-cancelar-perfil')?.addEventListener('click', function() {
                if (usuarioDados) {
                    document.getElementById('perfil-nome').value = usuarioDados.nome || '';
                    document.getElementById('perfil-senha-atual').value = '';
                    document.getElementById('perfil-nova-senha').value = '';
                    document.getElementById('perfil-confirmar-senha').value = '';
                }
            });
            
            // Formulário de perfil
            document.getElementById('form-perfil')?.addEventListener('submit', async function(e) {
                e.preventDefault();
                await atualizarPerfil();
            });
        }
        
        // ==================== ATUALIZAR PERFIL ====================
        async function atualizarPerfil() {
            try {
                const nome = document.getElementById('perfil-nome').value;
                const senhaAtual = document.getElementById('perfil-senha-atual').value;
                const novaSenha = document.getElementById('perfil-nova-senha').value;
                const confirmarSenha = document.getElementById('perfil-confirmar-senha').value;
                
                // Validações
                if (!senhaAtual) {
                    alert('Por favor, informe sua senha atual para confirmar as alterações.');
                    return;
                } else if(senhaAtual !== usuarioDados.senha){
                    alert('Senha incorreta!');
                    return;
                }
                
                if (novaSenha && novaSenha !== confirmarSenha) {
                    alert('As novas senhas não coincidem!');
                    return;
                }
                
                if (novaSenha && novaSenha.length < 8) {
                    alert('A nova senha deve ter no mínimo 8 caracteres!');
                    return;
                }
                
                // Atualizar dados do usuário
                const dadosAtualizados = {
                    ...usuarioDados,
                    nome: nome
                };
                
                // Se tiver nova senha, adicionar ao objeto
                if (novaSenha) {
                    dadosAtualizados.senha = novaSenha;
                }
                
                const response = await fetch(`${API_URL}/usuarios/${usuarioLogado.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao atualizar perfil');
                }
                
                // Atualizar usuário logado no localStorage
                const usuarioAtualizado = await response.json();
                localStorage.setItem('usuario_logado', JSON.stringify(usuarioAtualizado));
                
                // Atualizar dados locais
                usuarioDados = usuarioAtualizado;
                
                // Atualizar interface
                document.getElementById('usuario-nome').textContent = usuarioDados.nome || 'Usuário';
                document.getElementById('usuario-bemvindo').textContent = `Olá, ${usuarioDados.nome || 'Usuário'}`;
                
                // Limpar campos de senha
                document.getElementById('perfil-senha-atual').value = '';
                document.getElementById('perfil-nova-senha').value = '';
                document.getElementById('perfil-confirmar-senha').value = '';
                
                alert('✅ Perfil atualizado com sucesso!');
                
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                alert('Erro ao atualizar perfil. Tente novamente.');
            }
        }
        
       
        
        /*function atualizarContadorCarrinhoHeader() {
            // Usar o carrinho da loja.js
            const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
            document.getElementById('contador-carrinho-header').textContent = totalItens;
        }
        
        function fecharCarrinho() {
            document.getElementById('carrinho-sidebar').classList.remove('ativo');
            document.getElementById('overlay').style.display = 'none';
        }*/
        
        async function finalizarCompraEspecifico() {
            const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            
            if (carrinho.length === 0) {
                alert('Adicione produtos ao carrinho primeiro!');
                return;
            }
            
            // Calcular total
            const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
            
            // Criar pedido
            const pedido = {
                usuarioId: usuarioLogado.id,
                usuarioNome: usuarioLogado.nome,
                data: new Date().toISOString(),
                status: 'pendente',
                total: total,
                itens: carrinho.map(item => ({
                    produtoId: item.id,
                    nome: item.nome,
                    preco: item.preco,
                    quantidade: item.quantidade,
                    subtotal: item.preco * item.quantidade
                }))
            };
            
            try {
                // Salvar pedido no JSON Server
                const response = await fetch(`${API_URL}/pedidos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pedido)
                });
                
                if (!response.ok) throw new Error('Erro ao salvar pedido');
                
                const pedidoCriado = await response.json();
                
                // Limpar carrinho
                localStorage.removeItem('carrinho');
                
               
                
                // Atualizar contadores do usuário
                await carregarContadores(usuarioLogado.id);
                
                // Fechar carrinho
                fecharCarrinho();
                
                // Mostrar resumo
                mostrarResumoCompra(pedidoCriado);
                
            } catch (error) {
                console.error('Erro ao finalizar compra:', error);
                alert('Erro ao finalizar compra. Tente novamente.');
            }
        }
        
        // ==================== CARREGAR PÁGINAS ====================
        async function carregarDadosPagina(pageId) {
            switch(pageId) {
                case 'perfil':
                    // Já carregado na inicialização
                    break;
                case 'pedidos':
                    await carregarListaPedidos();
                    break;
                case 'produtos':
                    await carregarProdutosParaExibicao();
                    break;
                case 'favoritos':
                    await carregarFavoritos();
                    break;
            }
        }
        
        // ==================== PRODUTOS ====================
        async function carregarProdutosParaExibicao() {
            try {
                const response = await fetch(`${API_URL}/produtos`);
                if (!response.ok) throw new Error('Erro ao carregar produtos');
                produtos = await response.json();
                
                //renderizarProdutosConta(produtos);
                configurarBuscaConta();
                adicionarFavoritosAosProdutos();
                
                
                
            } catch (error) {
                console.error('Erro:', error);
                produtos = [];
            }
        }
        
        /*function renderizarProdutosConta(listaProdutos) {
            const container = document.getElementById('catalogo-produtos');
            
            if (listaProdutos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🛒</div>
                        <h4>Nenhum produto encontrado</h4>
                        <p>Tente alterar os filtros de busca.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            listaProdutos.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'produto-card';
                
                // Verificar se está nos favoritos
                const estaFavoritado = verificarSeFavoritado(produto.id);
                console.log(estaFavoritado)
                
                card.innerHTML = `
                    <img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
                    <div class="produto-info">
                        <h3 class="produto-nome">${produto.nome}</h3>
                        <p class="produto-preco">${formatarPreco(produto.preco)}</p>
                        <p class="produto-estoque" style="color: ${produto.estoque > 0 ? '#27ae60' : '#e74c3c'};">
                            ${produto.estoque > 0 ? `📦 Estoque: ${produto.estoque}` : '❌ Esgotado'}
                        </p>
                        ${produto.descricao ? `
                            <a href="#" class="ver-descricao" data-id="${produto.id}">
                                📄 Ver descrição completa
                            </a>
                        ` : ''}
                        <div class="produto-acoes">
                            <button class="btn-adicionar" data-id="${produto.id}" 
                                ${produto.estoque <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                ${produto.estoque > 0 ? '🛒 Adicionar' : 'Esgotado'}
                            </button>
                            <button class="btn-favorito ${estaFavoritado ? 'favoritado' : ''}" data-id="${produto.id}">
                                ${estaFavoritado ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            // Adicionar eventos aos botões
            adicionarEventosProdutosConta();
        }*/

        function adicionarFavoritosAosProdutos() {
            const produtosCards = document.querySelectorAll('.produto-card');

            console.log("Chegou")
            
            produtosCards.forEach(card => {
                // Encontra o botão "Adicionar" existente
                const btnAdicionar = card.querySelector('.btn-adicionar');
                if (!btnAdicionar) return;
                
                // Pega o ID do produto
                const produtoId = btnAdicionar.getAttribute('data-id');
                
                // Encontra o container do botão atual
                const containerBotoes = btnAdicionar.parentNode;
                
                // Verifica se já tem botão de favorito (para não duplicar)
                if (card.querySelector('.btn-favorito')) {
                    return; // Já tem favorito, não faz nada
                }
                
                // Verifica se está favoritado
                const estaFavoritado = verificarSeFavoritado(parseInt(produtoId));
                
                // Substitui o botão único por div com dois botões
                const divAcoes = document.createElement('div');
                divAcoes.className = 'produto-acoes';
                divAcoes.innerHTML = `
                    ${btnAdicionar.outerHTML}
                    <button class="btn-favorito ${estaFavoritado ? 'favoritado' : ''}" data-id="${produtoId}">
                        ${estaFavoritado ? '❤️' : '🤍'}
                    </button>
                `;
                
                // Substitui o botão antigo pela nova div
                containerBotoes.replaceChild(divAcoes, btnAdicionar);
                
                // Atualiza o texto do botão "Adicionar" (opcional)
                const novoBtnAdicionar = divAcoes.querySelector('.btn-adicionar');
                const textoOriginal = novoBtnAdicionar.textContent;
                if (textoOriginal === 'Adicionar ao Carrinho') {
                    novoBtnAdicionar.textContent = '🛒 Adicionar';
                }
            });
            
            
            adicionarEventosProdutosConta();
        }
        
        
        
        /*function configurarBuscaConta() {
            const campoBusca = document.getElementById('campo-pesquisa');
            const botaoBusca = document.getElementById('botao-pesquisa');
            
            const executarBusca = () => {
                const termo = campoBusca.value.toLowerCase();
                const produtosFiltrados = produtos.filter(produto => 
                    produto.nome.toLowerCase().includes(termo) ||
                    produto.descricao?.toLowerCase().includes(termo)
                );
                renderizarProdutos('todos',produtosFiltrados);
                 setTimeout(() => {
                    adicionarFavoritosAosProdutos();
                }, 100);
            };
            
            campoBusca.addEventListener('input', executarBusca);
            botaoBusca.addEventListener('click', executarBusca);
            
        }*/
        
        /*function filtrarProdutosConta(categoria) {
            const termo = document.getElementById('campo-pesquisa')?.value.toLowerCase() || '';
            let produtosFiltrados = produtos;
            
            // Filtrar por categoria
            if (categoria !== 'todos') {
                produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoria);
            }
            
            // Filtrar por busca
            if (termo) {
                produtosFiltrados = produtosFiltrados.filter(p => 
                    p.nome.toLowerCase().includes(termo) ||
                    p.descricao?.toLowerCase().includes(termo)
                );
            }
            
            renderizarProdutosConta(produtosFiltrados);
        }*/
        
        function adicionarEventosProdutosConta() {
            
            // Favoritar/Desfavoritar
            document.querySelectorAll('.btn-favorito').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    toggleFavorito(id, this);
                });
            });
            
            // Ver descrição (usando função da loja.js)
            document.querySelectorAll('.ver-descricao').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const id = this.getAttribute('data-id');
                    if (typeof abrirModalDescricao === 'function') {
                        abrirModalDescricao(id);
                    }
                });
            });
        }
        
        // Variável global para armazenar favoritos
        let todosFavoritos = [];

        // Carrega todos os favoritos UMA VEZ
        async function carregarTodosFavoritos() {
            try {
                const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioLogado.id}`);
                todosFavoritos = response.ok ? await response.json() : [];
                console.log('Favoritos carregados:', todosFavoritos);
            } catch (error) {
                console.error('Erro ao carregar favoritos:', error);
                todosFavoritos = [];
            }
        }

        // Agora SIM retorna true/false DIRETO
        function verificarSeFavoritado(produtoId) {
            return todosFavoritos.some(fav => fav.produtoId === produtoId);
        }
        
        async function toggleFavorito(produtoId, elementoBtn) {
            try {
                const produto = produtos.find(p => p.id === produtoId);
                if (!produto) return;
                
                const estaFavoritado = verificarSeFavoritado(produtoId);
                
                if (estaFavoritado) {
                    // REMOVER: Busca o registro de favorito pelo produtoId E usuarioId
                    const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioLogado.id}&produtoId=${produtoId}`);
                    
                    if (response.ok) {
                        const favoritos = await response.json();
                        
                        if (favoritos.length > 0) {
                            // Deleta usando o ID do REGISTRO de favorito (favoritos[0].id)
                            await fetch(`${API_URL}/favoritos/${favoritos[0].id}`, {
                                method: 'DELETE'
                            });
                        }
                    }
                    
                    // Atualiza o cache local
                    todosFavoritos = todosFavoritos.filter(fav => fav.produtoId !== produtoId);
                    
                    elementoBtn.innerHTML = '🤍';
                    elementoBtn.classList.remove('favoritado');
                    
                } else {

                    const verificaResponse = await fetch(
                    `${API_URL}/favoritos?usuarioId=${usuarioLogado.id}&produtoId=${produtoId}`
                );
                
                if (verificaResponse.ok) {
                    const existentes = await verificaResponse.json();
                    
                    // Se já existe, não adiciona de novo
                    if (existentes.length > 0) {
                        console.log('Já existe nos favoritos');
                        elementoBtn.innerHTML = '❤️';
                        elementoBtn.classList.add('favoritado');
                        todosFavoritos = existentes; // Atualiza cache
                        return;
                    }
                }

                    // ADICIONAR (já está correto)
                    const novoFavorito = {
                        usuarioId: usuarioLogado.id,
                        produtoId: produtoId,
                        dataAdicionado: new Date().toISOString(),
                    };
                    
                    const addResponse = await fetch(`${API_URL}/favoritos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novoFavorito)
                    });
                    
                    if (addResponse.ok) {
                        const favoritoAdicionado = await addResponse.json();
                        // Adiciona ao cache local
                        todosFavoritos.push(favoritoAdicionado);
                    }
                    
                    elementoBtn.innerHTML = '❤️';
                    elementoBtn.classList.add('favoritado');
                }
                
                // Atualizar contador
                await carregarContadores(usuarioLogado.id);
                
                // Log para debug
                console.log('Favoritos atualizados:', todosFavoritos);
                
            } catch (error) {
                console.error('Erro ao atualizar favorito:', error);
                alert('Erro ao atualizar favoritos.');
            }
        }
        
        async function carregarFavoritos() {
            try {
                const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioLogado.id}`);
                const favoritos = response.ok ? await response.json() : [];
                
                const container = document.getElementById('lista-favoritos');
                const semFavoritos = document.getElementById('sem-favoritos');
                
                if (favoritos.length === 0) {
                    container.style.display = 'none';
                    semFavoritos.style.display = 'block';
                    return;
                }
                
                container.style.display = 'grid';
                semFavoritos.style.display = 'none';
                
                // Carregar produtos favoritados
                const produtosFavoritos = [];
                for (const favorito of favoritos) {
                    const produtoResponse = await fetch(`${API_URL}/produtos/${favorito.produtoId}`);
                    if (produtoResponse.ok) {
                        const produto = await produtoResponse.json();
                        produtosFavoritos.push(produto);
                    }
                }
                
                renderizarProdutosFavoritos(produtosFavoritos);
                
            } catch (error) {
                console.error('Erro ao carregar favoritos:', error);
            }
        }
        
        function renderizarProdutosFavoritos(listaProdutos) {
            const container = document.getElementById('lista-favoritos');
            container.innerHTML = '';
            
            if (listaProdutos.length === 0) {
                container.innerHTML = '<p>Nenhum produto favoritado</p>';
                return;
            }
            
            listaProdutos.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'produto-card';
                
                card.innerHTML = `
                    <img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
                    <div class="produto-info">
                        <h3 class="produto-nome">${produto.nome}</h3>
                        <p class="produto-preco">${formatarPreco(produto.preco)}</p>
                        <p class="produto-estoque" style="color: ${produto.estoque > 0 ? '#27ae60' : '#e74c3c'};">
                            ${produto.estoque > 0 ? `📦 Estoque: ${produto.estoque}` : '❌ Esgotado'}
                        </p>
                        <div class="produto-acoes">
                            <button class="btn-adicionar" data-id="${produto.id}" 
                                ${produto.estoque <= 0 ? 'disabled' : ''}>
                                🛒 Adicionar
                            </button>
                            <button class="btn-favorito favoritado" data-id="${produto.id}">
                                ❤️ Remover
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            // Adicionar eventos
            adicionarEventosProdutosConta();
        }
        
        
        // ==================== PEDIDOS (APENAS LISTAGEM) ====================
        async function carregarListaPedidos() {
            try {
                const response = await fetch(`${API_URL}/pedidos?usuarioId=${usuarioLogado.id}&_sort=data&_order=desc`);
                const pedidos = response.ok ? await response.json() : [];
                
                const container = document.getElementById('lista-pedidos');
                const semPedidos = document.getElementById('sem-pedidos');
                
                if (pedidos.length === 0) {
                    container.style.display = 'none';
                    semPedidos.style.display = 'block';
                    return;
                }
                
                container.style.display = 'block';
                semPedidos.style.display = 'none';
                container.innerHTML = '';
                
                pedidos.forEach(pedido => {
                    const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-PT');
                    
                    const div = document.createElement('div');
                    div.className = 'pedido-card';
                    div.innerHTML = `
                        <div class="pedido-header">
                            <div class="pedido-info">
                                <h4 class="pedido-numero">Pedido #${pedido.id.substring(0, 8)}</h4>
                                <span class="pedido-data">${dataFormatada}</span>
                            </div>
                            <div class="pedido-total">
                                <strong>${formatarPreco(pedido.total)}</strong>
                            </div>
                        </div>
                        
                        <div class="pedido-itens">
                            <h5>Itens do Pedido:</h5>
                            <div class="itens-lista">
                                ${pedido.itens.map(item => `
                                    <div class="pedido-item">
                                        <span class="item-nome">${item.nome}</span>
                                        <span class="item-quantidade">${item.quantidade} x ${formatarPreco(item.preco)}</span>
                                        <span class="item-subtotal">${formatarPreco(item.subtotal)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="pedido-acoes">
                            <button class="btn-adicionar-todos" data-pedido-id="${pedido.id}">
                                🛒 Adicionar Todos ao Carrinho
                            </button>
                        </div>
                    `;
                    container.appendChild(div);
                });
                
                // Adicionar eventos aos botões
                adicionarEventosPedidos();
                
            } catch (error) {
                console.error('Erro ao carregar pedidos:', error);
            }
        }
        
        function adicionarEventosPedidos() {
            // Ver detalhes
            document.querySelectorAll('.btn-detalhes').forEach(btn => {
                btn.addEventListener('click', function() {
                    const pedidoId = this.getAttribute('data-pedido-id');
                    mostrarDetalhesPedido(pedidoId);
                });
            });
            
            // Adicionar todos os itens ao carrinho
            document.querySelectorAll('.btn-adicionar-todos').forEach(btn => {
            btn.addEventListener('click', async function() {
                const pedidoId = this.getAttribute('data-pedido-id');
                adicionarItemAoCarrinho(pedidoId);
            });
        });
        }
        
        async function mostrarDetalhesPedido(pedidoId) {
            try {
                const response = await fetch(`${API_URL}/pedidos/${pedidoId}`);
                if (!response.ok) throw new Error('Pedido não encontrado');
                
                const pedido = await response.json();
                const modal = document.getElementById('modal-detalhes-pedido');
                const conteudo = document.getElementById('modal-detalhes-conteudo');
                
                const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-PT');
                const horaFormatada = new Date(pedido.data).toLocaleTimeString('pt-PT');
                
                let itensHTML = '';
                pedido.itens.forEach(item => {
                    itensHTML += `
                        <div class="detalhe-item">
                            <div class="detalhe-item-info">
                                <strong>${item.nome}</strong>
                                <span>${item.quantidade} unidade(s)</span>
                            </div>
                            <div class="detalhe-item-valores">
                                <span>${formatarPreco(item.preco)} cada</span>
                                <strong>${formatarPreco(item.subtotal)}</strong>
                            </div>
                        </div>
                    `;
                });
                
                conteudo.innerHTML = `
                    <div class="detalhes-pedido">
                        <div class="detalhes-header">
                            <h4>Pedido #${pedido.id.substring(0, 8)}</h4>
                            <span class="detalhes-data">${dataFormatada} às ${horaFormatada}</span>
                        </div>
                        
                        <div class="detalhes-status">
                            <h5>Status:</h5>
                            <span class="status-${pedido.status}">${pedido.status}</span>
                        </div>
                        
                        <div class="detalhes-itens">
                            <h5>Itens do Pedido:</h5>
                            ${itensHTML}
                        </div>
                        
                        <div class="detalhes-total">
                            <h5>Resumo Financeiro:</h5>
                            <div class="total-linha">
                                <span>Subtotal:</span>
                                <span>${formatarPreco(pedido.total)}</span>
                            </div>
                            <div class="total-linha total-final">
                                <strong>Total:</strong>
                                <strong>${formatarPreco(pedido.total)}</strong>
                            </div>
                        </div>
                    </div>
                `;
                
                modal.style.display = 'flex';
                
                // Fechar modal
                modal.querySelector('.btn-fechar-modal').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
            } catch (error) {
                console.error('Erro ao carregar detalhes:', error);
                alert('Erro ao carregar detalhes do pedido.');
            }
        }
        
        async function adicionarItemAoCarrinho(pedidoId) {
            try {
                    // Buscar o pedido
                    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`);
                    if (!response.ok) throw new Error('Pedido não encontrado');
                    
                    const pedido = await response.json();
                    
                    if (!pedido.itens || pedido.itens.length === 0) {
                        alert('Este pedido não contém itens.');
                        return;
                    }
                    
                    let totalAdicionado = 0;
                    
                    // Para cada item no pedido
                    for (const item of pedido.itens) {
                        const produtoId = item.produtoId || item.id;
                        
                        if (!produtoId) continue;
                        
                        
                        adicionarAoCarrinho(produtoId, item.quantidade);
                        totalAdicionado += item.quantidade;
                    }
                    
                    // Feedback final
                    if (totalAdicionado > 0) {
                        alert(`✅ Pedido adicionado ao carrinho!`);
                    } else {
                        alert('Nenhum item pôde ser adicionado (estoque insuficiente ou produtos indisponíveis).');
                    }
                    
                } catch (error) {
                    console.error('Erro ao processar pedido:', error);
                    alert('Erro ao adicionar itens ao carrinho.');
                }
        }
        
        // ==================== MOSTRAR RESUMO COMPRA ====================
        function mostrarResumoCompra(pedido) {
            const modal = document.getElementById('modal-resumo-compra');
            const conteudo = document.getElementById('modal-resumo-conteudo');
            
            const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-PT');
            
            let itensHTML = '';
            pedido.itens.forEach(item => {
                itensHTML += `
                    <div class="resumo-item">
                        <strong>${item.nome}</strong>
                        <span>${item.quantidade} x ${formatarPreco(item.preco)} = ${formatarPreco(item.subtotal)}</span>
                    </div>
                `;
            });
            
            conteudo.innerHTML = `
                <div class="resumo-pedido">
                    <p><strong>Pedido #${pedido.id.substring(0, 8)}</strong></p>
                    <p>Data: ${dataFormatada}</p>
                    <p>Status: <span class="status-pendente">${pedido.status}</span></p>
                    
                    <div class="resumo-itens">
                        <h4>Itens da Compra:</h4>
                        ${itensHTML}
                    </div>
                    
                    <div class="resumo-total">
                        <h4>Total da Compra:</h4>
                        <p class="total-final">${formatarPreco(pedido.total)}</p>
                    </div>
                    
                    <div class="resumo-mensagem">
                        <p>✅ Obrigado pela sua compra!</p>
                        <p>Você pode acompanhar este pedido na página "Meus Pedidos".</p>
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
            
            // Fechar modal
            document.querySelector('#modal-resumo-compra .btn-fechar-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            document.getElementById('btn-fechar-resumo').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        document.addEventListener('click', function(e){
            // Finalizar compra
            if (e.target.id === 'finalizar-compra') {
                if (carrinho.length === 0) {
                    alert('Adicione produtos ao carrinho primeiro!');
                    return;
                }
                
                const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
        
                if (!usuarioLogado || usuarioLogado.tipo !== 'cliente') {
                    // Usuário não está logado como cliente
                    if (confirm('Para finalizar a compra, você precisa estar logado.\n\nSerá redirecionado para a página de login?')) {
                        window.location.href = 'html/login.html'; // Ajuste o caminho conforme necessário
                    }
                    return;
                }
                
                // Usuário está logado, criar pedido
                finalizarCompraComUsuario(usuarioLogado);
            }
        });

        // ==================== FINALIZAR COMPRA COM USUÁRIO ====================
            async function finalizarCompraComUsuario(usuario) {
        try {
            // Verificar se há itens no carrinho
            if (carrinho.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            // Calcular total
            const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
            
            // Criar objeto do pedido
            const pedido = {
                usuarioId: usuario.id,
                data: new Date().toISOString(),
                total: total,
                itens: carrinho.map(item => ({
                    produtoId: item.id,
                    nome: item.nome,
                    preco: item.preco,
                    quantidade: item.quantidade,
                    subtotal: item.preco * item.quantidade
                }))
            };
            
            console.log('Enviando pedido:', pedido);
            
            // Salvar pedido no JSON Server
            const response = await fetch(`${API_URL}/pedidos`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(pedido)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao salvar pedido: ${response.status}`);
            }
            
            const pedidoCriado = await response.json();
            console.log('Pedido criado:', pedidoCriado);
            
            // Atualizar estoque dos produtos
            await atualizarEstoqueProdutos();
            
            // Limpar carrinho
            carrinho = [];
            localStorage.removeItem('carrinho');
            
            // Atualizar interface do carrinho (se a função existir)
            if (typeof atualizarCarrinho === 'function') {
                atualizarCarrinho();
            }
            
            // Atualizar contador do carrinho no header
            if (typeof atualizarContadorCarrinho === 'function') {
                atualizarContadorCarrinho();
            }
            
            // Fechar sidebar do carrinho se estiver aberto
            const carrinhoSidebar = document.getElementById('carrinho-sidebar');
            const overlay = document.getElementById('overlay');
            if (carrinhoSidebar && carrinhoSidebar.classList.contains('ativo')) {
                carrinhoSidebar.classList.remove('ativo');
                if (overlay) overlay.style.display = 'none';
            }
            
            // Mostrar resumo da compra
            mostrarResumoCompra(pedidoCriado);
            
        } catch (error) {
            console.error('Erro detalhado ao finalizar compra:', error);
            alert('Erro ao finalizar compra. Tente novamente ou entre em contato com o suporte.');
        }
    }

        // ==================== ATUALIZAR ESTOQUE ====================
        async function atualizarEstoqueProdutos() {
            try {
                for (const item of carrinho) {
                    // Buscar produto atual
                    const produtoResponse = await fetch(`${API_URL}/produtos/${item.id}`);
                    if (produtoResponse.ok) {
                        const produto = await produtoResponse.json();
                        
                        // Calcular novo estoque
                        const novoEstoque = Math.max(0, produto.estoque - item.quantidade);
                        
                        // Atualizar produto
                        await fetch(`${API_URL}/produtos/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ estoque: novoEstoque })
                        });
                        
                        console.log(`Estoque atualizado: ${produto.nome} - Novo estoque: ${novoEstoque}`);
                    }
                }
            } catch (error) {
                console.error('Erro ao atualizar estoque:', error);
            }
        }

        // ==================== MOSTRAR RESUMO SIMPLIFICADO DA COMPRA ====================
        function mostrarResumoCompra(pedido) {
            const modal = document.getElementById('modal-resumo-compra');
            const conteudo = document.getElementById('modal-resumo-conteudo');
            
            // Formatar data simples (opcional)
            const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-PT');
            
            // Gerar HTML simples dos itens
            let itensHTML = '';
            pedido.itens.forEach((item) => {
                itensHTML += `
                    <div class="resumo-item-simples">
                        <span class="item-nome">${item.nome}</span>
                        <span class="item-quantidade">${item.quantidade}x</span>
                        <span class="item-preco">${formatarPreco(item.preco)}</span>
                        <span class="item-subtotal">${formatarPreco(item.subtotal)}</span>
                    </div>
                `;
            });
            
            // Montar conteúdo SIMPLIFICADO
            conteudo.innerHTML = `
                <div class="resumo-simples">
                    <div class="resumo-titulo">
                        <h4>✅ Compra realizada com sucesso!</h4>
                        <p class="data-pedido">Data: ${dataFormatada}</p>
                    </div>
                    
                    <div class="lista-itens">
                        <div class="cabecalho-itens">
                            <span class="col-produto">Produto</span>
                            <span class="col-qtd">Qtd</span>
                            <span class="col-preco">Preço</span>
                            <span class="col-subtotal">Subtotal</span>
                        </div>
                        <div class="itens-comprados">
                            ${itensHTML}
                        </div>
                    </div>
                    
                    <div class="resumo-total-simples">
                        <div class="linha-total">
                            <span>TOTAL:</span>
                            <span class="valor-total">${formatarPreco(pedido.total)}</span>
                        </div>
                    </div>
                    
                    <div class="resumo-agradecimento">
                        <p>Obrigado pela sua compra!</p>
                    </div>
                </div>
            `;
            
            // Mostrar modal
            modal.style.display = 'flex';
            
            // Configurar botão de fechar
            const btnFecharResumo = document.getElementById('btn-fechar-resumo');
            const btnFecharModal = modal.querySelector('.btn-fechar-modal');
            
            const fecharModalResumo = () => {
                modal.style.display = 'none';
            };
            
            btnFecharResumo.onclick = fecharModalResumo;
            btnFecharModal.onclick = fecharModalResumo;
            
            // Fechar ao clicar fora do modal (opcional)
            modal.onclick = (e) => {
                if (e.target === modal) {
                    fecharModalResumo();
                }
            };
        }


        // ==================== HAMBURGUER MOBILE ====================

        document.addEventListener('DOMContentLoaded', function() {
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.querySelector('.admin-sidebar');
            
            if (!menuToggle || !sidebar) return;
            
            // Criar overlay dinamicamente
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            // Abrir/fechar menu
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            // Fechar menu ao clicar no overlay
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                this.classList.remove('active');
            });
            
            // Fechar menu ao clicar em um item (mobile)
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    }
                });
            });
            
            // Fechar menu ao pressionar ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
            
            // Em telas grandes, garantir menu visível
            function checkScreenSize() {
                if (window.innerWidth > 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    sidebar.style.display = 'block';
                } else {
                    sidebar.style.display = 'none';
                }
            }
            
            checkScreenSize();
            window.addEventListener('resize', checkScreenSize);
        });
        
       document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado, verificando login...');
        
        
        // Mostrar área da conta
        document.getElementById('conta-area').style.display = 'block';
        
        // Carregar dados do usuário após um pequeno delay
        setTimeout(() => {
            console.log('Iniciando carregamento dos dados do usuário...');
            carregarDadosUsuario();
        }, 300);
    });