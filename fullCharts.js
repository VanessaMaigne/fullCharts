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


// File parameters
var fullHeader;
var header;
var containerColumn = "header";

// Chart parameters
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
var format = d3.time.format("%d/%m/%Y_%H:%M");


function readFile(fileName) {
    d3.csv(fileName, function (error, csv) {
        // Header columns
        fullHeader = d3.keys(csv[0]);
//        header = fullHeader.split(',');
        header = d3.keys(csv[0]);
        $.each(fullHeader, function(i, d) {
            var element = $("<div></div>");
            element.attr("class", "columnName btn-default");
            element.attr("id", "column_" + i + "_" + $.trim(d));
            element.attr("title", d);
            element.html(d);
            $("#header").append(element);
        });

        dragAndDrop(".columnName");
        createDataHeader();

        // Data
        data = crossfilter(csv);
//        var dimensionHeader = data.dimension(function(d) {
//            return d[fullHeader];
//        });

//        createDataTable("#data-count", "#data-table", data, data.groupAll(), dimensionHeader);


        selectedColumnX = "Nom";
        selectedColumnY = "Quantite";
        selectedChart = "bar";
        createChart();
    });
}

function dragAndDrop(elementClass) {
    $(elementClass).draggable({
        helper: "clone",
        cursor: 'move'
    });

    $("#chartContainer").droppable({
        drop: function (event, ui) {
            var $canvas = $(this);
            if (!ui.draggable.hasClass('canvas-element')) {
                var $canvasElement = ui.draggable.clone();
                $canvasElement.addClass('canvas-element');
                $canvasElement.draggable({
                    containment: '#chartContainer'
                });
                $canvas.append($canvasElement);
                $canvasElement.css({
                    left: (ui.position.left),
                    top: (ui.position.top),
                    position: 'absolute'
                });
            }

            if (ui.draggable[0].parentElement.id == containerColumn) {
                if (!selectedColumnX || "Y" == lastSelectedColumn)
                    selectColumn(ui, "#selectedColumnX", "X");
                else
                    selectColumn(ui, "#selectedColumnY", "Y");
            } else {
                selectedChart = ui.draggable[0].title;
                $("#selectedChart").html(selectedChart);
            }

            createChart();
        }
    });
}

function selectColumn(ui, columnId, columnLetter) {
    if ("X" == columnLetter)
        selectedColumnX = ui.draggable[0].title;
    else
        selectedColumnY = ui.draggable[0].title;
    $(columnId).html(ui.draggable[0].title);
    lastSelectedColumn = columnLetter;
}

/* ************************************** */
/* *************** CHARTS *************** */
/* ************************************** */
var valueIndexX, valueIndexY, xDomain, yDomain, isOrdinalX, isOrdinalY;

