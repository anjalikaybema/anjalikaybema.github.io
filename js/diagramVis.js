class DiagramVis {
    constructor(_parentElement, _data, _teamAbbr) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.teams = _teamAbbr;
        this.filteredData = this.data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 0, bottom: 100, left: 140};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height + 600;
        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Adding tooltip here
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.wrangleData();
    }
    highlightTeam(teamAbbr) {
        let vis = this;
        console.log('fired')
        vis.highlightLines(teamAbbr)
        // vis.updateVis();
    }

    updateVis() {
        let vis = this;

        const logoRadius = 25;
        const circleRadius = 300;
        const center = {
            x: (vis.width - circleRadius) / 2 + 90,
            y: (vis.height - circleRadius)
        };


        // Function to calculate the position of each logo on the circle
        function getLogoPosition(index, total) {
            let angle = (index / total) * 2 * Math.PI; // Angle for the circular position
            return {
                x: center.x + circleRadius * Math.cos(angle) - logoRadius,
                y: center.y + circleRadius * Math.sin(angle) - logoRadius,
                angle: angle
            };
        }

        // Draw connections first so they appear under the logos
        vis.data.forEach(function(game) {
            // Find the positions of the two teams
            let teamAIndex = vis.teams.indexOf(game.homeTeamAbbr);
            let teamBIndex = vis.teams.indexOf(game.visitorTeamAbbr);
            let teamAPos = getLogoPosition(teamAIndex, vis.teams.length);
            let teamBPos = getLogoPosition(teamBIndex, vis.teams.length);

            // Draw a line between the logos
            vis.svg.append("line")
                .attr("x1", teamAPos.x + logoRadius)
                .attr("y1", teamAPos.y + logoRadius)
                .attr("x2", teamBPos.x + logoRadius)
                .attr("y2", teamBPos.y + logoRadius)
                .attr('class', game.homeTeamAbbr + ' ' + game.visitorTeamAbbr + ' ' + 'lineGame')
                .style("stroke", "white")
                .style("stroke-width", 2);
        });

        // Draw the logos in a circle
        vis.teams.forEach(function(teamAbbr, index) {
            let position = getLogoPosition(index, vis.teams.length);

            // Append a circle for the hover effect
            vis.svg.append("circle")
                .attr("cx", position.x + logoRadius)
                .attr("cy", position.y + logoRadius)
                .attr("r", logoRadius)
                .style("fill", "transparent")
                .style("cursor", "pointer");

            // Append the logo image
            let image = vis.svg.append("image")
                .attr("xlink:href", "data/logosWeb/" + teamAbbr + ".webp")
                .attr("x", position.x)
                .attr("y", position.y)
                .attr("width", logoRadius * 2)
                .attr("height", logoRadius * 2)
                .on("mouseover", function(event, d) {
                    // Reset the line colors from the selected at the top
                    vis.highlightLines(teamAbbr);
                    // OLD IMPLEMENTATION
                    // Determine if the Logo is on the right or left side of the circle as well as top or bottom
                    // let onRightSide = position.x + logoRadius > vis.width / 2;
                    // let onBottomSide = position.y + logoRadius > vis.width /2;

                    // // Position the tooltip on the left or right of the logo
                    // let tooltipX = onRightSide ? event.pageX + 50 : event.pageX - 100;
                    // let tooltipY = onBottomSide ? event.pageY + 50: event.pageY - 25;


                    // Set tooltip content
                    vis.tooltip.html(`
                         <h4>
                             <strong class="tooltip-title">${teamAbbr}</strong><br>
                         </h4>`);

                    // Calculate tooltip dimensions
                    let tooltipRect = vis.tooltip.node().getBoundingClientRect();
                    let tooltipWidth = tooltipRect.width;
                    let tooltipHeight = tooltipRect.height;

                    // Used to be 70, just testing having the tooltipwidth/3 for now
                    let baseOffset = tooltipWidth/3; // Base offset distance
                    let angleOffsetFactor = Math.abs(Math.cos(position.angle)); // Factor based on angle
                    let dynamicOffset = baseOffset * (1 + angleOffsetFactor); // Dynamic offset

                    let offset_x = dynamicOffset * Math.cos(position.angle);
                    let offset_y = dynamicOffset * Math.sin(position.angle);

                    let tooltipX = event.pageX + offset_x - tooltipWidth / 2;
                    let tooltipY = event.pageY + offset_y - tooltipHeight / 2;

                    // Show tooltip
                    vis.tooltip
                        .style("left", tooltipX + "px")
                        .style("top", tooltipY + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", .9)

                })
                .on("mouseout", function() {
                    vis.tooltip
                        . style("opacity", 0)
                    let selectedLines = d3.selectAll("." + teamAbbr);
                    selectedLines.each(function() {
                        let line = d3.select(this);
                        line.style("stroke", "white");
                    });
                })
        });
    }

    // Helper function to highlight lines
    highlightLines(teamAbbr) {
        let vis = this;
        let selectedLines = d3.selectAll(".lineGame")
        selectedLines.each(function() {
            let line = d3.select(this);
            line.style('stroke', 'white')
        });

        selectedLines = d3.selectAll("." + teamAbbr);
        selectedLines.each(function() {
            let line = d3.select(this);

            let lineClasses = line.attr('class').split(' ');
            if (lineClasses.length === 3) {
                let otherTeamAbbr = lineClasses[0] === teamAbbr ? lineClasses[1] : lineClasses[0];
                // Find the game for the line
                let game = vis.data.find(g => (g.homeTeamAbbr === teamAbbr || g.visitorTeamAbbr === teamAbbr) &&
                    (g.homeTeamAbbr === otherTeamAbbr || g.visitorTeamAbbr === otherTeamAbbr));

                // Check if teamAbbr is the winner or loser and change line color
                if (game.winner === teamAbbr) {
                    line.style("stroke", "#7dff13");
                } else if (game.loser === teamAbbr) {
                    line.style("stroke", "#f56a4b");
                }
            }
            else {
                // here you could style all other lines on the vis that have the class attribute .TeamAbbr .lineGame
                line.style('stroke', 'red')
            }

        });
    }
    wrangleData() {
        let vis = this;

        // adding the winner and loser of the games as a variable per game
        vis.data.forEach(function(game) {
            let homeScore = parseInt(game.homeFinalScore, 10);
            let visitorScore = parseInt(game.visitorFinalScore, 10);

            if (homeScore > visitorScore) {
                game.winner = game.homeTeamAbbr;
                game.loser = game.visitorTeamAbbr;
            } else if (visitorScore > homeScore) {
                game.winner = game.visitorTeamAbbr;
                game.loser = game.homeTeamAbbr;
            } else {
                game.winner = 'Tie';
                game.loser = 'Tie';
            }
        });

        storeGames = vis.data;

        vis.updateVis();
    }
}