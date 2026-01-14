 
        // Verificar se está logado
        let usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));

        // Elementos
        const adminArea = document.getElementById('admin-area');
        const mensagemErro = document.getElementById('mensagem-erro');

        // Modal de edição
        const modalEdicao = document.getElementById('modal-edicao');
        const btnFecharModal = document.querySelector('.btn-fechar');
        const formEditar = document.getElementById('form-editar');
        const btnTrocarImagem = document.getElementById('btn-trocar-imagem');
        const inputNovaImagem = document.getElementById('nova-imagem');
        const imagemAtual = document.getElementById('imagem-atual');

        // Variáveis globais
        let produtos = [];
        let produtoEditando = null;
        let novaImagemSelecionada = false;
        let graficos = {};

        // URL base do JSON Server
        const API_URL = 'http://localhost:3000';

        // Inicializar página
        if (usuarioLogado) {
            mostrarAreaAdmin();
            carregarProdutos(); // Carrega produtos do servidor
        } else {
            window.location.href = 'login.html'
        }

        // Logout automático após 30 minutos
        setTimeout(() => {
            if (usuarioLogado) {
                localStorage.removeItem('usuario_logado');
                alert('Sessão expirada. Por favor, faça login novamente.');
                window.location.reload();
            }
        }, 30 * 60 * 1000);

        function mostrarAreaAdmin() {
            adminArea.style.display = 'block';
        }

        // ==================== FUNÇÕES DE NAVEGAÇÃO ====================
        function inicializarNavegacao() {
            // Botões do menu
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Remove classe active de todos
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelectorAll('.admin-page').forEach(page => {
                        page.classList.remove('active');
                    });
                    
                    // Adiciona classe active no botão clicado
                    this.classList.add('active');
                    
                    // Mostra a página correspondente
                    const pageId = this.getAttribute('data-page');
                    document.getElementById(`page-${pageId}`).classList.add('active');
                    
                    // Se for dashboard, atualiza gráficos
                    if (pageId === 'dashboard') {
                        criarGraficos();
                    }
                });
            });
            
            // Botão de logout
            document.getElementById('btn-logout').addEventListener('click', function() {
                localStorage.removeItem('admin_logado');
                window.location.href = "login.html"
            });
            
            // Botão limpar formulário
                document.getElementById('btn-limpar')?.addEventListener('click', function() {
                document.getElementById('admin-nome').value = '';
                document.getElementById('admin-preco').value = '';
                document.getElementById('admin-estoque').value = '';
                document.getElementById('admin-categoria').value = '';
                document.getElementById('admin-imagem').value = '';
                document.getElementById('admin-descricao').value = ''; // Novo campo
            });
            
            // Filtro de busca
            document.getElementById('search-input')?.addEventListener('input', function() {
                filtrarProdutos();
            });
            
            // Filtro por categoria
            document.getElementById('filter-categoria')?.addEventListener('change', function() {
                filtrarProdutos();
            });
        }

        // ==================== FUNÇÕES DE PRODUTOS COM JSON SERVER ====================
        async function salvarProdutos() {
            try {
                // Para atualizar a lista local após operações
                await carregarProdutos();
            } catch (error) {
                console.error('Erro ao salvar produtos:', error);
                alert('Erro ao salvar produtos no servidor.');
            }
        }

        function formatarPreco(preco) {
            return `${preco.toFixed(2).replace('.', ',')} kz`;
        }

        function carregarResumo() {
            // Calcular totais
            const totalProdutos = produtos.length;
            const totalEstoque = produtos.reduce((sum, prod) => sum + prod.estoque, 0);
            const valorTotalEstoque = produtos.reduce((sum, prod) => sum + (prod.preco * prod.estoque), 0);
            
            // Atualizar cards
            document.getElementById('total-produtos-card').textContent = totalProdutos;
            document.getElementById('total-estoque').textContent = totalEstoque;
            document.getElementById('valor-total-estoque').textContent = formatarPreco(valorTotalEstoque);
        }

        function filtrarProdutos() {
            const termo = document.getElementById('search-input').value.toLowerCase();
            const categoria = document.getElementById('filter-categoria').value;
            
            const produtosFiltrados = produtos.filter(produto => {
                const matchNome = produto.nome.toLowerCase().includes(termo);
                const matchCategoria = !categoria || produto.categoria === categoria;
                return matchNome && matchCategoria;
            });
            
            // Atualizar contador
            document.getElementById('produtos-filtrados').textContent = produtosFiltrados.length;
            
            // Renderizar produtos filtrados
            renderizarProdutos(produtosFiltrados);
        }

        function renderizarProdutos(listaProdutos) {
            const lista = document.getElementById('lista-produtos');
            
            if (listaProdutos.length === 0) {
                lista.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <p>Nenhum produto encontrado.</p>
                        <p>Tente alterar os filtros de busca.</p>
                    </div>
                `;
                return;
            }
            
            // Renderiza lista de produtos
            lista.innerHTML = '';
            listaProdutos.forEach((produto, index) => {
                const item = document.createElement('div');
                item.className = 'produto-admin-item';
                item.innerHTML = `
                    <div class="produto-info">
                        <div class="produto-imagem-small">
                            <img src="${produto.imagem}" alt="${produto.nome}">
                        </div>
                        <div class="produto-detalhes">
                            <h4>${produto.nome}</h4>
                            <p>${formatarPreco(produto.preco)} • Estoque: ${produto.estoque}</p>
                            <p><small>Categoria: ${produto.categoria}</small></p>
                            <p><small>${produto.descricao || 'Sem descrição'}</small></p>
                        </div>
                    </div>
                    <div class="produto-admin-botoes">
                        <button class="btn-editar" data-id="${produto.id}">
                            Editar
                        </button>
                        <button class="btn-eliminar" data-id="${produto.id}">
                            Eliminar
                        </button>
                    </div>
                `;
                lista.appendChild(item);
            });
        }

        async function carregarProdutos() {
            try {
                const response = await fetch(`${API_URL}/produtos`);
                if (!response.ok) throw new Error('Erro ao carregar produtos');
                
                produtos = await response.json();
                
                // Atualizar contadores
                document.getElementById('total-produtos').textContent = produtos.length;
                document.getElementById('produtos-filtrados').textContent = produtos.length;
                
                // Carregar resumo
                carregarResumo();
                
                // Renderizar produtos
                renderizarProdutos(produtos);
                
                // Criar gráficos
                if (usuarioLogado && produtos.length > 0) {
                    criarGraficos();
                }
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
                produtos = []; // Fallback para array vazio
                renderizarProdutos([]);
            }
        }

        // Cadastrar produto
        document.getElementById('formulario-admin').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('admin-nome').value;
            const preco = parseFloat(document.getElementById('admin-preco').value);
            const estoque = parseInt(document.getElementById('admin-estoque').value);
            const categoria = document.getElementById('admin-categoria').value;
            const descricao = document.getElementById('admin-descricao').value; // Novo campo
            const inputImagem = document.getElementById('admin-imagem');
            
            // Validação
            if (!nome || !preco || isNaN(estoque) || !categoria || !descricao || inputImagem.files.length === 0) {
                alert('Preencha todos os campos corretamente!');
                return;
            }
            
            if (preco <= 0) {
                alert('O preço deve ser maior que zero!');
                return;
            }
            
            if (estoque < 0) {
                alert('O estoque não pode ser negativo!');
                return;
            }
            
            const arquivo = inputImagem.files[0];
            const leitor = new FileReader();
            
            leitor.onload = async function(e) {
                const novoProduto = {
                    nome: nome,
                    preco: preco,
                    categoria: categoria,
                    estoque: estoque,
                    descricao: descricao, // Novo campo
                    imagem: e.target.result
                };
                
                try {
                    const response = await fetch(`${API_URL}/produtos`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(novoProduto)
                    });
                    
                    if (!response.ok) throw new Error('Erro ao cadastrar produto');
                    
                    // Atualiza interface
                    await carregarProdutos();
                    
                    // Limpa formulário
                    document.getElementById('admin-nome').value = '';
                    document.getElementById('admin-preco').value = '';
                    document.getElementById('admin-estoque').value = '';
                    document.getElementById('admin-categoria').value = '';
                    document.getElementById('admin-descricao').value = '';
                    document.getElementById('admin-imagem').value = '';
                    
                    alert(`✅ Produto "${nome}" cadastrado com sucesso!`);
                    
                    // Vai para a página de gerenciar
                    document.querySelector('[data-page="gerenciar"]').click();
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Erro ao cadastrar produto no servidor.');
                }
            };
            
            leitor.readAsDataURL(arquivo);
        });

        // ==================== FUNÇÕES DE EDIÇÃO ====================
        function abrirModalEdicao(id) {
            produtoEditando = produtos.find(p => p.id === id);
            if (!produtoEditando) return;
            
            // Preencher formulário com dados atuais
            document.getElementById('editar-id').value = produtoEditando.id;
            document.getElementById('editar-nome').value = produtoEditando.nome;
            document.getElementById('editar-preco').value = produtoEditando.preco;
            document.getElementById('editar-estoque').value = produtoEditando.estoque;
            document.getElementById('editar-categoria').value = produtoEditando.categoria;
            document.getElementById('editar-descricao').value = produtoEditando.descricao || ''; // Novo campo
            imagemAtual.src = produtoEditando.imagem;
            
            // Resetar controle de nova imagem
            novaImagemSelecionada = false;
            inputNovaImagem.value = '';
            
            // Mostrar modal
            modalEdicao.style.display = 'flex';
        }

        function fecharModal() {
            modalEdicao.style.display = 'none';
            produtoEditando = null;
            novaImagemSelecionada = false;
        }

        // Eventos do modal
        btnFecharModal.addEventListener('click', fecharModal);
        modalEdicao.addEventListener('click', function(e) {
            if (e.target === modalEdicao) {
                fecharModal();
            }
        });

        // Botão para trocar imagem
        btnTrocarImagem.addEventListener('click', function() {
            inputNovaImagem.click();
        });

        // Selecionar nova imagem
        inputNovaImagem.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                novaImagemSelecionada = true;
                const leitor = new FileReader();
                leitor.onload = function(e) {
                    imagemAtual.src = e.target.result;
                };
                leitor.readAsDataURL(e.target.files[0]);
            }
        });

        // Salvar alterações
        formEditar.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!produtoEditando) return;
            
            // Obter novos valores
            const novoNome = document.getElementById('editar-nome').value;
            const novoPreco = parseFloat(document.getElementById('editar-preco').value);
            const novoEstoque = parseInt(document.getElementById('editar-estoque').value);
            const novaCategoria = document.getElementById('editar-categoria').value;
            const novaDescricao = document.getElementById('editar-descricao').value; // Novo campo
            
            // Validações
            if (!novoNome || !novoPreco || isNaN(novoEstoque) || !novaCategoria || !novaDescricao) {
                alert('Preencha todos os campos corretamente!');
                return;
            }
            
            if (novoPreco <= 0) {
                alert('O preço deve ser maior que zero!');
                return;
            }
            
            if (novoEstoque < 0) {
                alert('O estoque não pode ser negativo!');
                return;
            }
            
            try {
                const dadosAtualizados = {
                    nome: novoNome,
                    preco: novoPreco,
                    estoque: novoEstoque,
                    categoria: novaCategoria,
                    descricao: novaDescricao
                };
                
                // Se foi selecionada uma nova imagem, incluir no update
                if (novaImagemSelecionada && inputNovaImagem.files[0]) {
                    const leitor = new FileReader();
                    leitor.onload = async function(e) {
                        dadosAtualizados.imagem = e.target.result;
                        
                        const response = await fetch(`${API_URL}/produtos/${produtoEditando.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(dadosAtualizados)
                        });
                        
                        if (!response.ok) throw new Error('Erro ao atualizar produto');
                        
                        await carregarProdutos();
                        fecharModal();
                        alert(`✅ Produto "${novoNome}" atualizado com sucesso!`);
                    };
                    leitor.readAsDataURL(inputNovaImagem.files[0]);
                } else {
                    dadosAtualizados.imagem = produtoEditando.imagem;
                    const response = await fetch(`${API_URL}/produtos/${produtoEditando.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(dadosAtualizados)
                    });
                    
                    if (!response.ok) throw new Error('Erro ao atualizar produto');
                    
                    await carregarProdutos();
                    fecharModal();
                    alert(`✅ Produto "${novoNome}" atualizado com sucesso!`);
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao atualizar produto no servidor.');
            }
        });

        // Eventos de clique
        document.addEventListener('click', async function(e) {
            if (e.target.classList.contains('btn-eliminar')) {
                const id = e.target.getAttribute('data-id');
                
                if (confirm('Tem certeza que deseja eliminar este produto?\nEsta ação não pode ser desfeita.')) {
                    try {
                        const response = await fetch(`${API_URL}/produtos/${id}`, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) throw new Error('Erro ao deletar produto');
                        
                        // Remove o produto da lista local
                        produtos = produtos.filter(p => p.id !== id);
                        
                        // Recarrega a lista
                        carregarProdutos();
                        
                        alert('Produto eliminado com sucesso!');
                    } catch (error) {
                        console.error('Erro:', error);
                        alert('Erro ao eliminar produto do servidor.');
                    }
                }
            }
            
            // Evento para botão de editar
            if (e.target.classList.contains('btn-editar')) {
                const id = e.target.getAttribute('data-id');
                abrirModalEdicao(id);
            }
        });

        // ==================== FUNÇÕES DOS GRÁFICOS ====================
        function criarGraficos() {
            // Dados para os gráficos
            const categorias = ['eletronicos', 'vestuario', 'livros', 'moveis'];
            const nomesCategorias = ['Eletrônicos', 'Vestuário', 'Livros', 'Móveis'];
            
            // Calcular dados
            const contagemPorCategoria = {};
            const estoquePorCategoria = {};
            const valorPorCategoria = {};
            
            categorias.forEach(cat => {
                contagemPorCategoria[cat] = 0;
                estoquePorCategoria[cat] = 0;
                valorPorCategoria[cat] = 0;
            });
            
            produtos.forEach(produto => {
                contagemPorCategoria[produto.categoria]++;
                estoquePorCategoria[produto.categoria] += produto.estoque;
                valorPorCategoria[produto.categoria] += produto.preco * produto.estoque;
            });
            
            // Destruir gráficos anteriores se existirem
            Object.values(graficos).forEach(grafico => {
                if (grafico) grafico.destroy();
            });
            
            // 1. Gráfico de Produtos por Categoria (Pizza ou Doughnut)
            const ctxCategorias = document.getElementById('grafico-categorias');
            graficos.categorias = new Chart(ctxCategorias, {
                type: 'doughnut',
                data: {
                    labels: nomesCategorias,
                    datasets: [{
                        data: categorias.map(cat => contagemPorCategoria[cat]),
                        backgroundColor: [
                            '#FF6384', // eletronicos
                            '#36A2EB', // vestuario
                            '#FFCE56', // livros
                            '#4BC0C0'  // moveis
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            // 2. Gráfico de Estoque por Categoria (Barras)
            const ctxEstoque = document.getElementById('grafico-estoque');
            graficos.estoque = new Chart(ctxEstoque, {
                type: 'bar',
                data: {
                    labels: nomesCategorias,
                    datasets: [{
                        label: 'Quantidade em Estoque',
                        data: categorias.map(cat => estoquePorCategoria[cat]),
                        backgroundColor: '#3498db',
                        borderColor: '#2980b9',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Quantidade'
                            }
                        }
                    }
                }
            });
            
            // 3. Gráfico de Valor Total em Estoque (Barras)
            const ctxValor = document.getElementById('grafico-valor-estoque');
            graficos.valor = new Chart(ctxValor, {
                type: 'bar',
                data: {
                    labels: nomesCategorias,
                    datasets: [{
                        label: 'Valor Total (kz)',
                        data: categorias.map(cat => valorPorCategoria[cat]),
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Valor (kz)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const valor = context.raw;
                                    return `Valor: ${valor.toFixed(2).replace('.', ',')} kz`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarGraficos() {
            if (graficos.categorias) {
                criarGraficos(); // Recria todos os gráficos
            }
        }

        // Verificar se DOM está carregado
        document.addEventListener('DOMContentLoaded', function() {
            console.log("DOM carregado");
            
            // Se já estiver logado, inicializar navegação
            if (usuarioLogado && usuarioLogado.tipo === 'admin') {
                // Pequeno delay para garantir que o DOM está pronto
                setTimeout(function() {
                    inicializarNavegacao();
                }, 100);
            } else{
                window.location.href = 'login.html'
            }
        });



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