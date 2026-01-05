// ==================== DADOS INICIAIS ====================
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let categoriaAtiva = 'todos';

// ==================== FUNÇÕES UTILITÁRIAS ====================
function salvarLocalStorage() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function formatarPreco(preco) {
    return `${preco.toFixed(2).replace('.', ',')} kz`;
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
    
    // Se não houver produtos
    if (produtosParaExibir.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">Nenhum produto encontrado</p>
                <p>Use o Modo Administrador para cadastrar novos produtos</p>
            </div>
        `;
        return;
    }
    
    // Renderiza cada produto
    produtosParaExibir.forEach(produto => {
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
                <button class="btn-adicionar" data-id="${produto.id}" 
                    ${produto.estoque <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ${produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
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
    
    // Sempre mostra o botão "Todos"
    let html = `<button data-categoria="todos" class="ativa">${formatarNomeCategoria('todos')}</button>`;
    
    // Extrai categorias únicas dos produtos
    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];
    
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
    
    // Verifica se tem estoque
    if (produto.estoque <= 0) {
        alert('Produto sem estoque!');
        return;
    }
    
    // Verifica se já está no carrinho
    const itemExistente = carrinho.find(item => item.id === idProduto);
    
    if (itemExistente) {
        if (itemExistente.quantidade >= produto.estoque) {
            alert(`Limite de estoque atingido! Só temos ${produto.estoque} unidades.`);
            return;
        }
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
    const btn = document.querySelector(`.btn-adicionar[data-id="${idProduto}"]`);
    if (btn) {
        btn.textContent = '✓ Adicionado!';
        btn.style.background = '#27ae60';
        setTimeout(() => {
            btn.textContent = produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Produto Esgotado';
            btn.style.background = '';
        }, 1500);
    }
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
        const produtoOriginal = produtos.find(p => p.id === item.id);
        const estoque = produtoOriginal ? produtoOriginal.estoque : 0;
        const subtotal = item.preco * item.quantidade;
        totalValor += subtotal;
        
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <div class="carrinho-item-info">
                <strong>${item.nome}</strong><br>
                <small>${formatarPreco(item.preco)} cada</small>
                ${item.quantidade >= estoque ? 
                '<br><small class="estoque-esgotado">Estoque esgotado!</small>' : 
                `<br><small class="estoque-disponivel">${estoque - item.quantidade} disponíveis</small>`
                }
            </div>
            <div class="carrinho-item-controles">
                <div class="quantidade-control">
                    <button class="btn-diminuir" data-index="${index}" 
                            ${item.quantidade <= 1 ? 'disabled' : ''}>
                        −
                    </button>
                    <input type="number" 
                        class="quantidade-input" 
                        data-index="${index}"
                        value="${item.quantidade}" 
                        min="1" 
                        max="${estoque}">
                    <button class="btn-aumentar" data-index="${index}"
                            ${item.quantidade >= estoque ? 'disabled' : ''}>
                        +
                    </button>
                </div>
                <div class="carrinho-item-subtotal">
                    <strong>${formatarPreco(subtotal)}</strong><br>
                    <button class="btn-remover" data-index="${index}">
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

// ==================== FUNÇÕES DE QUANTIDADE ====================
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
    
    if (novaQuantidade < 1) novaQuantidade = 1;
    if (produtoOriginal && novaQuantidade > produtoOriginal.estoque) {
        novaQuantidade = produtoOriginal.estoque;
        alert(`Só temos ${produtoOriginal.estoque} unidades em estoque!`);
    }
    
    produtoNoCarrinho.quantidade = novaQuantidade;
    atualizarCarrinho();
    salvarLocalStorage();
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
    const estoque = parseInt(document.getElementById('admin-estoque').value);
    const inputImagem = document.getElementById('admin-imagem');
    
    // Validação
    if (!nome || !preco || isNaN(estoque) || !categoria || inputImagem.files.length === 0) {
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
    
    leitor.onload = function(e) {
        const novoProduto = {
            id: Date.now(),
            nome: nome,
            preco: preco,
            categoria: categoria,
            estoque: estoque,
            imagem: e.target.result
        };
        
        produtos.push(novoProduto);
        salvarLocalStorage();
        
        // Atualiza interface
        renderizarProdutos(categoriaAtiva);
        gerarBotoesCategorias();
        
        // Limpa formulário (mantém estoque em 10 como padrão)
        document.getElementById('admin-nome').value = '';
        document.getElementById('admin-preco').value = '';
        document.getElementById('admin-estoque').value = '10';
        document.getElementById('admin-categoria').value = '';
        document.getElementById('admin-imagem').value = '';
        
        alert(`Produto "${nome}" cadastrado com sucesso!\n\nEstoque: ${estoque} unidades\nPreço: ${formatarPreco(preco)}`);
    };
    
    leitor.readAsDataURL(arquivo);
}

// ==================== FUNÇÃO DE RESET ====================
function resetarSistema() {
    if (confirm("⚠️ ATENÇÃO!\n\nEsta ação irá:\n1. Apagar TODOS os produtos cadastrados\n2. Limpar o carrinho\n3. Zerar todo o sistema\n\nTem certeza que deseja continuar?")) {
        // Limpa tudo
        localStorage.clear();
        produtos = [];
        carrinho = [];
        
        // Atualiza interface
        renderizarProdutos();
        atualizarCarrinho();
        gerarBotoesCategorias();
        
        // Fecha carrinho se estiver aberto
        document.getElementById('carrinho-sidebar').classList.remove('ativo');
        document.getElementById('overlay').style.display = 'none';
        
        alert('✅ Sistema resetado com sucesso!\n\nO sistema está vazio. Use o Modo Administrador para cadastrar novos produtos.');
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa interface
    gerarBotoesCategorias();
    renderizarProdutos();
    atualizarCarrinho();
    
    // Delegar eventos para elementos dinâmicos
    document.addEventListener('click', function(e) {
        // Filtro por categoria
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
        
        // Abrir carrinho
        if (e.target.id === 'carrinho-btn') {
            document.getElementById('carrinho-sidebar').classList.add('ativo');
            document.getElementById('overlay').style.display = 'block';
        }
        
        // Fechar carrinho
        if (e.target.closest('.fechar-carrinho') || e.target.id === 'overlay') {
            document.getElementById('carrinho-sidebar').classList.remove('ativo');
            document.getElementById('overlay').style.display = 'none';
        }
        
        // Botões de quantidade no carrinho
        if (e.target.classList.contains('btn-aumentar')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            aumentarQuantidade(index);
        }
        
        if (e.target.classList.contains('btn-diminuir')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            diminuirQuantidade(index);
        }
        
        // Remover item do carrinho
        if (e.target.classList.contains('btn-remover')) {
            const index = parseInt(e.target.getAttribute('data-index'));
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
            alert(`✅ Compra finalizada!\n\nTotal: ${formatarPreco(total)}`);
            carrinho = [];
            atualizarCarrinho();
            salvarLocalStorage();
        }
        
        // Modo admin
        if (e.target.id === 'btn-admin') {
            alternarModoAdmin();
        }
        
        // Resetar sistema
        if (e.target.id === 'btn-resetar') {
            resetarSistema();
        }
    });
    
    // Evento para input de quantidade
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantidade-input')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const novaQuantidade = e.target.value;
            alterarQuantidadeInput(index, novaQuantidade);
        }
    });
    
    // Evento para input de quantidade (em tempo real)
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantidade-input')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const novaQuantidade = e.target.value;
            
            if (novaQuantidade && !isNaN(novaQuantidade) && novaQuantidade >= 1) {
                alterarQuantidadeInput(index, novaQuantidade);
            }
        }
    });
    
    // Formulário admin
    const formAdmin = document.getElementById('formulario-admin');
    if (formAdmin) {
        formAdmin.addEventListener('submit', cadastrarProduto);
    }
});

// ==================== INICIALIZAÇÃO ====================
// Garante que existe um array vazio se não houver dados
if (!Array.isArray(produtos)) {
    produtos = [];
    localStorage.setItem('produtos', JSON.stringify(produtos));
}