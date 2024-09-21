
class WinsVis {
    constructor(_parentElement, _data, _teamAbbr) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.teams = _teamAbbr;
        this.filteredData = this.data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 50, bottom: 900, left: 50};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;

        vis.height = 300

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Init tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);


        vis.wrangleData();
    }

    wrangleData() {

        let vis = this;

        let pointsByTeamAndWeek = {};

        // Sum points scored by each team in each week
        vis.data.forEach(function(game) {
            let homeScore = parseInt(game.homeFinalScore, 10);
            let visitorScore = parseInt(game.visitorFinalScore, 10);

            if (!pointsByTeamAndWeek[game.week]) {
                pointsByTeamAndWeek[game.week] = {};
            }

            if (!pointsByTeamAndWeek[game.week][game.homeTeamAbbr]) {
                pointsByTeamAndWeek[game.week][game.homeTeamAbbr] = homeScore;
            } else {
                pointsByTeamAndWeek[game.week][game.homeTeamAbbr] += homeScore;
            }

            if (!pointsByTeamAndWeek[game.week][game.visitorTeamAbbr]) {
                pointsByTeamAndWeek[game.week][game.visitorTeamAbbr] = visitorScore;
            } else {
                pointsByTeamAndWeek[game.week][game.visitorTeamAbbr] += visitorScore;
            }
        });


        vis.pointsByTeamAndWeek = pointsByTeamAndWeek;

        vis.updateVis();
    }

    updateVis(teamAbbr) {
        let vis = this;

        let dataForChart = [];
        let cumulativeData = {};

        // Convert to integers, sort
        let weeks = Object.keys(vis.pointsByTeamAndWeek).map(Number).sort((a, b) => a - b);

        weeks.forEach(function (week) {
            let teamsData = vis.pointsByTeamAndWeek[week];

            let teams = Object.keys(teamsData).sort();

            teams.forEach(function (team) {
                let points = teamsData[team];

                // Calc cumulative score
                cumulativeData[team] = (cumulativeData[team] || 0) + points;

                // Then push for current week
                dataForChart.push({week, team, points, cumulative: cumulativeData[team]});
            });
        });

        storePoints = dataForChart;



        // Scales, axes
        let yScale = d3.scaleLinear()
            .domain([0, d3.max(dataForChart, d => d.points)])
            .range([vis.height, 0]);

        xScale = d3.scaleLinear()
            .domain([1, Object.keys(vis.pointsByTeamAndWeek).length])
            .range([0, vis.width]);

        // Exclude null obs, and used the filtered set to compute the Yscale for the cumulative dataset
        let filteredDataForChart = dataForChart.filter(d => d.cumulative !== null);

        let cumulativeYScale = d3.scaleLinear()
            .domain([0, d3.max(filteredDataForChart, d => d.cumulative)])
            .range([vis.height * 2, 0]);

        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);
        let yAxisCumulative = d3.axisLeft(cumulativeYScale);

        // Line function for the first chart (non cumulative)
        let line = d3.line()
            .x(d => xScale(d.week))
            .y(d => yScale(d.points));

        // Clear existing
        vis.svg.selectAll("*").remove();

        // Axes for first chart
        vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(xAxis)
            .style("stroke", "white")
            .selectAll("line, path")
            .style("stroke", "white");

        vis.svg.append("g")
            .call(yAxis)
            .style("stroke", "white")
            .selectAll("line, path")
            .style("stroke", "white");

        // Make a line for each team and set color scale
        let teams = Array.from(new Set(dataForChart.map(d => d.team)));

        teams.forEach(function (team) {
            let teamData = dataForChart.filter(d => d.team === team);

            vis.svg.append("path")
                .datum(teamData)
                .attr("fill", "none")
                .attr("stroke", colorScale(team))
                .attr("stroke-width", 2)
                .attr("d", line)
                .attr("class", team + ' ' + 'lineGame')
                // Grey out initially
                .style("stroke", "white")
                .on("mouseover", function (event, d) {

                    // Hover style using colorscale
                    d3.select(this).style("stroke", colorScale(team));

                    vis.tooltip.html(`
             <h4>
                 <strong class="tooltip-title">${team}</strong><br>
                 <img src="data/logosWeb/${team}.webp" width="50" height="50" alt="${team} logo">
             </h4>`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", 0.9);
                })
                .on("mouseout", function () {

                    // Reset
                    if (team === clickedTeam) {
                        d3.select(this).style("stroke", "red");
                    }
                    else {
                        d3.select(this).style("stroke", "white");
                    }

                    vis.tooltip.transition().duration(200).style("opacity", 0);

                });
        });


        vis.svg.selectAll(".circle-game")
            .data(dataForChart)
            .enter().append("circle")
            .attr("cx", d => xScale(d.week))
            .attr("cy", d => yScale(d.points))
            .attr("r", 3)
            .attr("fill", d => colorScale(d.team))
            .attr("class", "circle-game")
            .style("opacity", 1)
            .style("stroke", "white")
            .on("mouseover", function (event, d) {
                d3.select(this).style("fill", "white");
                vis.tooltip.html(`
             <h4>
                 <strong class="tooltip-title">${d.team}</strong><br>
                 Week: ${d.week}<br>
                 Points: ${d.points}<br>
                 <img src="data/logosWeb/${d.team}.webp" width="50" height="50" alt="${d.team} logo">
             </h4>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function () {
                d3.select(this).style("fill", d => colorScale(d.team));
                vis.tooltip.transition().duration(200).style("opacity", 0);
            });


        // Line for cumulative chart (& make a new group)
        let cumulativeLine = d3.line()
            .x(d => xScale(d.week))
            .y(d => cumulativeYScale(d.cumulative));

        let cumulativeChartGroup = vis.svg.append("g")
            .attr("transform", "translate(0," + (vis.height + 200) + ")");

        // New axes
        cumulativeChartGroup.append("g")
            .attr("transform", "translate(0," + (vis.height * 2) + ")")
            .call(xAxis)
            .style("stroke", "white")
            .selectAll("line, path")
            .style("stroke", "white");

        cumulativeChartGroup.append("g")
            .call(yAxisCumulative)
            .style("stroke", "white")
            .selectAll("line, path")
            .style("stroke", "white");

        // Line for each team
        teams.forEach(function (team) {
            let teamData = dataForChart.filter(d => d.team === team);

            cumulativeChartGroup.append("path")
                .datum(teamData)
                .attr("fill", "none")
                .attr("stroke", colorScale(team))
                .attr("stroke-width", 2)
                .attr("d", cumulativeLine)
                .attr("class", team + ' ' + 'lineGame')

                // Same styling/hover functionality as the chart above
                .style("stroke", "white")
                .on("mouseover", function (event, d) {
                    d3.select(this).style("stroke", colorScale(team));
                    vis.tooltip.html(`
                 <h4>
                     <strong class="tooltip-title">${team}</strong><br>
                     <img src="data/logosWeb/${team}.webp" width="50" height="50" alt="${team} logo">
                 </h4>`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", 0.9);
                })
                .on("mouseout", function () {

                    // Reset and hide again on mouseout
                    if (team === clickedTeam) {
                        d3.select(this).style("stroke", "red");
                    }
                    else {
                        d3.select(this).style("stroke", "white");
                    }
                    vis.tooltip.transition().duration(200).style("opacity", 0);
                });
        });

        cumulativeChartGroup.selectAll(".circle-cumulative")
            .data(dataForChart)
            .enter().append("circle")
            .attr("cx", d => xScale(d.week))
            .attr("cy", d => cumulativeYScale(d.cumulative))
            .attr("r", 3)
            .attr("fill", d => colorScale(d.team))
            .attr("class", "circle-cumulative")
            .style("opacity", 1)
            .style("stroke", "white")
            .on("mouseover", function (event, d) {
                d3.select(this).style("fill", "white");
                vis.tooltip.html(`
             
             <h4>
             <strong>${d.team}</strong><br>
                 Week: ${d.week}<br>
                 Cumulative Points: ${d.cumulative}<br>
                 <img src="data/logosWeb/${d.team}.webp" width="50" height="50" alt="${d.team} logo">
             </h4>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", function () {
                d3.select(this).style("fill", d => colorScale(d.team));
                vis.tooltip.transition().duration(200).style("opacity", 0);
            });


        // Add labels to both charts and their respective axes
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("Points Scored Each Week, by Team");

        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "white")
            .text("Week");

        vis.svg.append("text")
            .attr("x", -10)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "white")
            .text("Points");

        cumulativeChartGroup.append("text")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("Cumulative Points Scored Each Week, by Team");

        cumulativeChartGroup.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height * 2 + vis.margin.top)
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "12px")
            .text("Week");

        cumulativeChartGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "white")
            .text("Cumulative Points");

    }


    highlightTeam(teamAbbr) {
        let vis = this;

        // Find cumulative points in w9, if 0 set to w8
        let weekDataW9 = storePoints.find(d => d.week === 9 && d.team === clickedTeam);
        let weekDataW8 = storePoints.find(d => d.week === 8 && d.team === clickedTeam);
        let cumulativePoints = weekDataW9 ? weekDataW9.cumulative : (weekDataW8 ? weekDataW8.cumulative : 0);


        // Count wins for display
        let winCount = 0;

        storeGames.forEach(function (game) {
            let winner = game.winner;

            if (winner === clickedTeam) {
                winCount++;
            }
        });

        // Find the data for the clickedTeam
        let defenseData = storeDefenseData.find(team => team.team === clickedTeam);
        let tackleAccuracy = defenseData ? defenseData.tackleAccuracy : 0;

        let offenseData = storeOffenseData.find(team => team.team === clickedTeam);
        let passingAccuracy = offenseData ? offenseData.passingAccuracy : 0;


        // Update the html elements. It was easier to just do this all in one place
        if (clickedTeam) {
            document.getElementById("cumulativePointsDisplay").innerHTML = `Cumulative Points: ${cumulativePoints}`;
            document.getElementById("cumulativePointsDisplay").style.opacity = 1;

            document.getElementById("winCountDisplay").innerHTML = `Games Won: ${winCount}`;
            document.getElementById("winCountDisplay").style.opacity = 1;

            document.getElementById("offenseStats").innerHTML = `Passing Accuracy: ${Math.round(passingAccuracy)}%`;
            document.getElementById("offenseStats").style.opacity = 1;

            document.getElementById("defenseStats").innerHTML = `Tackle Accuracy: ${Math.round(tackleAccuracy*100)}%`;
            document.getElementById("defenseStats").style.opacity = 1;

            document.getElementById("selectTeamMessage").style.opacity = 0;
        } else {
            document.getElementById("winCountDisplay").style.opacity = 0;
            document.getElementById("cumulativePointsDisplay").style.opacity = 0;
            document.getElementById("offenseStats").style.opacity = 0;
            document.getElementById("defenseStats").style.opacity = 0;

            document.getElementById("selectTeamMessage").style.opacity = 1;

        }

        let selectedLines = d3.selectAll(".lineGame")
        selectedLines.each(function () {
            let line = d3.select(this);
            line.style('stroke', 'white')
        });
        selectedLines = d3.selectAll("." + teamAbbr).each(function() {
            let line = d3.select(this);
            let lineClasses = line.attr('class').split(' ');
            if (lineClasses.length === 2) {
                line.style('stroke', 'red')
            }
        });

        // Display the selected team's logo in the middle of the page
        let logoDisplayContainer = d3.select(".logo-display");

        logoDisplayContainer.selectAll("img").remove();

        let logoImage = logoDisplayContainer.append("img")
            .attr("src", "data/logosWeb/" + teamAbbr + ".webp")
            .style("width", "50%")
            .style("height", "auto")
            .style("display", "block")
            .style("margin", "auto")
            .style("padding-top", "22vh");
    }

}
