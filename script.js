// ==================== DADOS INICIAIS ====================
        let produtos = JSON.parse(localStorage.getItem('produtos')) || [
            {
                id: 1,
                nome: "Smartphone Android",
                preco: 1299.90,
                categoria: "eletronicos",
                imagem: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNlZmY3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzQ2NjFhMiI+U21hcnRwaG9uZTwvdGV4dD48L3N2Zz4="
            },
            {
                id: 2,
                nome: "Camiseta Básica",
                preco: 39.90,
                categoria: "vestuario",
                imagem: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmM2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzg2NTIyOSI+Q2FtaXNldGE8L3RleHQ+PC9zdmc+"
            },
            {
                id: 3,
                nome: "Livro: Aprendendo JS",
                preco: 59.90,
                categoria: "livros",
                imagem: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTNmN2UzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzJjNTIyNyI+TGl2cm88L3RleHQ+PC9zdmc+"
            }
        ];

        let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        let categoriaAtiva = 'todos';

        // ==================== FUNÇÕES UTILITÁRIAS ====================
        function salvarLocalStorage() {
            localStorage.setItem('produtos', JSON.stringify(produtos));
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
        }

        function formatarPreco(preco) {
            return `R$ ${preco.toFixed(2).replace('.', ',')}`;
        }

        function formatarNomeCategoria(categoria) {
            const nomes = {
                'todos': 'Todos os Produtos',
                'eletronicos': 'Eletrônicos',
                'vestuario': 'Vestuário',
                'livros': 'Livros',
                'moveis': 'Móveis'
            };
            return nomes[categoria] || categoria;
        }

        // ==================== FUNÇÕES DE PRODUTOS ====================
        function renderizarProdutos(categoria = 'todos') {
            const container = document.getElementById('catalogo-produtos');
            const titulo = document.getElementById('titulo-catalogo');
            container.innerHTML = '';
            
            // Atualiza título
            titulo.textContent = categoria === 'todos' 
                ? 'Nossos Produtos' 
                : `${formatarNomeCategoria(categoria)}`;
            
            // Filtra produtos
            let produtosParaExibir = categoria === 'todos' 
                ? produtos 
                : produtos.filter(p => p.categoria === categoria);
            
            // Renderiza cada produto
            produtosParaExibir.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'produto-card';
                card.innerHTML = `
                    <img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
                    <div class="produto-info">
                        <h3 class="produto-nome">${produto.nome}</h3>
                        <p class="produto-preco">${formatarPreco(produto.preco)}</p>
                        <button class="btn-adicionar" data-id="${produto.id}">
                            Adicionar ao Carrinho
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
            
            atualizarContadoresCategorias();
        }

        function atualizarContadoresCategorias() {
            const botoes = document.querySelectorAll('.categorias button');
            botoes.forEach(botao => {
                const categoria = botao.getAttribute('data-categoria');
                let contador;
                
                if (categoria === 'todos') {
                    contador = produtos.length;
                } else {
                    contador = produtos.filter(p => p.categoria === categoria).length;
                }
                
                // Atualiza o texto mantendo o nome formatado
                const nomeFormatado = formatarNomeCategoria(categoria);
                botao.textContent = `${nomeFormatado} (${contador})`;
            });
        }

        function gerarBotoesCategorias() {
            const container = document.querySelector('.categorias');
            
            // Extrai categorias únicas dos produtos
            const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];
            
            // Botão "Todos" sempre existe
            let html = `<button data-categoria="todos" class="ativa">${formatarNomeCategoria('todos')}</button>`;
            
            // Adiciona outras categorias
            categoriasUnicas.forEach(cat => {
                html += `<button data-categoria="${cat}">${formatarNomeCategoria(cat)}</button>`;
            });
            
            container.innerHTML = html;
        }

        // ==================== FUNÇÕES DO CARRINHO ====================
        function adicionarAoCarrinho(idProduto) {
            const produto = produtos.find(p => p.id === idProduto);
            if (!produto) return;
            
            // Verifica se já está no carrinho
            const itemExistente = carrinho.find(item => item.id === idProduto);
            
            if (itemExistente) {
                itemExistente.quantidade++;
            } else {
                carrinho.push({
                    id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    quantidade: 1
                });
            }
            
            atualizarCarrinho();
            salvarLocalStorage();
            
            // Feedback visual
            const btn = document.querySelector(`[data-id="${idProduto}"]`);
            btn.textContent = '✓ Adicionado!';
            btn.style.background = '#27ae60';
            setTimeout(() => {
                btn.textContent = 'Adicionar ao Carrinho';
                btn.style.background = '';
            }, 1500);
        }

        function atualizarCarrinho() {
            const container = document.getElementById('carrinho-itens');
            const totalContainer = document.getElementById('carrinho-total');
            const contador = document.getElementById('contador-carrinho');
            
            // Atualiza contador do cabeçalho
            const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
            contador.textContent = totalItens;
            
            // Se carrinho vazio
            if (carrinho.length === 0) {
                container.innerHTML = '<div class="carrinho-vazio">Seu carrinho está vazio</div>';
                totalContainer.style.display = 'none';
                return;
            }
            
            // Renderiza itens
            container.innerHTML = '';
            let totalValor = 0;
            
            carrinho.forEach((item, index) => {
                const subtotal = item.preco * item.quantidade;
                totalValor += subtotal;
                
                const div = document.createElement('div');
                div.style.cssText = `
                    padding: 1rem;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                `;
                
               // Dentro do forEach que renderiza os itens do carrinho:
            div.innerHTML = `
                <div style="flex: 1;">
                    <strong>${item.nome}</strong><br>
                    <small>${formatarPreco(item.preco)} cada</small>
                    ${item.quantidade >= produto.estoque ? 
                    '<br><small style="color: #ff6b6b; font-weight: bold;">Estoque esgotado!</small>' : 
                    `<br><small style="color: #27ae60;">${produto.estoque - item.quantidade} disponíveis</small>`
                    }
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                    <div style="display: flex; align-items: center; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;">
                        <button class="btn-diminuir" data-index="${index}" 
                                ${item.quantidade <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            −
                        </button>
                        <input type="number" 
                            class="quantidade-input" 
                            data-index="${index}"
                            value="${item.quantidade}" 
                            min="1" 
                            max="${produto.estoque}"
                            style="width: 50px; text-align: center; border: none; padding: 8px; font-size: 16px;">
                        <button class="btn-aumentar" data-index="${index}"
                                ${item.quantidade >= produto.estoque ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            +
                        </button>
                    </div>
                    <div style="min-width: 100px; text-align: center;">
                        <strong>${formatarPreco(subtotal)}</strong><br>
                        <button class="btn-remover" data-index="${index}" 
                                style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                            Remover
                        </button>
                    </div>
                </div>
            `;
                
                container.appendChild(div);
            });
            
            // Atualiza total
            document.getElementById('total-valor').textContent = formatarPreco(totalValor);
            totalContainer.style.display = 'block';
        }

        // ==================== FUNÇÕES ADMINISTRATIVAS ====================
        function alternarModoAdmin() {
            const form = document.getElementById('formulario-admin');
            form.classList.toggle('ativo');
        }

        function cadastrarProduto(event) {
            event.preventDefault();
            
            const nome = document.getElementById('admin-nome').value;
            const preco = parseFloat(document.getElementById('admin-preco').value);
            const categoria = document.getElementById('admin-categoria').value;
            const inputImagem = document.getElementById('admin-imagem');
            
            // Validação básica
            if (!nome || !preco || !categoria || inputImagem.files.length === 0) {
                alert('Preencha todos os campos!');
                return;
            }
            
            // Processa imagem
            const arquivo = inputImagem.files[0];
            const leitor = new FileReader();
            
            leitor.onload = function(e) {
                const novoProduto = {
                    id: Date.now(), // ID único baseado no timestamp
                    nome: nome,
                    preco: preco,
                    categoria: categoria,
                    imagem: e.target.result // Base64 da imagem
                };
                
                produtos.push(novoProduto);
                salvarLocalStorage();
                
                // Atualiza interface
                renderizarProdutos(categoriaAtiva);
                gerarBotoesCategorias();
                
                // Limpa formulário
                event.target.reset();
                
                alert('Produto cadastrado com sucesso!');
            };
            
            leitor.readAsDataURL(arquivo);
        }

        // ==================== EVENT LISTENERS ====================
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializa interface
            gerarBotoesCategorias();
            renderizarProdutos();
            atualizarCarrinho();
            
            // Filtro por categoria
            document.addEventListener('click', function(e) {
                if (e.target.closest('.categorias button')) {
                    const botao = e.target.closest('button');
                    const categoria = botao.getAttribute('data-categoria');
                    
                    // Atualiza botão ativo
                    document.querySelectorAll('.categorias button').forEach(b => {
                        b.classList.remove('ativa');
                    });
                    botao.classList.add('ativa');
                    
                    // Renderiza produtos
                    categoriaAtiva = categoria;
                    renderizarProdutos(categoria);
                }
                
                // Adicionar ao carrinho
                if (e.target.closest('.btn-adicionar')) {
                    const id = parseInt(e.target.closest('.btn-adicionar').getAttribute('data-id'));
                    adicionarAoCarrinho(id);
                }
                
                // Abrir/fechar carrinho
                if (e.target.id === 'carrinho-btn') {
                    document.getElementById('carrinho-sidebar').classList.add('ativo');
                    document.getElementById('overlay').style.display = 'block';
                }
                
                if (e.target.closest('.fechar-carrinho') || e.target.id === 'overlay') {
                    document.getElementById('carrinho-sidebar').classList.remove('ativo');
                    document.getElementById('overlay').style.display = 'none';
                }
                
                // Remover item do carrinho
               // Remover item do carrinho - com delegação de eventos
                if (e.target.textContent === 'Remover' || e.target.closest('button[data-index]')) {
                    const botao = e.target.textContent === 'Remover' ? e.target : e.target.closest('button');
                    const index = parseInt(botao.getAttribute('data-index'));
                    
                    // Confirmação (opcional)
                    if (confirm("Remover este item do carrinho?")) {
                        carrinho.splice(index, 1);
                        atualizarCarrinho();
                        salvarLocalStorage();
                    }
                }
                
                // Finalizar compra
                if (e.target.id === 'finalizar-compra') {
                    if (carrinho.length === 0) {
                        alert('Adicione produtos ao carrinho primeiro!');
                        return;
                    }
                    
                    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
                    alert(`Compra finalizada! Total: ${formatarPreco(total)}\n\nEm um sistema real, aqui viria o checkout.`);
                    carrinho = [];
                    atualizarCarrinho();
                    salvarLocalStorage();
                }
                
                // Modo admin
                if (e.target.id === 'btn-admin') {
                    alternarModoAdmin();
                }
            });
            
            // Formulário admin
            document.getElementById('formulario-admin').addEventListener('submit', cadastrarProduto);
        });

        // ==================== INICIALIZAÇÃO ====================
        // Configura a página com dados iniciais se não houver nada salvo
        if (produtos.length === 0) {
            localStorage.setItem('produtos', JSON.stringify(produtos));
        }


        function aumentarQuantidade(index) {
    const produtoNoCarrinho = carrinho[index];
    const produtoOriginal = produtos.find(p => p.id === produtoNoCarrinho.id);
    
    if (produtoOriginal && produtoNoCarrinho.quantidade < produtoOriginal.estoque) {
        produtoNoCarrinho.quantidade++;
        atualizarCarrinho();
        salvarLocalStorage();
    }
}

function diminuirQuantidade(index) {
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade--;
        atualizarCarrinho();
        salvarLocalStorage();
    }
}

function alterarQuantidadeInput(index, novaQuantidade) {
    const produtoNoCarrinho = carrinho[index];
    const produtoOriginal = produtos.find(p => p.id === produtoNoCarrinho.id);
    
    novaQuantidade = parseInt(novaQuantidade) || 1;
    
    // Validação
    if (novaQuantidade < 1) novaQuantidade = 1;
    if (novaQuantidade > produtoOriginal.estoque) {
        novaQuantidade = produtoOriginal.estoque;
        alert(`Só temos ${produtoOriginal.estoque} unidades em estoque!`);
    }
    
    produtoNoCarrinho.quantidade = novaQuantidade;
    atualizarCarrinho();
    salvarLocalStorage();
}