function createChart() {
    if (!selectedColumnX || !selectedColumnY || !selectedChart)
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
    var timeDimension = data.dimension(function(d) {
        var value = d[header[valueIndexX]];
        return format.parse(value);
    });

    var timeDimensionGroup = timeDimension.group().reduce(
            function(p, v) {
                p.value += parseInt(v.Quantite);
                return p;
            },
            function(p, v) {
                p.value -= parseInt(v.Quantite);
                return p;
            },
            function() {
                return { value : 0};
            });

    d3.time.day.offset(d, -1);
    var date1 = format.parse("25/01/2015_00:00");
    var date2 = format.parse("30/01/2015_00:00");
    console.log(date1 + ", " + date2);

    dc.lineChart("#chartContainer")
            .width(chartWidth)
            .height(chartHeight)
            .margins(barCharMargin)
            .dimension(timeDimension)
            .group(timeDimensionGroup)
            .valueAccessor(function(d) {
        return d.value.value;
    })
            .transitionDuration(500)
            .elasticY(true)
            .x(d3.time.scale().domain([date1,date2]))
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

    var max = 0;
    var min = 0;
    // Group
    var group = dimension.group().reduce(
        // add
            function(p, v) {
                var valueY = v[header[valueIndexY]];
                if (!isNaN(valueY) && parseFloat(valueY))
                    p.value += parseFloat(valueY);
                max = Math.max(max, p.value);
                min = Math.min(min, p.value);
                return p;
            },
        // remove
            function(p, v) {
                var valueY = v[header[valueIndexY]];
                if (!isNaN(valueY) && parseFloat(valueY))
                    p.value -= parseFloat(valueY);
                return p;
            },
        // init
            function(p, v) {
                return {value: 0};
            });


    // yDomain
    yDomain = [min + (min * 0.01), max + (max * 0.01)];

    dc.customBarChartWithUncertainty("#chartContainer")
            .height(300)
            .width(500)
            .transitionDuration(750)
            .margins(barCharMargin)
            .dimension(dimension)
            .group(group, "groupLayer")
            .brushOn(false)
            .gap(0)
            .elasticY(false)
            .elasticYInDomain(true)
            .colors(color)
            .xUnits(dc.units.ordinal)
            .x(d3.scale.ordinal().domain(xDomain))
            .y(d3.scale.linear().domain(yDomain))
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
        return d[fullHeader];
    })
            .size(allG.value())
            .columns([false])
            .renderlet(function (table) {
        table.selectAll(".dc-table-group").classed("info", false);
    });

    dc.renderAll();
}

function createTableColumns(d) {
    var arrayFunction = new Array();
    $.each(header, function(i, dd) {
        arrayFunction.push(d[fullHeader].split(',')[i]);
    });

    return arrayFunction;
}

/* ************************************** */
/* **************** INIT **************** */
/* ************************************** */
function init() {
    selectedColumnX = false;
    selectedColumnY = false;
    selectedChart = false;
    lastSelectedColumn = false;

    $("#chartContainer").empty();
    $("#selectedColumnX").empty();
    $("#selectedColumnY").empty();
    $("#selectedChart").empty();
    $("#chartContainer").html("Drag & drop 2 columns and 1 chart in this area !");

    initToolTip();
}


//    $(".btn").on({
//        dragstart: function(e) {
//            console.log("dragstart");
//            $this = $(this);
//
//            i = $this.index();
//            $this.css('opacity', '0.5');
//
//            // on garde le texte en mémoire (A, B, C ou D)
//            e.dataTransfer.setData('text', $this.text());
//        },
//        // on passe sur un élément draggable
//        dragenter: function(e) {
//            console.log("dragenter");
//            // on augmente la taille pour montrer le draggable
//            $(this).animate({
//                width: '90px'
//            }, 'fast');
//
//            e.preventDefault();
//        },
//        // on quitte un élément draggable
//        dragleave: function() {
//            console.log("dragleave");
//            // on remet la taille par défaut
//            $(this).animate({
//                width: '75px'
//            }, 'fast');
//        },
//        // déclenché tant qu on a pas lâché l élément
//        dragover: function(e) {
//            console.log("dragover");
//            e.preventDefault();
//        },
//        // on lâche l élément
//        drop: function(e) {
//            console.log("drop");
//            // si l élément sur lequel on drop n'est pas l'élément de départ
//            if (i !== $(this).index()) {
//                // on récupère le texte initial
//                var data = e.dataTransfer.getData('text');
//
//                // on log
//                $log.html(data + ' > ' + $(this).text()).fadeIn('slow').delay(1000).fadeOut();
//
//                // on met le nouveau texte à la place de l ancien et inversement
//                $this.text($(this).text());
//                $(this).text(data);
//            }
//
//            // on remet la taille par défaut
//            $(this).animate({
//                width: '75px'
//            }, 'fast');
//        },
//        // fin du drag (même sans drop)
//        dragend: function() {
//            console.log("dragend");
//            $(this).css('opacity', '1');
//        },
//        // au clic sur un élément
//        click: function() {
////            console.log("clidk");
////            alert($(this).text());
//        }
//    });


//(function( $ )
//{
//    var element = false;
//    var options = false;
//
//    $.fn.extend( {
//    } );
//
//
//})( jQuery );
