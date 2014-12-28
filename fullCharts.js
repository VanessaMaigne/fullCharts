/**
 * fullCharts _ version 1.0
 * ##################################################
 *   Created by vmaigne@gmail.com _ december 2014
 * ##################################################
 * This library creates some data visualization charts
 *
 */

var fullHeader;
var header;
var containerColumn = "header";

var data;
var selectedColumnX = false;
var selectedColumnY = false;
var selectedChart = false;
var lastSelectedColumn = false;

function readFile( fileName )
{
    d3.tsv( fileName, function ( error, csv )
    {
        // Header columns
        fullHeader = d3.keys(csv[0])[0];
        header = fullHeader.split(',');
        $.each(header, function(i,d){
            var element = $("<div></div>");
            element.attr("class", "columnName btn-default");
            element.attr("id", "column_"+i+"_"+$.trim(d));
            element.attr("title", d);
            element.html(d);
            $("#header").append(element);
        });

        dragAndDrop(".columnName");
        createDataHeader();

        // Data
        data = crossfilter( csv );
        var continents = data.dimension( function( d )
        {
            return d[fullHeader];
        } );

        createDataTable( "#data-count", "#data-table", data, data.groupAll(), continents );
        selectedColumnX = "Nom";
        selectedColumnY = "Value";
        selectedChart = "bar";
        createBarChart();
    });
}

function dragAndDrop(elementClass)
{
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

            if(ui.draggable[0].parentElement.id == containerColumn){
                if(!selectedColumnX || lastSelectedColumn == "Y")
                    selectColumn(ui, "#selectedColumnX", "X" );
                else
                    selectColumn(ui, "#selectedColumnY", "Y" );
            } else {
                selectedChart = ui.draggable[0].title;
                $("#selectedChart").html(selectedChart);
            }

            createChart();
        }
    });
}

function selectColumn(ui, columnId, columnLetter)
{
    if(columnLetter == "X")
        selectedColumnX = ui.draggable[0].title;
    else
        selectedColumnY = ui.draggable[0].title;
    $(columnId).html(ui.draggable[0].title);
    lastSelectedColumn = columnLetter;
}

/* ************************************** */
/* *************** CHARTS *************** */
/* ************************************** */
function createChart()
{
    if(!selectedColumnX || !selectedColumnY || !selectedChart)
        return;

    switch(selectedChart) {
        case "pie":
            console.log("create pie");
            createPieChart();
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

function createPieChart(){

}

function  createTimeSerieChart(){

}

function createBarChart(){
    var barCharMargin = {top: 10, right: 0, bottom: 75, left: 35};
    var color = d3.scale.category20();
    var valueIndexX = header.indexOf(selectedColumnX);
    var valueIndexY = header.indexOf(selectedColumnY);
    var xDomain = new Array();

    var dimension = data.dimension( function ( d, i )
    {
        var values = d[fullHeader].split(",");
        xDomain.push(values[valueIndexX]);
        return values[valueIndexX];
    }, this );

    var group = dimension.group().reduce(
        // add
        function( p, v )
        {
            var values = v[fullHeader].split(",");
            if( !isNaN( values[valueIndexY] ) && parseFloat( values[valueIndexY] ))
                p.value += parseFloat( values[valueIndexY] );

            return p;
        },
        // remove
        function( p, v )
        {
            var values = v[fullHeader].split(",");
            if( !isNaN( values[valueIndexY] ) && parseFloat( values[valueIndexY] ))
                p.value -= parseFloat( values[valueIndexY] );
            return p;
        },
        // init
        function( p, v )
        {
            return {value: 0};
        }
    );


    dc.customBarChartWithUncertainty( "#chartContainer" )
        .height( 300 )
        .width( 500 )
        .transitionDuration( 750 )
        .margins( barCharMargin )
        .dimension( dimension )
        .group( group, "groupLayer" )
        .brushOn( false )
        .gap( 0 )
        .elasticY( false )
        .elasticYInDomain( true )
        .colors( color )
        .xUnits( dc.units.ordinal )
        .x( d3.scale.ordinal().domain(xDomain))
        .y( d3.scale.linear().domain( [0,100] ) )
        .renderHorizontalGridLines( true );

//    barChart.setUseRightYAxis( useRightYAxis );
//    barChart.yAxis().tickFormat( d3.format( "s" ) );
//    barChart.displayBoxAndWhiskersPlot( this.displayUncertainty );
//    barChart.setCallBackOnClick( jQuery.proxy( this.onClickFluxChart, [this, chartId] ) );
//    barChart.on( "postRedraw", jQuery.proxy( function()
//    {
//        this.onCompleteDisplayFluxChart()
//    }, this ) );
    dc.renderAll();
}

/* ************************************** */
/* **************** DATA **************** */
/* ************************************** */
function createDataHeader(){
    $.each(header, function(i,d){
        var thElement = $("<th></th>");
        thElement.html("<span>"+d+"</span>");
        $("#headerData").append(thElement);
    })
}

function createDataTable( countId, tableId, allD, allG, tableD ){
    dc.dataCount( countId )
        .dimension( allD )
        .group( allG );

    dc.dataTable( tableId )
        .dimension( tableD )
        .group(function( d )
        {
            return d[fullHeader];
        })
        .size( allG.value() )
        .columns( [false])
        .renderlet( function ( table )
        {
            table.selectAll( ".dc-table-group" ).classed( "info", false );
        } );

//    dc.renderAll();
}

function createTableColumns(d){
    var arrayFunction = new Array();
    $.each(header, function(i,dd)
    {
        arrayFunction.push(d[fullHeader].split(',')[i]);
    });

    return arrayFunction;
}

/* ************************************** */
/* **************** INIT **************** */
/* ************************************** */
function init(){
    selectedColumnX = false;
    selectedColumnY = false;
    selectedChart = false;
    lastSelectedColumn = false;

    $("#chartContainer").empty();
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
