class OffensiveVis {
    constructor(_parentElement, _data, _tackles, _teamAbbr) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.tackles = _tackles;
        this.teams = _teamAbbr;
        this.filteredData = this.data;


        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 130, right: 50, bottom: 200, left: -50};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;

        vis.height = 300

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.circlesGroup = vis.svg.append("g")
            .attr("class", "circles")
            .attr("transform", "translate(0, 60)")

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Map the teams to their respective region
        const teamRegionMapping = {
            'LA': 'West',
            'NYG': 'East',
            'CAR': 'South',
            'PHI': 'East',
            'WAS': 'East',
            'BUF': 'East',
            'SEA': 'West',
            'SF': 'West',
            'ATL': 'South',
            'NO': 'South',
            'PIT': 'North',
            'NYJ': 'East',
            'HOU': 'South',
            'ARI': 'West',
            'GB': 'North',
            'CLE': 'North',
            'CHI': 'North',
            'LV': 'West',
            'MIA': 'East',
            'CIN': 'North',
            'TB': 'South',
            'IND': 'South',
            'BAL': 'North',
            'MIN': 'North',
            'LAC': 'West',
            'DAL': 'East',
            'TEN': 'South',
            'DET': 'North',
            'JAX': 'South',
            'KC': 'West',
            'NE': 'East',
            'DEN': 'West',
        };

        vis.displayData = [];

        let teamDataMap = new Map();

        vis.data.forEach((d) => {
            let possessionTeam = d.possessionTeam;

            // Init teamData if it doesn't exist in the map
            if (!teamDataMap.has(possessionTeam)) {
                teamDataMap.set(possessionTeam, {
                    completedPasses: 0,
                    allPasses: 0,
                });
            }

            // Update teamData based on current obs
            let teamData = teamDataMap.get(possessionTeam);
            teamData.allPasses += 1;

            if (d.passResult === "C") {
                teamData.completedPasses += 1;
            }
        });

        teamDataMap.forEach((teamData, possessionTeam) => {
            let passingAccuracy = teamData.completedPasses / teamData.allPasses;

            let region = teamRegionMapping[possessionTeam];

            // Push into displayData
            vis.displayData.push({
                name: possessionTeam,
                group: "Team",
                team: possessionTeam,
                passingAccuracy: passingAccuracy * 100,

                // Want bubble size to be a function of the statistic, but need the actual stat too for tooltip display
                size: passingAccuracy * 70,
                region: region,
            });
        });

        vis.displayDataDefense = [];

        let teamTackleMap = new Map();

        let defensiveTeam;

        // Iterate through tacklesData, cross ref play ids
        vis.tackles.forEach((tackle) => {
            let playId = tackle.playId;

            let play = vis.data.find((play) => play.playId === playId);

            if (play) {
                defensiveTeam = play.defensiveTeam;

                // Init teamTackleData if doesn't exist in map
                if (!teamTackleMap.has(defensiveTeam)) {
                    teamTackleMap.set(defensiveTeam, {
                        totalTackles: 0,
                        totalMissedTackles: 0,
                    });
                }

                let teamTackleData = teamTackleMap.get(defensiveTeam);
                teamTackleData.totalTackles += parseInt(tackle.tackle);
                teamTackleData.totalMissedTackles += parseInt(tackle.pff_missedTackle);

                teamTackleMap.set(defensiveTeam, teamTackleData);
            }
        });

        teamTackleMap.forEach((teamTackleData, team) => {
            let tackleAccuracy = teamTackleData.totalTackles / ( teamTackleData.totalTackles + teamTackleData.totalMissedTackles);

            let region = teamRegionMapping[team];

            // Push to the defensive vis display data
            vis.displayDataDefense.push({
                name: team,
                group: "Team",
                team: team,
                tackleAccuracy : tackleAccuracy,
                size: (tackleAccuracy - 0.5) * 100,
                region: region,
            });
        });

        // Storing this globally to be used in overall stats
        storeDefenseData = vis.displayDataDefense;
        storeOffenseData = vis.displayData;

        // Make sure both views are loaded initially
        vis.updateDefensiveVisualization();
        vis.updateVis();

    }




    updateVis() {
        let vis = this;

        vis.svg.selectAll(".small-circle").remove();

        let teams = Array.from(new Set(vis.data.map(d => d.team)));

        // Force simulation to bring circles together
        vis.simulation = d3.forceSimulation(vis.displayData)
            .force("x", d3.forceX(vis.width / 2).strength(0.1))
            .force("y", d3.forceY(vis.height / 2).strength(0.1))
            .force("collide", d3.forceCollide().radius(d => d.size + 1).strength(1))
            .on("tick", function () {
                vis.svg.selectAll(".small-circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        const smallCircles = vis.svg.selectAll(".small-circle")
            .data(vis.displayData)
            .enter().append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.size)
            .attr("fill", d => colorScale(d.team))
            .attr("stroke", d => (d.team === clickedTeam) ? "white" : null)
            .attr("class", "small-circle")
            .attr("stroke-width", 4)
            .on("mouseover", function (event, d) {

                // White fill and tooltip on mouseover, revert after
                d3.select(this)
                    .attr("fill", "white");

                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                vis.tooltip.html(`<h3>${d.team}<br><img src="data/logosWeb/${d.team}.webp" width="50" height="50" alt="${d.team} logo"><br>Passing Accuracy: ${Math.round(d.passingAccuracy)}%</h3>`)
                    .style("left", (event.pageX + 100) + "px")
                    .style("top", (event.pageY + 50) + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("fill", d => colorScale(d.team));

                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        function updateSimulationForRegion(region) {

            // Define forceX for each region
            let forceXRegion = d3.forceX(function (d) {
                switch (d.region) {
                    case 'South':
                        return (vis.width / 4) - 50;
                    case 'North':
                        return (vis.width / 4 * 2 ) - 50;
                    case 'East':
                        return (vis.width / 4 * 3) - 50;
                    case 'West':
                        return (vis.width / 4 * 4) - 50;
                }
            }).strength(0.5);

            vis.simulation
                .force('x', forceXRegion)
                .alphaTarget(0.05)
                .restart();
        }

        // When the buttons are clicked update the vis accordingly (split by region or regular combined view)
        d3.select('#regionButton').on('click', function () {
            updateSimulationForRegion();
        });

        d3.select('#combineButton').on('click', function () {
            vis.simulation
                .force('x', d3.forceX(vis.width / 2).strength(0.1))
                .force('y', d3.forceY(vis.height / 2).strength(0.1))
                .alphaTarget(0.01)
                .restart();
        });

        vis.simulation.nodes(vis.displayData);
        vis.simulation.alpha(0.5).restart();
    }



    updateDefensiveVisualization() {
        let vis = this;

        vis.svg.selectAll(".small-circle").remove();

        let teams = Array.from(new Set(vis.data.map(d => d.team)));

        vis.svg.selectAll(".small-circle").remove();

        // Same logic/functionality as in the offensive view function
        vis.simulation = d3.forceSimulation(vis.displayDataDefense)
            .force("x", d3.forceX(vis.width / 2).strength(0.1))
            .force("y", d3.forceY(vis.height / 2).strength(0.1))
            .force("collide", d3.forceCollide().radius(d => d.size + 1).strength(1))
            .on("tick", function () {
                vis.svg.selectAll(".small-circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        const smallCircles = vis.svg.selectAll(".small-circle")
            .data(vis.displayDataDefense)
            .enter().append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.size)
            .attr("fill", d => colorScale(d.team))
            .attr("stroke", d => (d.team === clickedTeam) ? "white" : null)
            .attr("class", "small-circle")
            .attr("stroke-width", 4)
            .on("mouseover", function (event, d) {

                d3.select(this)
                    .attr("fill", "white");

                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                vis.tooltip.html(`<h3>${d.team}<br><img src="data/logosWeb/${d.team}.webp" width="50" height="50" alt="${d.team} logo"><br> Tackle Accuracy: ${Math.round(d.tackleAccuracy * 100)}%\</h3>`)
                    .style("left", (event.pageX + 100) + "px")
                    .style("top", (event.pageY + 50) + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("fill", d => colorScale(d.team));

                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        // Again same idea here
        function updateSimulationForRegion2(region) {

            let forceXRegion = d3.forceX(function (d) {
                switch (d.region) {
                    case 'South':
                        return (vis.width / 4) - 50;
                    case 'North':
                        return (vis.width / 4 * 2 ) - 50;
                    case 'East':
                        return (vis.width / 4 * 3) - 50;
                    case 'West':
                        return (vis.width / 4 * 4) - 50;
                }
            }).strength(0.5);

            vis.simulation
                .force('x', forceXRegion)
                .alphaTarget(0.05)
                .restart();
        }

        d3.select('#regionButton').on('click', function () {
            updateSimulationForRegion2();
        });

        d3.select('#combineButton').on('click', function () {
            vis.simulation
                .force('x', d3.forceX(vis.width / 2).strength(0.1))
                .force('y', d3.forceY(vis.height / 2).strength(0.1))
                .alphaTarget(0.01)
                .restart();
        });

        vis.simulation.nodes(vis.displayDataDefense);
        vis.simulation.alpha(0.5).restart();
    }

}
