/**
 * fullCharts _ version 1.0
 * ##################################################
 *   Created by vmaigne@gmail.com _ december 2014
 * ##################################################
 * This library creates some data visualization charts
 *
 */

// TODO :
//  - wait for file reading


// Parameters
var header;
var data;
var selectedColumnX = false;
var selectedColumnY = false;
var selectedChart = false;
var lastSelectedColumn = false;
var barCharMargin = {top: 10, right: 0, bottom: 75, left: 35};
var color = d3.scale.category20();
var toolTip;
var chartHeight = 250;
var chartWidth = 600;
var transitionDuration = 500;
var format = d3.time.format("%d/%m/%Y_%H:%M");


function readFile(fileName) {
    d3.csv(fileName, function (error, csv) {
        // Header columns
        header = d3.keys(csv[0]);
        $.each(header, function(i, d) {
            var element = $("<div></div>");
            element.attr("class", "columnName btn-default");
            element.attr("id", "column_" + i + "_" + $.trim(d));
            element.attr("title", d);
            element.html(d);
            $("#header").append(element);
        });

        // Bind click
        $(".columnName").on("click", function() {
            if (!selectedColumnX || "Y" == lastSelectedColumn || "bar" == selectedChart)
                selectColumn(this.title, "#selectedColumnX", "X");
            else
                selectColumn(this.title, "#selectedColumnY", "Y");
        });

        createDataHeader();

        // Data
        data = crossfilter(csv);
        var dimensionHeader = data.dimension(function(d) {
            return d;
        });

        createDataTable("#data-count", "#data-table", data, data.groupAll(), dimensionHeader);


        selectedColumnX = "Temps";
        selectedColumnY = "Bonbon";
        selectedChart = "timeSerie";
        createChart();
    });
}

function selectColumn(title, columnId, columnLetter) {
    if ("X" == columnLetter)
        selectedColumnX = title;
    else
        selectedColumnY = title;
    $(columnId).html(title);
    lastSelectedColumn = columnLetter;
}

/* ************************************** */
/* *************** CHARTS *************** */
/* ************************************** */
var valueIndexX, valueIndexY, xDomain, yDomain, isOrdinalX, isOrdinalY;

function createChart() {
    if (!selectedColumnX || !selectedChart)
        return;

    $("#chartContainer").empty();

    valueIndexX = header.indexOf(selectedColumnX);
    valueIndexY = header.indexOf(selectedColumnY);
    xDomain = new Array();
    yDomain = new Array();
    isOrdinalX = false;
    isOrdinalY = false;

    switch (selectedChart) {
        case "pie":
            console.log("create pie");
            createPieChart(dimension);
            break;
        case "timeSerie":
            console.log("create timeSerie");
            createTimeSerieChart();
            break;
        case "bar":
            console.log("create bar");
            createBarChart();
            break;
    }
}

function createPieChart() {
}

function createTimeSerieChart() {

    var dateArray = new Array();
    var timeDimension = data.dimension(
            function(d) {
                var value = d[header[valueIndexX]];
                dateArray.push(format.parse(value));
                return format.parse(value);
            });

    var timeDimensionGroup = timeDimension.group().reduceCount().filter(
            function(d) {
                console.log("ici : " + d.Bonbon);
                if ("Mikado" == d.Bonbon) {
                    console.log("ok");
                    return d;
                }
            });

//    var timeDimensionGroup = timeDimension.group().reduce(
//            function(p, v) {
//                if ("Mikado" == v.Bonbon)
//                    p.value += 1;
//                return p;
//            },
//            function(p, v) {
//                if ("Mikado" == v.Bonbon)
//                    p.value -= 1;
//                return p;
//            },
//            function() {
//                return { value : 0};
//            });

    // Date domain
    var sortedDateArray = dateArray.sort(function(a, b) {
        return a.getTime() - b.getTime();
    });
    var minDate = d3.time.hour.offset(sortedDateArray[0], -6);
    var maxDate = d3.time.hour.offset(sortedDateArray[sortedDateArray.length - 1], 6);

    dc.lineChart("#chartContainer")
            .width(chartWidth)
            .height(chartHeight)
            .margins(barCharMargin)
            .dimension(timeDimension)
            .group(timeDimensionGroup)
            .valueAccessor(function(d) {
        return d.value;
    })
            .transitionDuration(transitionDuration)
            .elasticY(true)
            .x(d3.time.scale().domain([minDate,maxDate]))
            .xAxis();

    dc.renderAll();
}

