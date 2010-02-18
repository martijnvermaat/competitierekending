/***********************************************************************

    Competitierekending

    Given a time or distance performed at a competition event, calculate
    the number of points. And the other way around.

    Formulas are taken from 'Formules en Constanten' [1], January 2004
    version, part of Wedstrijdreglement Atletiekunie.

    Version 1.2, 2010-02-17

    Copyright 2010, Martijn Vermaat <martijn@vermaat.name>
                    Sander van der Kruyssen <sandiaan@gmail.com>

    http://svn.vermaat.name/competitie-rekending

    Licensed under the MIT license [2], see the LICENSE file

    [1] http://www.atletiekunie.nl/upload/File/Dutch_Athletes/Formules%20en%20constanten%20(20-11-03).doc
    [2] http://en.wikipedia.org/wiki/Mit_license

***********************************************************************/


$(document).ready(function() {


    /*
      TODO:
      Comments
      Bookmark keyboard shortcut does not work in webkit in text field
      HTML5
      Points should have digit keyboard on iPhone
      Nothing works in IE
      Remove old images
      Check if performance pattern attribute is usefull on iPhone
    */


    var TO_POINTS = 0;
    var TO_PERFORMANCE = 1;
    var direction = TO_POINTS;

    var loc = window.location;
    var urlPattern = /^([^#?]*\??[^#]*)#?(.*)/;
    var baseUrl = loc.href.replace(urlPattern, '$1');
    var state = '';

    var bookmarks = [];


    var calculate = function() {

        if (direction == TO_POINTS) {
            var points = calculator.points($('#events').val(),
                                           $('#male').is(':checked'),
                                           $('#performance').val());
            if (!isNaN(points))
                $('#points').val(points.toString());
        } else {
            $('#performance').val(
                calculator.performance($('#events').val(),
                                       $('#male').is(':checked'),
                                       $('#points').val()));
        }

        updateBookmark();

    };


    var toPoints = function() {
        direction = TO_POINTS;
        calculate();
    };


    var toPerformance = function() {
        direction = TO_PERFORMANCE;
        calculate();
    };


    var updateBookmark = function() {

        if (isNaN(parseInt($('#events').val()))
            || $('#points').val() == ''
            || $('#performance').val() == '')
            $('#bookmark').attr('disabled', 'disabled');
        else
            $('#bookmark').removeAttr('disabled');

    };


    var bookmark = function(event, sex, performance, points) {

        var hash = Math.floor(Math.random() * 100000000);

        bookmarks.push({'hash' : hash,
                        'e'    : event,
                        's'    : sex,
                        'p'    : performance,
                        'q'    : points});

        var r = $('<button type="button" class="remove">Verwijder dit resultaat</button>');
        r.attr('title', r.text()).click(function() {
            bookmarks = $.grep(bookmarks, function(b, i) {
                return b.hash != hash;
            });
            $(this).parent().remove();
            updateState();
            return false;
        });

        var s = $('#events option[value=' + event + ']').text();
        s += ' (' + (sex ? 'm' : 'v') + '): ';
        s += performance + ', ' + points;

        $('#bookmarks ul').append(
            $('<li>').text(s).prepend(r)
        );

    };


    var encodeState = function(s) {

        if (s.length == 0) return '';

        var r = JSON.stringify($.map(s, function(b) {
            // Don't include hash to keep state small
            return {
                'e' : b.e,
                's' : b.s,
                'p' : b.p,
                'q' : b.q
            };
        }));

        var map = [];
        map['"'] = 'A';
        map[':'] = 'B';
        map[','] = 'C';
        map['['] = 'D';
        map[']'] = 'E';
        map['{'] = 'F';
        map['}'] = 'G';

        return encodeURIComponent(
            r.replace(/[":,\[\]{}]/g,
                      function(c) { return map[c]; })
        );

    };


    var decodeState = function(s) {

        if (!s) return [];

        var r = decodeURIComponent(s);

        var map = [];
        map['A'] = '"';
        map['B'] = ':';
        map['C'] = ',';
        map['D'] = '[';
        map['E'] = ']';
        map['F'] = '{';
        map['G'] = '}';

        return JSON.parse(
            r.replace(/[ABCDEFG]/g,
                      function(c) { return map[c]; })
        );

    };


    var loadState = function(s) {

        if (!s) return false;

        try {
            var p = decodeState(s);
            if ($.isArray(p) && p.length > 0) {
                for (i = 0; i < p.length; i++) {
                    bookmark(p[i].e, p[i].s, p[i].p, p[i].q);
                }
            }
            updateState();
            return true;
        } catch (e) { }

        updateState();
        return false;

    };


    var updateState = function() {

        var state = '';

        try {
            state = encodeState(bookmarks)
        } catch (e) { }

        if (state) {
            loc.href = baseUrl + '#' + state;
            $('#link').attr('href', loc.href).show();
        } else {
            if (loc.href != baseUrl)
                loc.href = baseUrl + '#';
            $('#link').hide();
        }

        if (sessionStorage)
            sessionStorage.state = state;

        if (bookmarks.length > 0)
            $('#bookmarks').show();
        else
            $('#bookmarks').hide();

    };


    var ignoreNav = function(callback) {
        // Call callback if key was not <tab> or <shift>
        return function(e) {
            if (e.keyCode != 9 && e.keyCode != 0)
                callback(e);
        };
    };


    var filterShortcuts = function(e) {
        // Key 'b'
        if (e.which == 98 || e.which == 66) {
            e.preventDefault();
            e.stopPropagation();
            if (!$('#bookmark').attr('disabled'))
                $('#bookmark').click();
        }
        // Key 'c'
        if (e.which == 99 || e.which == 67) {
            e.preventDefault();
            e.stopPropagation();
            if (bookmarks.length > 0)
                $('#clear').click();
        }
    };


    var events = calculator.events();
    for (i = 0; i < events.length; i++)
        $('#events').append($('<option>').val(i).text(events[i]));

    $('#events').bind('change keyup', calculate);

    $('#male, #female').click(calculate);

    $('#performance').keyup(ignoreNav(toPoints));
    $('#points').keyup(ignoreNav(toPerformance));

    $('#bookmark').click(function() {
        bookmark($('#events').val(),
                 $('#male').is(':checked'),
                 $('#performance').val(),
                 $('#points').val());
        updateState();
        return false;
    });

    $('#clear').click(function() {
        bookmarks = [];
        $('#bookmarks li').remove();
        updateState();
        return false;
    });

    $(document).keypress(filterShortcuts);

    if (!loadState(loc.href.replace(urlPattern, '$2'))
        && sessionStorage) {
            loadState(sessionStorage.state);
    }


});
