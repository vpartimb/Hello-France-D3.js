let dataset = [];

var margin = {top: 20, right: 20, bottom: 60, left: 70},
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;


// Creates SVG element
let svg = d3.select("#map")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");;

// Loads data
d3.tsv("data/france.tsv")
    .row( (d, i) => {
        return {
            postalCode: +d["Postal Code"],
            inseeCode: +d.inseecode,
            place: d.place,
            longitude: +d.x,
            latitude: +d.y,
            population: +d.population,
            density: +d.density
        };
    })
    .get( (error, rows) => {
        console.log("Loaded " + rows.length + " rows");
        if (rows.length > 0) {
            console.log("First row: ", rows[0]);
            console.log("Last row: ", rows[rows.length-1]);
            x = d3.scaleLinear()
                .domain(d3.extent(rows, (row) => row.longitude))
                .range([0, width]);
            y = d3.scaleLinear()
                .domain(d3.extent(rows, (row) => row.latitude))
                .range([height, 0]);
            dataset = rows;
            draw('default');
        }
    });

function draw(mapType) {

    // Default Map w/o Coloring
    if (mapType == 'default') {
        svg.selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
                .attr("r", 1)
                .attr("cx", (d) => x(d.longitude))
                .attr("cy", (d) => y(d.latitude))
                .style("fill", "#d3d3d3")
            .on("mouseover", function(d){
                    d3.select("#postalCode").text(d.postalCode)
                    d3.select("#place").text(d.place)
                    d3.select("#population").text(d.population)
                    d3.select("#density").text(d.density)
                    d3.select(this)
                        .attr("r", 5)
                        .style("stroke", "black")
                        .style("fill", "lightblue")
                        .style("opacity", 1)
            })
            .on("mouseout", function(d){
                d3.select(this)
                  .attr("r", 1)
                  .style("fill", "#d3d3d3")
                  .style("stroke", "#d3d3d3")
            });
    }

    // Density Dot Map
    if (mapType == 'density') {
        var colorScale = d3.scaleSequential()
                            .domain([0, 300])
                            .interpolator(d3.interpolateInferno);

        svg.selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
                .attr("r", 1)
                .attr("cx", (d) => x(d.longitude))
                .attr("cy", (d) => y(d.latitude))
                .style("fill", (d) => colorScale(d.density))
            .on("mouseover", function(d){
                    d3.select("#postalCode").text(d.postalCode)
                    d3.select("#place").text(d.place)
                    d3.select("#population").text(d.population)
                    d3.select("#density").text(d.density)
                    d3.select(this)
                        .attr("r", 5)
                        .style("stroke", "black")
                        .style("fill", "lightblue")
                        .style("opacity", 1)
            })
            .on("mouseout", function(d){
                d3.select(this)
                  .attr("r", 1)
                  .style("fill", (d) => colorScale(d.density))
            });

        // Legend
        const defs = svg.append("defs");

        var xScale = d3.scaleLinear()
                    .domain([0, 300])
                    .range([0, width / 2]);   
  
        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");
        
        linearGradient.selectAll("stop")
                        .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
                        .enter()
                        .append("stop")
                        .attr("offset", d => d.offset)
                        .attr("stop-color", d => d.color);

        var legend = svg.append("g")
                            .attr("class", "legend-dens")
                            .attr("transform", "translate(" + (margin.left) + "," + (height - 2*margin.top) + ")")
                            .selectAll("g")
                                .data(d3.range(150), function(d) { return d; })
                                .enter()
                                .append("g");
                                
        legend.append("rect")
                    .attr('width', width / 2)
                    .attr('height', 10)
                    .attr('fill', "url(#linear-gradient)");

        legend.append("text")
                    .attr("x", 0)
                    .attr("y", 30)
                    .text("People per square km");

        var ticks = [0, 100, 200, 300];
        var tickLabels = ['0', '100', '200', '300+'];

        legend.append("g")
                    .call(d3.axisTop(xScale)
                            .tickValues(ticks)
                            .tickFormat((d,i) => tickLabels[i])
                            .ticks(5));     
    }

    // Population Bubble Map inspired by Mike Bostock (https://bost.ocks.org/mike/bubble-map/)
    if (mapType == 'population') {
        var radius = d3.scaleSqrt()
                        .domain([0, d3.max(dataset, d => d.population)])
                        .range([0, 30]);

        svg.selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
                .attr("r", (d) => radius(d.population))
                .attr("cx", (d) => x(d.longitude))
                .attr("cy", (d) => y(d.latitude))
                .attr("class", "bubble")
            .on("mouseover", function(d){
                    d3.select("#postalCode").text(d.postalCode)
                    d3.select("#place").text(d.place)
                    d3.select("#population").text(d.population)
                    d3.select("#density").text(d.density)
                    d3.select(this)
                        .style("fill", "#864242")
                        .style("fill-opacity", 1)
            })
            .on("mouseout", function(d){
                d3.select(this)
                    .style("stroke", "#0000")
                    .style("fill", "#d3d3d3")
                    .style("fill-opacity", .5)
                    .style("stroke-width", .5)
            });

        // Legend
        var legend = svg.append("g")
                        .attr("class", "legend-pop")
                        .attr("transform", "translate(" + (width - margin.left) + "," + (height - margin.top) + ")")
                        .selectAll("g")
                            .data([1e6, 2e6, 3e6])
                            .enter()
                            .append("g");

        legend.append("circle")
                .attr("cy", function(d) { return -radius(d); })
                .attr("r", radius);

        legend.append("text")
                .attr("y", function(d) { return -2 * radius(d); })
                .attr("dy", "1.3em")
                .text(d3.format(".1s"));
    }
    
    // X axis
    var xAxis = svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0, " + height + ")")
        .call(d3.axisBottom(x));

    // X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + 25)
        .attr("class", "text-legend")
        .text("Longitude");

    // Y axis
    var yAxis = svg.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y));

    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -margin.top)
        .attr("class", "text-legend")
        .text("Latitude");
}

// Redraws the map when buttons are clicked
function redraw(mapType) {
    d3.select("#map")
        .selectAll("circle")
            .remove();

    d3.select("g")
        .selectAll("*")
        .remove();

    draw(mapType);
}