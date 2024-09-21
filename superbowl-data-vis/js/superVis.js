class SuperVis {

    constructor(_parentElement, _data, _teamAbbr, _plays, _testPlay) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.teams = _teamAbbr;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 60, right: 40, bottom: 80, left: 60 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 500 + vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + 30 + ")");

        // Scales and axes
        vis.x = d3.scaleBand()
        .rangeRound([0, vis.width])
        .padding(0.1);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.x);
        vis.yAxis = d3.axisLeft(vis.y).tickFormat(d3.format("d"))  // Format ticks as whole numbers;
        .ticks(5);

        // Append x and y axis groups
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .style("stroke", "white");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .style("stroke", "white");

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);

        // Append y-axis title
        vis.svg.append("text")
        .attr("class", "axis-title") // Optional: for styling
        .attr("transform", "rotate(-90)") // Rotate the text for vertical orientation
        .attr("y", 0 - vis.margin.left) // Position to the left of the y-axis
        .attr("x", 0 - (vis.height / 2)) // Center along the y-axis
        .attr("dy", "1em") // Adjust distance from the axis
        .style("text-anchor", "middle") // Center the text
        .text("Number of Super Bowl Wins")
            .style("fill", "white"); // The title text

        d3.select("#performanceSelector").on("change", function(event) {
            let selectedValue = d3.select(this).property("value");
            vis.filterData(selectedValue, event);
        });

        vis.wrangleData();
        
    }
    updateVis() {
        let vis = this;

        // Update scales
        vis.x.domain(vis.dataArray.map(d => d.team));
        vis.y.domain([0, d3.max(vis.dataArray, d => d.wins)]);

        // Bind data to bars
        let bars = vis.svg.selectAll(".bar")
        .data(vis.dataArray);


        // Enter
        bars.enter().append("rect")
            .attr("class", "bar")
            .merge(bars)
            .attr("x", d => vis.x(d.team))
            .attr("y", d => vis.y(d.wins))
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d.wins))
            .attr("fill", d => colorScale(d.team))
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "white"); // Change color on hover
                vis.tooltip.html(`<h3>${d.team}<br><img src="data/logosWeb/${d.team}.webp" width="50" height="50" alt="${d.team} logo"></h3>`)
                    .style("left", (event.pageX + 100) + "px")
                    .style("top", (event.pageY - 100) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("fill", ""); // Revert to original color on mouseout
            });

        // Exit
        bars.exit().remove();

        // Update the axes
        vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("line, path")
            .style("stroke", "white");
        vis.svg.select(".y-axis").call(vis.yAxis)
            .selectAll("line, path")
            .style("stroke", "white");

    }

    wrangleData() {
        let vis = this;

        // Count the number of wins for each team
        vis.winCounts = {};
        vis.data.forEach(d => {
            let teamName = d.Winner.split(" ").pop(); // Use only the last word of the team name
            vis.winCounts[teamName] = (vis.winCounts[teamName] || 0) + 1;
        });

        // Filter out teams with zero wins
        vis.dataArray = Object.keys(vis.winCounts).filter(team => vis.winCounts[team] > 0)
                     .map(team => ({ team: team, wins: vis.winCounts[team] }))
                     .sort((a, b) => b.wins - a.wins); // Sort in descending order of wins

        // Map the teamnames to ensure the colorscale is consistent
        function mapTeams(team) {
            const teamMappings = {
                'Patriots': 'NE',
                'Steelers': 'PIT',
                'Cowboys': 'DAL',
                '49ers': 'SF',
                'Giants': 'NYG',
                'Packers': 'GB',
                'Broncos': 'DEN',
                'Redskins': 'WAS',
                'Raiders': 'LV',
                'Chiefs': 'KC',
                'Ravens': 'BAL',
                'Colts': 'IND',
                'Dolphins': 'MIA',
                'Eagles': 'PHI',
                'Seahawks': 'SEA',
                'Saints': 'NO',
                'Buccaneers': 'TB',
                'Rams': 'LA',
                'Bears': 'CHI',
                'Jets': 'NYJ',
            };

            return teamMappings[team] || team;
        }

        vis.dataArray = vis.dataArray.map(entry => ({
            team: mapTeams(entry.team),
            wins: entry.wins,
        }));

        vis.updateVis();
    }

    filterData(selectedValue, event) {
        let vis = this;
    
        let selectedGame;
        if (selectedValue === "bestOffensive") {
            // Game with the highest 'Winner Pts'
            selectedGame = vis.data.reduce((max, game) => (game['WinnerPts'] > max['WinnerPts'] ? game : max), vis.data[0]);
        } else if (selectedValue === "bestDefensive") {
            // Find the lowest 'Loser Pts'
            const minLoserPts = Math.min(...vis.data.map(game => game['LoserPts']));
            console.log(minLoserPts)
            console.log(vis.data)
            // Find the first game that matches this 'Loser Pts'
            selectedGame = vis.data.find(game => Number(game['LoserPts']) === minLoserPts);
            console.log(selectedGame)
        }
    
        // Update the tooltip only if a valid game was found
        if (selectedGame) {
            vis.updateTooltip(selectedGame, event);
        } else {
            console.error("No valid game found for selection");
        }

    }

    updateTooltip(game, event) {
        let vis = this;
    
        // Select the existing tooltip element
        let tooltip = d3.select("#tooltip");

        // Set the content and position of the tooltip
        tooltip.html(`<h5 style="font-size: 18px !important;"><strong>${game.Winner}</strong>: ${game['WinnerPts']} - ${game['LoserPts']}<br>Super Bowl: ${game.SB}<br>Date: ${game.Date}</h5>`)
           .style("left", (event.pageX + 10) + "px")
           .style("top", (event.pageY + 10) + "px")
           .style("opacity", 1);
    }

}
