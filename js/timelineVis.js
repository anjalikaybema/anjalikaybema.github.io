class TimelineVis {
    constructor(_parentElement, _data, _teamAbbr) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.teams = _teamAbbr;
        this.filteredData = this.data;

        this.selectedCircle = null;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 40, right: 40, bottom: 60, left: 60 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 200 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + 0 + ")");
        
         // Scales and Axes
        vis.x = d3.scalePoint()
        .range([0, vis.width])
        .domain(d3.range(7)); // for 7 evenly spaced points

        vis.xAxis = d3.axisBottom(vis.x);

        // Append x-axis to the SVG
        vis.svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + vis.height + ")");

        // Line generator for the timeline
        vis.line = d3.line()
        .x(d => vis.x(d))
        .y(vis.height / 2); // since all points are centered vertically

         // Default to the first row of the CSV
        let defaultHeader = vis.data[0].header;
        let defaultText = vis.data[0].text;

        console.log(defaultText)
        
        // Default image
        let defaultImage = "data/Timeline_Img/pic_0.jpeg"; // Adjust the path as necessary

        // Update the text box
        d3.select("#timelineText").html(`<h3>${defaultHeader}</h3><p>${defaultText}</p>`);

        // Update the image
        d3.select("#timelineImage").html(`<img src='${defaultImage}' alt='Timeline Image' style='width:100%;'>`);

        vis.wrangleData();
        
    }
    updateVis() {
        let vis = this;

        // Draw the line connecting the points
        vis.svg.append("path")
        .datum(d3.range(6)) // the same data for your points
        .attr("class", "timeline-line")
        .attr("d", vis.line)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

        // Draw points on the timeline
        vis.points = vis.svg.selectAll(".timeline-point")
        .data(d3.range(6)) // 6 points
        .enter().append("circle")
        .attr("class", "timeline-point")
        .attr("cx", d => vis.x(d))
        .attr("cy", vis.height / 2)
        .attr("r", 10)
        .attr("fill", '#9da6b6');

         // Add text label for '1869' at the left edge
        vis.svg.append("text")
        .attr("x", - 20) // position at the start of the x-axis
        .attr("y", vis.height - vis.margin.bottom - 5) // position below the x-axis
        .attr("text-anchor", "start") // align text to the start
        .text("1869")
            .style("fill", "white");

        // Add text label for 'Present' at the right edge
        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right*4 + 27) // position at the end of the x-axis
            .attr("y", vis.height - vis.margin.bottom - 5) // position below the x-axis
            .attr("text-anchor", "end") // align text to the end
            .text("Present")
            .style("fill", "white");

            vis.points.on("click", function(event, d) {
                // If there is a previously selected circle, reset its color
                if (vis.selectedCircle) {
                    vis.selectedCircle.attr("fill", '#9da6b6');

                    // Scroll to timeline section
                    document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
                }

                // Change the color of the newly selected circle and update selectedCircle
                let currentCircle = d3.select(this);
                currentCircle.attr("fill", '#828c23');
                vis.selectedCircle = currentCircle;

                let selectedData = vis.data[d + 1];
                let imageUrl = "data/Timeline_Img/pic_" + (d +1) + ".jpeg"; // Construct the image path
                let textContent = selectedData.text;
                let headerContent = selectedData.header;
        
                // Update the image
                d3.select("#timelineImage").html(`<img src='${imageUrl}' alt='Timeline Image' style='width:100%;'>`);
        
                // Update the text
                d3.select("#timelineText").html(`<h3 data-aos="fade-right">${headerContent}</h3><p data-aos="fade-right">${textContent}</p>`);
            });

    }

    wrangleData() {
        let vis = this;
        
        vis.updateVis();
    }
}

