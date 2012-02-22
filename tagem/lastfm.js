/**
 * Method(s) for interacting with LastFM
 * lawrencealan+git@gmail.com
 */
var lastfm = {
    query_settings:{
        endpoint:"http://ws.audioscrobbler.com/2.0/?",
        opts:{
            api_key:'b25b959554ed76058ac220b7b2e0a026',
            limit:5,
            format:'json'
        }
    },
    /**
     * Query LastFM
     * @param opts Query object: { method: 'track.search', track:'Believe' }
     */
    query:function (opts, callback) {
        $.extend(opts, lastfm.query_settings.opts);
        $.ajax({
            url:lastfm.query_settings.endpoint,
            type:"GET",
            data:opts,
            success:callback
        })
            .fail(function (xhr, obj, err) {
                var msg = "error: \n";
                msg += err;
                alert(msg);
            });
    }
}