function createBarChart(dimension) {
    // Dimension, xDomain & yDomain
    var dimension = data.dimension(function (d) {
        var valueX = d[header[valueIndexX]];
        var valueY = d[header[valueIndexY]];

        // Domains
        isOrdinalX = isNaN(parseFloat(valueX));
        isOrdinalY = isNaN(parseFloat(valueY));
        if (isOrdinalX)
            xDomain.push(valueX);
        else
            xDomain.push(parseFloat(valueX));

        return valueX;
    });

    var group = dimension.group().reduceCount();

    dc.barChart("#chartContainer")
            .height(chartHeight)
            .width(chartWidth)
            .transitionDuration(transitionDuration)
            .margins(barCharMargin)
            .dimension(dimension)
            .group(group, "groupLayer")
            .brushOn(false)
            .gap(0)
            .elasticY(true)
            .xUnits(dc.units.ordinal)
            .x(d3.scale.ordinal())
            .y(d3.scale.linear())
            .renderHorizontalGridLines(true);

    dc.renderAll();
    updateToolTip("rect");
}

/* ************************************** */
/* ************** TOOLTIP *************** */
/* ************************************** */
function updateToolTip(elementType) {
    d3.selectAll("#chartContainer " + elementType).call(toolTip);
    d3.selectAll("#chartContainer " + elementType)
            .on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide);
}

function initToolTip() {
    toolTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10,0])
            .html(function (d) {
        return "<span class='d3-tipTitle'>" + d.data.key + " : </span>" + d.data.value.value;
    });
}


/* ************************************** */
/* **************** DATA **************** */
/* ************************************** */
function createDataHeader() {
    $.each(header, function(i, d) {
        var thElement = $("<th></th>");
        thElement.html("<span>" + d + "</span>");
        $("#headerData").append(thElement);
    })
}

function createDataTable(countId, tableId, allD, allG, tableD) {
    dc.dataCount(countId)
            .dimension(allD)
            .group(allG);

    dc.dataTable(tableId)
            .dimension(tableD)
            .group(function(d) {
        var result = new Array();
        $.each(header, function(i, dd) {
            result.push(d[dd]);
        });
        return result;
    })
            .size(allG.value())
            .columns([false])
            .renderlet(function (table) {
        table.selectAll(".dc-table-group").classed("info", false);
    });

    dc.renderAll();
}

/* ************************************** */
/* **************** INIT **************** */
/* ************************************** */
function reset() {
    selectedColumnX = false;
    selectedColumnY = false;
    selectedChart = false;
    lastSelectedColumn = false;

    $("#chartContainer").empty();
    $("#selectedColumnX").empty();
    $("#selectedColumnY").empty();
    $("#selectedChart").empty();

    initToolTip();
}

function init() {
    $("#displayAllData").on("click", function() {
        $("#dataDiv").toggle();
    });

    $("#resetSelect").on("click", function() {
        reset();
    });

    $("#createChart").on("click", function() {
        createChart();
    });

    $(".imgChart").on("click", function() {
        $("#selectedChart").html(this.title);
        selectedChart = this.title;

        switch (selectedChart) {
            case "pie":
                $("#selectedColumnYDiv").removeClass("disabled");
                $("#selectedColumnY").removeClass("disabled");
                break;
            case "timeSerie":
                $("#selectedColumnYDiv").removeClass("disabled");
                $("#selectedColumnY").removeClass("disabled");
                break;
            case "bar":
                $("#selectedColumnYDiv").addClass("disabled");
                $("#selectedColumnY").addClass("disabled");
                break;
        }
    });
}
