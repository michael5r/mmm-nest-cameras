var retries = 0;

// we'll wait 5 seconds before we try do anything
setTimeout(function() {
    console.log('[mmm-nest-cameras] Trying to autoplay camera stream ...');
    playNestStream();
}, 5000);

function playNestStream() {

    var video = document.getElementById('nest-video_html5_api');

    if (video) {
        var playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // video playing started
                console.log('[mmm-nest-cameras] Camera stream is playing.');
            })
            .catch(error => {
                // video playing was prevented
                console.log('[mmm-nest-cameras] Camera stream cannot be started.');
            });
        }
    } else if (retries < 3) {
        console.log('[mmm-nest-cameras] Camera stream video not yet initialized. Trying again in 5 seconds ...');
        retries++;
        setTimeout(function() {
            playNestStream();
        }, 5000);
    } else {
        console.log('[mmm-nest-cameras] Camera stream cannot be started.');
    }
}