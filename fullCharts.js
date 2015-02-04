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
var chartHeight = $("#leftMenu").height();
var chartWidth = $("#chartContainer").width();
var transitionDuration = 500;
var format = d3.time.format("%d/%m/%Y_%H:%M");


/* ************************************** */
/* **************** FILE **************** */
/* ************************************** */
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
            if (!selectedColumnX || "Y" == lastSelectedColumn || "bar" == selectedChart || "pie" == selectedChart)
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

//        selectedColumnX = "Bonbon";
//        selectedColumnY = "Bonbon";
//        selectedChart = "pie";
//        $("#selectedColumnYDetail").val("Michoko");
//        createChart();
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
var valueIndexX, valueIndexY, xDomain, yDomain, isOrdinalX, isOrdinalY, title, filteredDimension;

function createChart2() {
    createChartForBoth("#chartContainer2");
}

function createChart() {
    createChartForBoth("#chartContainer");
}

function camembert() {
    createChartForBoth("#chartContainer3");
}

function createChartForBoth(container) {
    if (!selectedColumnX || !selectedChart)
        return;

    $(container).empty();

    valueIndexX = header.indexOf(selectedColumnX);
    valueIndexY = header.indexOf(selectedColumnY);
    xDomain = new Array();
    yDomain = new Array();
    isOrdinalX = false;
    isOrdinalY = false;

    // Title
    title = header[valueIndexY];
    // Filter
    var filterValue = $("#selectedColumnYDetail").val();
    if (filteredDimension)
        filteredDimension.filterAll();
    if (filterValue != "" && filterValue != undefined) {
        filteredDimension = data.dimension(
                function(d) {
                    return d[header[valueIndexY]];
                }).filter(function(d) {
            if (d == filterValue)
                return d;
        });
        title = header[valueIndexY] + " : " + filterValue;
    }

    switch (selectedChart) {
        case "pie":
            createPieChart(container);
            break;
        case "timeSerie":
            createTimeSerieChart(container);
            break;
        case "bar":
            createBarChart(container);
            break;
    }
}

function createPieChart(container) {
    var pieDimension = data.dimension(
            function(d) {
                return d[header[valueIndexX]];
            });

    var pieDimensionGroup = pieDimension.group().reduceCount();

    dc.pieChart(container)
            .width(chartWidth)
            .height(chartHeight)
            .slicesCap(4)
            .innerRadius(10)
            .dimension(pieDimension)
            .group(pieDimensionGroup)// by default, pie charts will use group.key as the label
            .renderLabel(true)
            .label(function (d) {
        return d.key;
    });

    dc.renderAll();
    updateCharts();
}

function createTimeSerieChart(container) {
    var dateArray = new Array();

    var timeDimension = data.dimension(
            function(d) {
                var value = d[header[valueIndexX]];
                dateArray.push(format.parse(value));
                return format.parse(value);
            });

    var timeDimensionGroup = timeDimension.group().reduceCount();

    // Date domain
    var sortedDateArray = dateArray.sort(function(a, b) {
        return a.getTime() - b.getTime();
    });
    var minDate = d3.time.hour.offset(sortedDateArray[0], -1);
    var maxDate = d3.time.hour.offset(sortedDateArray[sortedDateArray.length - 1], 1);

    dc.lineChart(container)
            .width(chartWidth)
            .height(chartHeight)
            .margins(barCharMargin)
            .dimension(timeDimension)
            .group(timeDimensionGroup, title)
            .valueAccessor(function(d) {
        return d.value;
    })
            .transitionDuration(transitionDuration)
            .elasticY(true)
            .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
            .x(d3.time.scale().domain([minDate,maxDate]))
            .xAxis();

    dc.renderAll();
    updateCharts();
}

function createBarChart(container) {
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

    dc.barChart(container)
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
    updateCharts();
}

function updateCharts() {
    $(".axis.x text").attr("transform", "translate(-15,25)rotate(270)");
    updateToolTip();
}

/* ************************************** */
/* ************** TOOLTIP *************** */
/* ************************************** */
function updateToolTip() {
    d3.selectAll("svg path, svg rect").call(toolTip);
    d3.selectAll("svg path, svg rect")
            .on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide);
}

function initToolTip() {
    toolTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10,0])
            .html(function (d) {
        return "<span class='d3-tipTitle'>" + d.data.key + " : </span>" + d.data.value;
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
    $("#selectedColumnYDetail").val("");

    if (filteredDimension)
        filteredDimension.filterAll();
    dc.redrawAll();
}

function init() {
    initToolTip();

    $("#displayAllData").on("click", function() {
        $("#dataDiv").toggle();
    });

    $("#resetSelect").on("click", function() {
        reset();
    });

    $("#createChart").on("click", function() {
        createChart();
    });

    $("#createChart2").on("click", function() {
        createChart2();

    });

    $("#createChart3").on("click", function() {
        camembert();
    });

    $(".imgChart").on("click", function() {
        $("#selectedChart").html(this.title);
        selectedChart = this.title;

        switch (selectedChart) {
            case "pie" :
            case "bar":
                $("#selectedColumnYDiv").addClass("disabled");
                $("#selectedColumnY").addClass("disabled");
                $("#selectedColumnYDetailDiv").addClass("disabled");
                $("#selectedColumnYDetail").addClass("disabled");
                break;
            case "timeSerie":
                $("#selectedColumnYDiv").removeClass("disabled");
                $("#selectedColumnY").removeClass("disabled");
                $("#selectedColumnYDetailDiv").removeClass("disabled");
                $("#selectedColumnYDetail").removeClass("disabled");
                break;
        }
    });
}
