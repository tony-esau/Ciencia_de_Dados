// 1. Pontos no Espaço Cartesiano.
const dados = [
    {x: 10, y: 20, z: 15},
    {x: 20, y: 35, z: 25},
    {x: 30, y: 25, z: 40},
    {x: 40, y: 50, z: 30},
    {x: 50, y: 45, z: 55},
    {x: 60, y: 60, z: 50},
    {x: 70, y: 55, z: 65},
    {x: 80, y: 75, z: 60},
    {x: 90, y: 70, z: 80},
    {x: 100, y: 90, z: 85},
    {x: 100, y: 90, z: -100},
    {x: -23, y: -50, z: 50}
];

// 2. Dimensões com margens.
const margin = {top: 50, right: 50, bottom: 50, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// 3. Criando o SVG.
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g") // Grupo do gráfico.
    .attr("transform", `translate(${margin.left + width/2}, ${margin.top + height/2})`); //Aplicação das margens.

// 4. Normalização dinâmica: para saber o quanto crescer os eixos dependendo das coordenadas extremas de ambos os sentidos (negativo e positivo).
function getNormalizationScales() {
    const minX = d3.min(dados, d => d.x);
    const maxX = d3.max(dados, d => d.x);
    const minY = d3.min(dados, d => d.y);
    const maxY = d3.max(dados, d => d.y);
    const minZ = d3.min(dados, d => d.z);
    const maxZ = d3.max(dados, d => d.z);

    // Encontra o maior range absoluto entre todos os eixos.
    const rangeX = Math.max(Math.abs(minX), Math.abs(maxX)); 
    const rangeY = Math.max(Math.abs(minY), Math.abs(maxY));
    const rangeZ = Math.max(Math.abs(minZ), Math.abs(maxZ));
    
    // Para manter simetria na plotagem.
    const maxRange = Math.max(rangeX, rangeY, rangeZ);
    const axisLength = 200; // comprimento base do eixo em pixels.

    return {
        // Mapeanos os eixos na tela.
        normX: d3.scaleLinear().domain([-maxRange, maxRange]).range([-axisLength, axisLength]),
        normY: d3.scaleLinear().domain([-maxRange, maxRange]).range([-axisLength, axisLength]),
        normZ: d3.scaleLinear().domain([-maxRange, maxRange]).range([-axisLength, axisLength]),
        maxRange: maxRange,
        axisLength: axisLength
    };
}

let scales = getNormalizationScales();
let normX = scales.normX;
let normY = scales.normY;
let normZ = scales.normZ;

// 5. Projeção 3D em 2D.
let angleX = 283 * Math.PI / 180; // Angulação inicial da rotação do plano xy.
let angleZ = 338 * Math.PI / 180; // Angulação inicial da rotação de z.
let scale = 1;

// Controles visuais.
d3.select("#rotX").property("value", 283);
d3.select("#rotZ").property("value", 338);
d3.select("#rotXVal").text("283°");
d3.select("#rotZVal").text("338°");
d3.select("#zoomVal").text("100%");

// Converte coordenadas 3D para 2D aplicando duas rotações sucessivas.
function project3D(x, y, z) {
    // Rotação 1: Gira em torno do eixo Z (rotação horizontal).
    let x1 = x * Math.cos(angleZ) - y * Math.sin(angleZ);
    let y1 = x * Math.sin(angleZ) + y * Math.cos(angleZ);

    // Rotação 2: Gira em torno do eixo X (inclinação vertical).
    let y2 = y1 * Math.cos(angleX) - z * Math.sin(angleX);
    let z2 = y1 * Math.sin(angleX) + z * Math.cos(angleX);

    return {
        x: x1 * scale,
        y: -y2 * scale, // Inverter y, pois cresce de cima para baixo.
        z: z2
    };
}

// 6. Tooltip.
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// 7. Grupos dentro do Objeto SVG.
const gridGroup = svg.append("g").attr("class", "grid"); // Malha do plano xy.
const axisGroup = svg.append("g").attr("class", "axes"); // Grupo dos Eixos.
const projectionsGroup = svg.append("g").attr("class", "projections"); // Projeções no plano.
const pointsGroup = svg.append("g").attr("class", "points"); // Pontos no espaço cartesiano.

// 8. Função simples para centralização.
function computeCenterOffset(projectedPoints) {
    const xs = projectedPoints.map(d => d.px);
    const ys = projectedPoints.map(d => d.py);

    const minX = d3.min(xs);
    const maxX = d3.max(xs);
    const minY = d3.min(ys);
    const maxY = d3.max(ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
        dx: -centerX,
        dy: -centerY
    };
}

// 9. Desenho da malha (grid).
// dx e dy são deslocamentos (offsets) usados para centralizar a visualização na tela.
function drawGrid(dx = 0, dy = 0) {
    gridGroup.selectAll("*").remove(); // Remove tudo do estado anterior.

    const axisLength = scales.axisLength;
    const gridStep = 40; // Passo das linhas da malha.

    // Malha no plano XY (z = 0).

    // Linhas paralelas ao eixo x.
    for (let y = -axisLength; y <= axisLength; y += gridStep) {
        const start = project3D(-axisLength, y, 0);
        const end = project3D(axisLength, y, 0);

        // Vai do início até o fim, escrevendo as linhas.
        gridGroup.append("line")
            .attr("class", "grid-line")
            .attr("x1", start.x + dx)
            .attr("y1", start.y + dy)
            .attr("x2", end.x + dx)
            .attr("y2", end.y + dy);
    }

    // Linhas paralelas ao eixo y.
    for (let x = -axisLength; x <= axisLength; x += gridStep) {
        const start = project3D(x, -axisLength, 0);
        const end = project3D(x, axisLength, 0);

        gridGroup.append("line")
            .attr("class", "grid-line")
            .attr("x1", start.x + dx)
            .attr("y1", start.y + dy)
            .attr("x2", end.x + dx)
            .attr("y2", end.y + dy);
    }
}

// 10. Eixos dinâmicos.
function drawAxes(dx = 0, dy = 0) {
    axisGroup.selectAll("*").remove();

    const axisLength = scales.axisLength + 20; // Vai um pouco além do range dos dados.
    const origin = project3D(0, 0, 0); // Calcula onde fica a origem (0,0,0) na tela 2D.
    const originX = origin.x + dx;
    const originY = origin.y + dy;

    // Eixo X (negativo e positivo).
    // Projeta os dois extremos do eixo X em 3D em 2D.
    const xNeg = project3D(-axisLength, 0, 0);
    const xPos = project3D(axisLength, 0, 0);
    axisGroup.append("line")
        .attr("class", "axis-line")
        // Passa pela origem (0, 0, 0).
        .attr("x1", xNeg.x + dx) // Começa no x negativo.
        .attr("y1", xNeg.y + dy)
        .attr("x2", xPos.x + dx) // Termina no X positivo
        .attr("y2", xPos.y + dy);

    // Adicionar legenda e texto do eixo específico.
    axisGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", xPos.x + dx + 20)
        .attr("y", xPos.y + dy + 5)
        .text("X");

    // Eixo Y (negativo e positivo).
    const yNeg = project3D(0, -axisLength, 0);
    const yPos = project3D(0, axisLength, 0);
    axisGroup.append("line")
        .attr("class", "axis-line")
        .attr("x1", yNeg.x + dx)
        .attr("y1", yNeg.y + dy)
        .attr("x2", yPos.x + dx)
        .attr("y2", yPos.y + dy);

    axisGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", yPos.x + dx + 20)
        .attr("y", yPos.y + dy + 5)
        .text("Y");

    // Eixo Z (negativo e positivo).
    const zNeg = project3D(0, 0, -axisLength);
    const zPos = project3D(0, 0, axisLength);
    axisGroup.append("line")
        .attr("class", "axis-line")
        .attr("x1", zNeg.x + dx)
        .attr("y1", zNeg.y + dy)
        .attr("x2", zPos.x + dx)
        .attr("y2", zPos.y + dy);

    axisGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", zPos.x + dx + 10)
        .attr("y", zPos.y + dy - 10)
        .text("Z");

    drawAxisMarkers(dx, dy);
}

// 11. Marcações dinâmicas dos eixos.
// Desenha os marcadores de todos os eixos.
function drawAxisMarkers(dx = 0, dy = 0) {
    const numMarkers = 5;
    const markerRadius = 2.5;
    const maxRange = scales.maxRange;
    const step = maxRange / numMarkers;

    // Marcadores positivos e negativos nos eixos.
    for (let i = -numMarkers; i <= numMarkers; i++) {
        if (i === 0) continue; // Pula a origem.
        
        let value = step * i;
        let pos = normX(value);

        // Eixo X.
        let pX = project3D(pos, 0, 0);
        axisGroup.append("circle")
            .attr("cx", pX.x + dx)
            .attr("cy", pX.y + dy)
            .attr("r", markerRadius)
            .attr("fill", "black");

        // Eixo Y.
        let pY = project3D(0, pos, 0);
        axisGroup.append("circle")
            .attr("cx", pY.x + dx)
            .attr("cy", pY.y + dy)
            .attr("r", markerRadius)
            .attr("fill", "black");

        // Eixo Z.
        let pZ = project3D(0, 0, pos);
        axisGroup.append("circle")
            .attr("cx", pZ.x + dx)
            .attr("cy", pZ.y + dy)
            .attr("r", markerRadius)
            .attr("fill", "black");
    }
}

// 12. Linhas de projeção ortogonal.
function createProjectionLines(d, dx = 0, dy = 0) {
    projectionsGroup.selectAll("*").remove();

    // Ponto na tela.
    const sx = normX(d.x);
    const sy = normY(d.y);
    const sz = normZ(d.z);

    // Projeção do ponto.
    const point = project3D(sx, sy, sz);

    // Projeção das coordenadas do ponto no eixo.
    const basePoint = project3D(sx, sy, 0); // Projeção no plano XY.
    const xAxisPoint = project3D(sx, 0, 0);
    const yAxisPoint = project3D(0, sy, 0);
    const zAxisPoint = project3D(0, 0, sz);
    const zBasePoint = project3D(0, 0, sz);

    // Linha perpendicular ao plano XY: da altura ao ponto.
    projectionsGroup.append("line")
        .attr("class", "projection-line active")
        .attr("x1", zBasePoint.x + dx)
        .attr("y1", zBasePoint.y + dy)
        .attr("x2", point.x + dx)
        .attr("y2", point.y + dy)
        .attr("stroke", "#555")

    // Linha no plano XZ: do ponto base até o ponto.
    projectionsGroup.append("line")
        .attr("class", "projection-line active")
        .attr("x1", point.x + dx)
        .attr("y1", point.y + dy)
        .attr("x2", basePoint.x + dx)
        .attr("y2", basePoint.y + dy)
        .attr("stroke", "#555");

    // Linha no plano XY: de x até o ponto base.
    projectionsGroup.append("line")
        .attr("class", "projection-line active")
        .attr("x1", basePoint.x + dx)
        .attr("y1", basePoint.y + dy)
        .attr("x2", xAxisPoint.x + dx)
        .attr("y2", xAxisPoint.y + dy)
        .attr("stroke", "#555");

    // Linha no plano XY: de y até o ponto base.
    projectionsGroup.append("line")
        .attr("class", "projection-line active")
        .attr("x1", basePoint.x + dx)
        .attr("y1", basePoint.y + dy)
        .attr("x2", yAxisPoint.x + dx)
        .attr("y2", yAxisPoint.y + dy)
        .attr("stroke", "#555");

    // Aqui são círculos marcadores que aparecem nos eixos e o ponto base.
    // Ponto Base.
    projectionsGroup.append("circle")
        .attr("class", "projection-point active")
        .attr("cx", basePoint.x + dx)
        .attr("cy", basePoint.y + dy)
        .attr("r", 3.5)
        .attr("fill", "#333");

    // Eixo x.
    projectionsGroup.append("circle")
        .attr("class", "projection-point active")
        .attr("cx", xAxisPoint.x + dx)
        .attr("cy", xAxisPoint.y + dy)
        .attr("r", 3.5)
        .attr("fill", "#e14747");

    // Eixo y.
    projectionsGroup.append("circle")
        .attr("class", "projection-point active")
        .attr("cx", yAxisPoint.x + dx)
        .attr("cy", yAxisPoint.y + dy)
        .attr("r", 3.5)
        .attr("fill", "#e14747");

    // Eixo z.
    projectionsGroup.append("circle")
        .attr("class", "projection-point active")
        .attr("cx", zAxisPoint.x + dx)
        .attr("cy", zAxisPoint.y + dy)
        .attr("r", 3.5)
        .attr("fill", "#e14747");
}

// Função auxiliar.
function clearProjectionLines() {
    projectionsGroup.selectAll("*").remove();
}

// 13. Desenho dos Pontos.
function drawPoints(dx = 0, dy = 0) {
    // Itera sobre os dados projetando as normalizações na tela e retorna o array gerado junto dos offsets.
    const processedData = dados.map(d => {
        const projected = project3D(
            normX(d.x),
            normY(d.y),
            normZ(d.z)
        );
        return {
            ...d,
            px: projected.x + dx,
            py: projected.y + dy,
            pz: projected.z
        };
    });
    
    /* 
        * Algoritmo do Pintor: Ordena os pontos do mais distante para o mais próximo.
        * pz = profundidade Z projetada.
        * a.pz - b.pz: se negativo, a vem antes (mais longe); se positivo, b vem antes.
        * Cria ilusão de profundidade 3D.
    */
    processedData.sort((a, b) => a.pz - b.pz);

    // Cria um identificador único para cada ponto
    const dots = pointsGroup.selectAll(".dot")
        .data(processedData, d => `${d.x}-${d.y}-${d.z}`);

    // Remove círculos sem dados correpondentes.
    dots.exit().remove();

    // Criação dos círculos para os pontos.
    const dotsEnter = dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 3.5);

    // Interação com o ponto: Tooltip, mudança de cor do ponto e linhas/pontos projetados.
    dots.merge(dotsEnter)
        .attr("cx", d => d.px)
        .attr("cy", d => d.py)
        .on("mouseover", function(event, d) {
            // Mudar o tamanho do ponto.
            d3.select(this).attr("r", 4.5);
            // Projetar as linhas.
            createProjectionLines(d, dx, dy);
            // Legenda Tooltip.
            tooltip
                .style("opacity", 1)
                .html(`(${d.x}, ${d.y}, ${d.z})`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        // Retornar ao normal.
        .on("mouseout", function() {
            d3.select(this).attr("r", 3.5);
            clearProjectionLines();
            tooltip.style("opacity", 0);
        });
}

// 14. Atualização geral.
function update() {
    // Recalcula as escalas baseado nos dados atuais.
    scales = getNormalizationScales();
    normX = scales.normX;
    normY = scales.normY;
    normZ = scales.normZ;

    const projectedData = dados.map(d => {
        const projected = project3D(
            normX(d.x),
            normY(d.y),
            normZ(d.z)
        );
        return {
            px: projected.x,
            py: projected.y
        };
    });

    const { dx, dy } = computeCenterOffset(projectedData);

    drawGrid(dx, dy);
    drawAxes(dx, dy);
    drawPoints(dx, dy);
}

// 15. Controles de Rotação.

d3.select("#rotX").on("input", function() { // Lê o valor do controle.
    angleX = +this.value * Math.PI / 180; // Atualiza variáveis.
    d3.select("#rotXVal").text(this.value + "°");
    update(); // Redesenha gráfico.
});

d3.select("#rotZ").on("input", function() {
    angleZ = +this.value * Math.PI / 180;
    d3.select("#rotZVal").text(this.value + "°");
    update();
});

d3.select("#zoom").on("input", function() {
    scale = +this.value / 100;
    d3.select("#zoomVal").text(this.value + "%");
    update();
});

// Desenho Inicial.
update();
