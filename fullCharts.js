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
            element.html(d);
            $("#header").append(element);
        });

        dragAndDrop(".columnName");
        createDataHeader();

        // Data
        var data = crossfilter( csv );
        var continents = data.dimension( function( d )
        {
            return d[fullHeader];
        } );

        createDataTable( "#data-count", "#data-table", data, data.groupAll(), continents );
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
        }
    });
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

    dc.renderAll();
}

function createTableColumns(d){
    var arrayFunction = new Array();
    $.each(header, function(i,dd)
    {
        arrayFunction.push(d[fullHeader].split(',')[i]);
    });

    return arrayFunction;
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
