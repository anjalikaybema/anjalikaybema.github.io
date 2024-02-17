class LogosVis {

    constructor(_parentElement, _data, _teamAbbr) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.teams = _teamAbbr;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

        // vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        // vis.height = 300 - vis.margin.top - vis.margin.bottom;
        // vis.width = vis.parentElement.getBoundingClientRect().width
        vis.width = 100
        // vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height;
        vis.height = 1000;
        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.wrangleData();
    }
    updateVis() {
        let vis = this;

        let logoWidth = 50;
        let sidebarWidth = vis.width;
        let xPosition = (sidebarWidth - logoWidth) / 2 - 25; // Calculating center position -25 for middle of img

        vis.teams.forEach(function(teamAbbr, index) {
            let yPosition = index * (logoWidth + 10);

            // Append a circle for the hover effect
            vis.svg.append("circle")
                .attr("cx", xPosition + logoWidth / 2)
                .attr("cy", yPosition + logoWidth / 2)
                .attr("r", logoWidth / 2)
                .style("fill", "transparent")
                .style("cursor", "pointer");

            // Append the logo image
            let image = vis.svg.append("image")
                .attr("xlink:href", "data/logosWeb/" + teamAbbr + ".webp")
                .attr("x", xPosition)
                .attr("y", yPosition)
                .attr("width", logoWidth)
                .attr("height", logoWidth);

            // Printing the team abbreviation on click
            image.on("click", function() {
                console.log(teamAbbr);

                clickedTeam = teamAbbr;

                handleLogoClick(teamAbbr);
            });
        });
    }



    wrangleData() {
        let vis = this;
        //
        // // adding the winner and loser of the games as a variable per game
        // vis.data.forEach(function(game) {
        //     let homeScore = parseInt(game.homeFinalScore, 10);
        //     let visitorScore = parseInt(game.visitorFinalScore, 10);
        //
        //     if (homeScore > visitorScore) {
        //         game.winner = game.homeTeamAbbr;
        //         game.loser = game.visitorTeamAbbr;
        //     } else if (visitorScore > homeScore) {
        //         game.winner = game.visitorTeamAbbr;
        //         game.loser = game.homeTeamAbbr;
        //     } else {
        //         game.winner = 'Tie';
        //         game.loser = 'Tie';
        //     }
        // });
        vis.updateVis();
    }
}