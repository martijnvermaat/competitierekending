/***********************************************************************

    Competitierekending

    Given a time or distance performed at a competition event, calculate
    the number of points. And the other way around.

    Formulas are taken from 'Formules en Constanten' [1], January 2004
    version, part of Wedstrijdreglement Atletiekunie.

    Version 1.0, 2010-01-28

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
      image preloading
      comments
      bookmark keyboard shortcut does not work in webkit in text field
    */

    var TO_POINTS = 0;
    var TO_PERFORMANCE = 1;
    var direction = TO_POINTS;

    var loc = window.location;
    var url = loc.href.replace(/^([^#?]*\??[^#]*)#?(.*)/, '$1');
    var state = loc.href.replace(/^([^#?]*\??[^#]*)#?(.*)/, '$2');

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

        $('#bookmark').unbind('click');

        if (isNaN(parseInt($('#events').val()))
            || $('#points').val() == ''
            || $('#performance').val() == '') {

            $('#bookmark').bind('click', function() {
                return false;
            }).addClass('disabled');

        } else {

            $('#bookmark').click(function() {
                bookmark($('#events').val(),
                         $('#male').is(':checked'),
                         $('#performance').val(),
                         $('#points').val());
                return false;
            }).removeClass('disabled');

        }

    };


    var bookmark = function(event, sex, performance, points) {

        var hash = Math.floor(Math.random() * 100000000);

        bookmarks.push({'hash' : hash,
                        'e'    : event,
                        's'    : sex,
                        'p'    : performance,
                        'q'    : points});

        var r = $('<a href="#" class="remove">Verwijder dit resultaat</a>');
        r.attr('title', r.text()).click(function() {
            bookmarks = $.grep(bookmarks, function(b, i) {
                return b.hash != hash;
            });
            $(this).parent().remove();
            updateLocation();
            return false;
        });

        var s = $('#events option[value=' + event + ']').text();
        s += ' (' + (sex ? 'm' : 'v') + '): ';
        s += performance + ', ' + points;

        $('#bookmarks').append(
            $('<li>').text(s).prepend(r)
        );

        updateLocation();

    };


    var encodeState = function(s) {

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


    var updateLocation = function() {

        try {
            loc.href = url + '#' + encodeState(bookmarks);
            $('#mail').attr(
                'href',
                'mailto:?subject=Competitieresultaten&body=De resultaten: '
                    + loc.href
            ).show();
        } catch (e) {
            $('#mail').hide();
        }

        if (bookmarks.length > 0) {
            $('#bookmarks-title').show();
        } else {
            $('#bookmarks-title').hide();
        }

    };


    var loadBookmarks = function(s) {

        try {
            var p = decodeState(s);
            for (i = 0; i < p.length; i++) {
                bookmark(p[i].e, p[i].s, p[i].p, p[i].q);
            }
        } catch (e) {}

    };


    var ignoreNav = function(callback) {
        // Call callback if key was not <tab> or <shift>
        return function(e) {
            if (e.keyCode != 9 && e.keyCode != 0)
                callback(e);
        };
    };

    var bookmarkShortcut = function(e) {
        // Key 'b'
        if (e.which == 98 || e.which == 66) {
            e.preventDefault();
            e.stopPropagation();
            if (!$('#bookmark').hasClass('disabled'))
                $('#bookmark').click();
        }
    };


    var events = calculator.events();
    for (i = 0; i < events.length; i++)
        $('#events').append($('<option>').val(i).text(events[i]));

    $('#events').bind('change keyup', calculate);

    $('#male, #female').click(calculate);

    $('#performance').keyup(ignoreNav(toPoints));
    $('#points').keyup(ignoreNav(toPerformance));

    $(document).keypress(bookmarkShortcut);

    updateLocation();
    updateBookmark();
    loadBookmarks(state);


});
