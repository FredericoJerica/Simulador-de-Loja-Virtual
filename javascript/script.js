// ==================== CONFIGURAÇÕES ====================
const API_URL = 'http://localhost:3000';  // JSON Server

// ==================== DADOS INICIAIS ====================
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let categoriaAtiva = 'todos';

// ==================== FUNÇÕES UTILITÁRIAS ====================
function salvarLocalStorage() {
    // Agora só salva o carrinho
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

// ==================== FUNÇÕES DE PRODUTOS (JSON SERVER) ====================
async function carregarProdutosDoServidor() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        produtos = await response.json();
        console.log('Produtos carregados:', produtos);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        produtos = [];
    }
}

async function renderizarProdutos(categoria = 'todos') {
    const container = document.getElementById('catalogo-produtos');
    const titulo = document.getElementById('titulo-catalogo');
    
    // Mostra loading
    container.innerHTML = '<div class="loading">Carregando produtos...</div>';
    
    // Carrega produtos do servidor
    await carregarProdutosDoServidor();
    
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
            </div>
        `;
        atualizarContadoresCategorias();
        return;
    }
    
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
                ${produto.descricao ? `
                    <a href="#" class="ver-descricao" data-id="${produto.id}">
                        📄 Ver descrição completa
                    </a>
                ` : '<p class="sem-descricao">Sem descrição</p>'}
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
function adicionarAoCarrinho(idProduto, quantidade = 1) {
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
        if (itemExistente.quantidade + quantidade > produto.estoque) {
            alert(`Limite de estoque atingido! Só temos ${produto.estoque} unidades.`);
            return;
        }
        itemExistente.quantidade += quantidade;
    } else {

        if (quantidade > produto.estoque) {
            alert(`Quantidade solicitada (${quantidade}) excede estoque disponível (${produto.estoque})!`);
            return;
        }

        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: quantidade
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


// ==================== FUNÇÃO DE RESET ====================
function limparCarrinho() {
    if (confirm("⚠️ ATENÇÃO!\n\nEsta ação irá:\n1. Limpar o carrinho\n\nTem certeza que deseja continuar?")) {
        // Limpa apenas o carrinho (produtos ficam no JSON Server)
        carrinho = [];
        localStorage.removeItem('carrinho');
        
        // Atualiza interface
        atualizarCarrinho();
        
        // Fecha carrinho se estiver aberto
        document.getElementById('carrinho-sidebar').classList.remove('ativo');
        document.getElementById('overlay').style.display = 'none';
        
        alert('✅ Carrinho limpo com sucesso!');
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa interface
    carregarProdutosDoServidor().then(() => {
        gerarBotoesCategorias();
        renderizarProdutos();
        atualizarCarrinho();
    });
    
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
            const id = e.target.closest('.btn-adicionar').getAttribute('data-id');
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
            
             const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    
            if (!usuarioLogado || usuarioLogado.tipo !== 'cliente') {
                console.log('Chegou')
                // Usuário não está logado como cliente
                if (confirm('Para finalizar a compra, você precisa estar logado.\n\nSerá redirecionado para a página de login?')) {
                    window.location.href = 'html/login.html'; // Ajuste o caminho conforme necessário
                }
                return;
            } 
            
        }
        
        // Resetar sistema (apenas carrinho)
        if (e.target.id === 'btn-resetar') {
            limparCarrinho();
        }

        // Abrir modal de descrição
        if (e.target.classList.contains('ver-descricao')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            abrirModalDescricao(id);
        }
        
        // Fechar modal ao clicar no X
        if (e.target.classList.contains('fechar-modal-descricao')) {
            fecharModalDescricao();
        }
        
        // Fechar modal ao clicar fora
        if (e.target.id === 'modal-descricao') {
            fecharModalDescricao();
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
    
    
});

// ==================== INICIALIZAÇÃO ====================
// Garante que existe um array vazio para o carrinho
if (!Array.isArray(carrinho)) {
    carrinho = [];
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Variável global para o produto atual no modal
let produtoModalAtual = null;

// Função para abrir modal com descrição
function abrirModalDescricao(id) {
    produtoModalAtual = produtos.find(p => p.id === id);
    if (!produtoModalAtual) return;
    
    // Preencher modal
    document.getElementById('modal-descricao-titulo').textContent = produtoModalAtual.nome;
    document.getElementById('modal-descricao-preco').textContent = formatarPreco(produtoModalAtual.preco);
    document.getElementById('modal-descricao-imagem').src = produtoModalAtual.imagem;
    document.getElementById('modal-descricao-imagem').alt = produtoModalAtual.nome;
    document.getElementById('modal-descricao-texto').textContent = produtoModalAtual.descricao || 'Sem descrição disponível.';
    
    // Configurar estoque
    const estoqueElement = document.getElementById('modal-descricao-estoque');
    estoqueElement.textContent = produtoModalAtual.estoque > 0 ? 
        `📦 ${produtoModalAtual.estoque} unidades disponíveis` : 
        '❌ Produto esgotado';
    estoqueElement.className = produtoModalAtual.estoque > 0 ? 'modal-estoque disponivel' : 'modal-estoque esgotado';
    
    // Configurar botão adicionar
    const btnAdicionar = document.getElementById('modal-btn-adicionar');
    if (produtoModalAtual.estoque > 0) {
        btnAdicionar.disabled = false;
        btnAdicionar.textContent = '🛒 Adicionar ao Carrinho';
        btnAdicionar.onclick = () => {
            adicionarAoCarrinho(id);
            fecharModalDescricao();
        };
    } else {
        btnAdicionar.disabled = true;
        btnAdicionar.textContent = 'Produto Esgotado';
    }
    
    // Mostrar modal
    document.getElementById('modal-descricao').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Previne scroll da página
}

// Função para fechar modal
function fecharModalDescricao() {
    document.getElementById('modal-descricao').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura scroll
    produtoModalAtual = null;
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('modal-descricao').style.display === 'block') {
        fecharModalDescricao();
    }
});

window.adicionarAoCarrinho = adicionarAoCarrinho;