// 1. Pontos no plano cartesiano.
const dados = [
    {x: 10, y: 20},
    {x: 20, y: 35},
    {x: 30, y: 25},
    {x: 40, y: 50},
    {x: 50, y: 45},
    {x: 60, y: 60},
    {x: 70, y: 55},
    {x: 80, y: 75},
    {x: 90, y: 70},
    {x: 100, y: 90}
];

// 2. Configurando dimensões.
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 3. Criar o SVG.
const svg = d3.select("#chart") //Seleciona a div.
    .append("svg") // Adiciona o SVG.
    .attr("width", width + margin.left + margin.right) // Largura do SVG.
    .attr("height", height + margin.top + margin.bottom) // Altura do SVG.
    .append("g") // Cria um 'group': contém eixos, pontos, etc.
    .attr("transform", `translate(${margin.left}, ${margin.top})`); // Usa 'transform' para aplicar as margens definidas (evita ficar colado).

// 4. Escalas dos eixos.
const escalaX = d3.scaleLinear() // Escala linearmente espaçada do eixo.
    .domain([0, d3.max(dados, d => d.x)]) // Domínio de 0 até o maior valor de x dos dados.
    .range([0, width]); // Intervalo de saída (último x = width).

const escalaY = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.y)])
    .range([height, 0]); // Invertido porque SVG cresce para baixo.

// 5. Eixos.
const eixoX = d3.axisBottom(escalaX); // Linha, número e ticks.
const eixoY = d3.axisLeft(escalaY);

// Adicionar eixo X ao grupo g.
svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(eixoX) // Aplica o eixo X.
    .append("text")
    .attr("x", width / 2) // Posição da legenda do eixo.
    .attr("y", 30) // Posição y da legenda do eixo.
    .attr("fill", "black") // Cor preta. 
    .style("text-anchor", "middle") // Centraliza o texto em relação à posição. 
    .text("Eixo X"); // Legenda.

// Adicionar eixo Y ao grupo G.
svg.append("g")
    .call(eixoY)
    .append("text")
    .attr("transform", "rotate(-90)") // Texto paralelo a y.
    .attr("x", -height / 2) // Valores negativos devido a rotação.
    .attr("y", -30) 
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Eixo Y");

// Criando tooltip.
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Plotando os pontos.
svg.selectAll(".dot") // Inicialmente, os '.dot' são vazios.
    .data(dados) // Usamos os dados para criar os círculos.
    .enter() // Entra no modo preenchimento: dados sem elementos correspondentes serão preenchidos.
    .append("circle") // Preenchidos com círculos.
    .attr("class", "dot") // Cada círculo terá a classe 'dot' (extremamente útil).
    .attr("cx", d => escalaX(d.x))
    .attr("cy", d => escalaY(d.y))
    .attr("r", 3.5) // Raio dos círculos.
    // event: evento associado (clique/movimento e posicionamento); d: dados de x e y.
    .on("mouseover", function(event, d) { 
        // Muda-se cor do ponto no estilo.

        // Ponto cresce um pouco.
        d3.select(this).attr("r", 5);
        
        // Mostrar tooltip.
        tooltip
            .style("opacity", 1) // Ativador.
            .html(`(${d.x}, ${d.y})`) // Texto do tooltip '(x,y)'.
            .style("left", (event.pageX + 10) + "px") // Posicionamento.
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
        // Voltar ao tamanho normal.
        d3.select(this).attr("r", 3.5);
        // Esconder tooltip.
        tooltip.style("opacity", 0);
    });
