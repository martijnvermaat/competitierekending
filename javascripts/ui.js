/***********************************************************************

    Competitierekending

    Given a time or distance performed at a competition event, calculate
    the number of points. And the other way around.

    Formulas are taken from 'Formules en Constanten' [1], January 2004
    version, part of Wedstrijdreglement Atletiekunie.

    Version 1.3, 2010-02-19

    Copyright 2010, Martijn Vermaat <martijn@vermaat.name>
                    Sander van der Kruyssen <sandiaan@gmail.com>

    http://svn.vermaat.name/competitie-rekending

    Licensed under the MIT license [2], see the LICENSE file

    [1] http://www.atletiekunie.nl/upload/File/Dutch_Athletes/Formules%20en%20constanten%20(20-11-03).doc
    [2] http://en.wikipedia.org/wiki/Mit_license

***********************************************************************/


/*
  TODO:
  Bookmark keyboard shortcut does not work in webkit in text field
  Check if performance pattern attribute is usefull on iPhone
  We lose state on iPhone while switching apps
  More keyboard shortcuts (mannen/vrouwen, event)
*/


$(document).ready(function() {


    /*
      Direction we are currently calculating in can be one of
      1) performance -> points
      2) points      -> performance
    */
    var TO_POINTS = 0;
    var TO_PERFORMANCE = 1;
    var direction = TO_POINTS;


    /*
      List of bookmarked results, represented as:

        result = {'hash' : hash,
                  'e'    : event,
                  's'    : sex,
                  'p'    : performance,
                  'q'    : points}

      The 'hash' fields contain a random number, identifying each result
      in the list. These are used to match entries in the HTML list of
      bookmarks with entries in this list.
    */
    var bookmarks = [];


    // Location entry value is: baseUrl + '#' + state
    var loc = window.location;
    var urlPattern = /^([^#?]*\??[^#]*)#?(.*)/;
    var baseUrl = loc.href.replace(urlPattern, '$1');


    // Serialized representation of the bookmarks list
    var state = '';


    /*
      The state string is used to build a URL and might end up in an
      e-mail or other document. If it includes funny characters, some mail
      clients will cut-off the URL.
      Therefore, we make the state string 'safe' by mapping some
      characters to uppercase letters (which cannot occur in the original
      state string).
      This mapping is used in encodeState() and decodeState().
    */
    var stateMap = {
        '"' : 'A',
        ':' : 'B',
        ',' : 'C',
        '[' : 'D',
        ']' : 'E',
        '{' : 'F',
        '}' : 'G'
    };
    var stateMapPattern = /[":,\[\]{}]/g;
    var stateUnMapPattern = /[ABCDEFG]/g;


    // Do the calculation
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

        /*
          If the current values make sense, enable the bookmark button,
          otherwise disable it.
        */
        if (isNaN(parseInt($('#events').val()))
            || $('#points').val() == ''
            || $('#performance').val() == '')
            $('#bookmark').attr('disabled', 'disabled');
        else
            $('#bookmark').removeAttr('disabled');

    };


    // Do the calculation from performance to points
    var toPoints = function() {
        direction = TO_POINTS;
        calculate();
    };


    // Do the calculation from points to performance
    var toPerformance = function() {
        direction = TO_PERFORMANCE;
        calculate();
    };


    // Create a bookmark from the given result values
    var bookmark = function(event, sex, performance, points) {

        // Generate a somewhat unique hash for this result
        var hash = Math.floor(Math.random() * 100000000);

        // Add the result to the bookmarks list
        bookmarks.push({'hash' : hash,
                        'e'    : event,
                        's'    : sex,
                        'p'    : performance,
                        'q'    : points});

        var r = $('<button type="button" class="remove">');
        r.text('Verwijder dit resultaat').attr('title', r.text());

        /*
          The remove action removes the result from the bookmark list,
          identifying it by the hash.
        */
        r.click(function() {
            bookmarks = $.grep(bookmarks, function(b, i) {
                return b.hash != hash;
            });
            $(this).parent().remove();
            updateState();
            return false;
        });

        // Text for the bookmark
        var s = $('#events option[value=' + event + ']').text();
        s += ' (' + (sex ? 'm' : 'v') + '): ';
        s += performance + ', ' + points;

        // Add to the HTML list of bookmarks
        $('#bookmarks ul').append(
            $('<li>').text(s).prepend(r)
        );

    };


    // Serialize a list of bookmarks
    var encodeState = function(l) {

        // Don't return a serialized empty list
        if (l.length == 0) return '';

        // Create JSON and map funny characters to safe characters
        return JSON.stringify($.map(l, function(b) {
            // Don't include hash to keep state small
            return {
                'e' : b.e,
                's' : b.s,
                'p' : b.p,
                'q' : b.q
            };
        })).replace(stateMapPattern, function(c) {
            if (typeof stateMap[c] !== 'undefined')
                return stateMap[c];
            else
                return c;
        });

    };


    // Deserialize a list of bookmarks
    var decodeState = function(s) {

        // Just return an empty list if we get nothing
        if (!s) return [];

        // Parse JSON and map safe characters back to funny characters
        return JSON.parse(s.replace(stateUnMapPattern, function(c) {
            for (i in stateMap) {
                if (stateMap[i] == c)
                    return i;
            }
            return c;
        }));

    };


    /*
      Load a serialized state. If any bookmarks were loaded we return true,
      otherwise false.
    */
    var loadState = function(s) {

        // No state to load
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

        // We tried to load a state, but did not succeed
        updateState();
        return false;

    };


    // Store the serialized state in the URL and in the session
    var updateState = function() {

        // Asume the state is empty
        var state = '';

        try {
            state = encodeState(bookmarks)
        } catch (e) { }

        if (state) {
            loc.href = baseUrl + '#' + encodeURIComponent(state);
            $('#link').attr('href', loc.href).show();
        } else {
            if (loc.href != baseUrl)
                loc.href = baseUrl + '#';
            $('#link').hide();
        }

        if (typeof sessionStorage !== 'undefined')
            sessionStorage.state = state;

        // Show or hide the HTML bookmarks list
        if (bookmarks.length > 0)
            $('#bookmarks').show();
        else
            $('#bookmarks').hide();

    };


    /*
      Create a keypress handler that calls callback only if key was not <tab>
      or <shift>.
    */
    var ignoreNav = function(callback) {
        return function(e) {
            if (e.keyCode != 9 && e.keyCode != 0)
                callback(e);
        };
    };


    // Document keypress handler that filters shortcut keys
    var filterShortcuts = function(e) {
        // Key 'b', click bookmark button
        if (e.which == 98 || e.which == 66) {
            e.preventDefault();
            e.stopPropagation();
            if (!$('#bookmark').attr('disabled'))
                $('#bookmark').click();
        }
        // Key 'c', click clear button
        if (e.which == 99 || e.which == 67) {
            e.preventDefault();
            e.stopPropagation();
            if (bookmarks.length > 0)
                $('#clear').click();
        }
        // Key 'i', show or hide info
        if (e.which == 105 || e.which == 73) {
            e.preventDefault();
            e.stopPropagation();
            $('#info').toggle();
        }
    };


    // Populate events list
    var events = calculator.events();
    for (i = 0; i < events.length; i++)
        $('#events').append($('<option>').val(i).text(events[i]));

    // Register action handlers
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
    $('body > h1').click(function() {
        $('#info').show();
    }).css('cursor', 'pointer');
    $('#info').click(function() {
        $(this).hide();
    });
    $(document).keypress(filterShortcuts);

    // Create 'title' tooltips for buttons
    $('button, #link').each(function(i) {
        $(this).attr('title', $(this).text());
    });

    /*
      Try to load state from URL. If no state was loaded, try to load state
      from session.
    */
    if (!loadState(decodeURIComponent(loc.href.replace(urlPattern, '$2')))
        && typeof sessionStorage !== 'undefined')
            loadState(sessionStorage.state);


});
