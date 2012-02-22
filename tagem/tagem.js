/**
 * Spotify App "Tagem" for browsing music relative to the current track tags / genres
 * See: http://screencast.com/t/xqD0LCiA
 *
 * http://lawrencealan.com/
 * lawrencealan+git@gmail.com
 *
 */

var search,
    tags_destination, results_destination,
    results_header, results_pageIndex, results_totalPages,
    header, query_pretty;
var nav_prev, nav_next;
var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var results_data = [];

String.prototype.clean = function () {
    return this.replace(/(&amp;\s+?|&|\+|,|')/g, '');
};
String.prototype.isString = true;

exports.init = init;

/**
 * Initialize
 */
function init() {
    header = $('header');
    tags_destination = $('tags');
    results_destination = $('[resultsPane] [results]');
    results_header = $('[resultsPane] [head]');

    nav_prev = $('[resultsPane] [pagination] [prev]');
    nav_next = $('[resultsPane] [pagination] [next]');
    nav_prev.click(handle.click.prev);
    nav_next.click(handle.click.next);

    player.observe(models.EVENT.CHANGE, handle.spotify.trackchanged);
    handle.spotify.trackchanged(null);
}

/* Event Handlers / Callbacks */
var handle = {

    error:function (msg) {
        (console.hasOwnProperty('error') ? console.error(msg) : alert("error:\n" + msg))
    },
    /* Click Event Handlers */
    click:{
        tag:function (ev) {
            $('.active').removeClass('active');
            $(this).addClass('active');
            var query = $(this).attr('query');
            tagem.query_pretty = $(this).attr('query_pretty');
            results_data = [];
            search = new models.Search(query);
            search.searchTracks = true;
            results_header.html('Getting results for ' + tagem.query_pretty)
            search.observe(models.EVENT.CHANGE, handle.spotify.search_results);
            search.appendNext();
        },
        track:function (ev) {
            $('[track].active').removeClass('active');
            $(this).addClass('active');
            var uri = $(this).attr('uri');
            player.play(uri);
        },
        next:function (ev) {
            if (results_data.tracks.length / 50 >= results_pageIndex + 2) {
                handle.spotify.show_page(results_pageIndex + 1);
            }
            else {
                search.appendNext();
            }
        },
        prev:function (ev) {
            if (results_pageIndex > 0) {
                handle.spotify.show_page(results_pageIndex - 1);
            }
        }
    },
    /* LastFM Handlers */
    lastfm:{
        /* LastFM result callback */
        result:function (dataObject) {
            console.log(["lastfm response:", dataObject]);

            tags_destination.empty();
            var track = dataObject.track;
            if (track == null || track.toptags.tag == null) {
                tags_destination.html('No tags found!');
                return;
            }

            // NOTE: LastFM will not return an Array if there is only one result, so I convert for simplicity of code
            track.toptags.tag = ($.isArray(track.toptags.tag) ? track.toptags.tag : [track.toptags.tag]);
            var valid_tags = 0;
            for (var i in track.toptags.tag) {
                var name = track.toptags.tag[i].name;
                var tag = $("<a>" + name + "</a>");
                if (spotfiy_genres.hasOwnProperty(name)) {
                    var query_genres = (spotfiy_genres[name] === true ? [name] : spotfiy_genres[name] );
                    var query = 'genre:"' + query_genres.join('" OR genre:"') + '"';
                    var query_pretty = query_genres.join(',  ');
                    tag.attr({ 'query':query, 'query_pretty':query_pretty });
                    tag.click(handle.click.tag);
                }
                tags_destination.append(tag);
                valid_tags++;
            }

        }
    },
    /* Spotify Events */
    spotify:{
        /**
         * Current track has changed in Spotify
         * @param e Event Object OR null
         */
        trackchanged:function (e) {
            var current_track, track, html = "";
            if (e != null && e.data.curtrack != true) return;
            current_track = player.track;
            if (current_track == null) return header.html("Nothing playing!");
            track = current_track.data;
            html += "<name track>" + track.name + "</name>";
            html += "<name album>" + track.album.name + "</name>";
            html += "<name artist>" + track.album.artist.name + "</name>";
            header.html(html);
            var query_object = {
                method:'track.getinfo',
                track:track.name.clean(),
                artist:track.album.artist.name.clean()
            };
            lastfm.query(query_object, handle.lastfm.result);
            console.log(["lastfm query:", query_object]);
        },
        search_results:function (results) {
            var page = Math.ceil(results.tracks.length / 50) - 1;
            results_data = results;
            results_totalPages = Math.ceil(results.totalTracks / 50);
            handle.spotify.show_page(page);
        },
        show_page:function (index) {
            var offset = index * 50;
            var results = results_data.tracks.slice(offset, offset + 50);
            results_pageIndex = index;
            results_pageIndex > 0 ? nav_prev.show() : nav_prev.hide();
            results_pageIndex + 1 < results_totalPages ? nav_next.show() : nav_next.hide();
            if (results_data.totalTracks == 0) {
                results_header.html('No results!');
                return;
            }
            results_header.html('Showing results ' + offset + '-' + (offset + 50) + ' of ' + results_data.totalTracks + ' results  for ' + tagem.query_pretty)

            results_destination.children().remove();
            var track;
            while (track = results.pop()) {
                var html = "";
                html += "<div track uri='" + track.uri + "'>";
                html += "<span name track>" + track.name + "</span>";
                html += "<span name album>" + track.album.name + "</span>";
                html += "<span name artist>" + track.album.artist.name + "</span>";
                html += "</div>";
                var o = $(html);
                o.click(handle.click.track).appendTo(results_destination);
            }
        }
    }
};

