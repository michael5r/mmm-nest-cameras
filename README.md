# Module: mmm-nest-cameras

The `mmm-nest-cameras` module is a [MagicMirror](https://github.com/MichMich/MagicMirror) addon.
This module requires MagicMirror version `2.5` or later.

This module displays your [Nest](https://www.nest.com) cameras on your Magic Mirror and gives you the option to show either live streams or constantly-updated snapshots.

**Please note**: any camera you wish to stream live video from needs to be [publicly-shared](#public-url).

![image](https://user-images.githubusercontent.com/3209660/49823042-617d3880-fd44-11e8-8c57-df08ba206be1.png)
*An example showing 3 cameras - one private camera (which, for privacy reasons, I blurred in this screenshoot) serving up static images and two public cameras streaming live.*

## Installing the module
Run `git clone https://github.com/michael5r/mmm-nest-cameras.git` from inside your `MagicMirror/modules` folder.

## Getting the Nest Token
Run `getToken.sh` in your terminal. This will walk you through setting up a [Nest Developer Account](https://developers.nest.com) (which is free) and will get you the token you need to allow this module access to the data from your Nest products.

If you're using my [`mmm-nest-status`](https://github.com/michael5r/mmm-nest-status) module as well, just copy the token you're using in that module. As an added bonus, both modules will use the same Nest API data, so you aren't making multiple data calls.

## Using the module

This module requires an extra step to work:

1) If you don't already have one, add a `electronOptions` object with the following options in your MagicMirror `config.js` file.

```js
electronOptions: {
    webPreferences: {
        webSecurity: false
    }
}
```

If you don't add this, the Nest camera stream will throw a security error and won't work.
If you're only using this module in `image` mode, you don't need to add this object.

2) Add the module to the `modules` array in your MagicMirror `config/config.js` file:

```js
{
    module: "mmm-nest-cameras",
    position: "bottom_bar", // pick whichever position you want
    config: {
        token: "<YOUR_NEST_API_TOKEN>",
        // ... and whatever else configuration options you want to use
    }
},
```

## General Configuration Options

Option                  | Type             | Default  | Description
------------------------|------------------|----------|-------------------------------------------------------
`token`                 | `string`         | -        | **This value is required for this module to work.**
`camerasToShow`         | `string`,`array` | `all`    | `all` or an `array` with [camera locations](#camera-locations)
`camerasPerRow`         | `int`            | `3`      | How many cameras shown pr. row. [See below](#camera-size)
`cameraMode`            | `string`         | `image`  | [`image`](#image-mode) or [`video`](#video-mode)
`showNames`             | `boolean`        | `true`   | Displays the camera name below the camera
`autoPlay`              | `boolean`        | `true`   | Whether video streams should [autoplay](#auto-playing-video)
`alignment`             | `string`         | `center` | One of: `left`, `center`, `right`
`hideNoSnapshotCameras` | `boolean`        | `true`   | Whether to show cameras that have no snapshots
`hideOfflineCameras`    | `boolean`        | `false`  | Whether to show cameras that are offline
`updateInterval`        | `int`            | `180000` | Default is 3 minutes. I'd advise against changing this.
`initialLoadDelay`      | `int`            | `0`      | How long to delay the initial load (in ms)
`motionSleep`           | `boolean`        | `false`  | Suspend module when triggered by [MMM-PIR-Sensor](https://github.com/paviro/MMM-PIR-Sensor)
`motionSleepSeconds`    | `int`            | `300`    | When motion is triggered, how long to wait before going to sleep. Default is 5 minutes.


## Camera Size

Instead of having to specify sizes like `small`, `medium`, `large`, etc (which really depend on how you're actually using this module), I decided to go with a flexible sizing model for this module instead. What this means is that every camera will fill up the full size of any container that it is in, but you get to choose how many cameras to show in a row with the `camerasPerRow` option in the configuration.

If, for instance, you set this option to `3`, this means that up to 3 cameras will be shown next to each other in a single row, and that each camera will be 1/3 of the size of the row itself. If you have less cameras than the size you've set, the cameras with be aligned based on the `alignment` property (by default it's `left`).

If you're adding this module in any of the full-width positions (like `bottom_bar`, `top_bar`, etc), setting this to `3` or `4` looks nice.

If, on the other hand, you're using this module in the narrower positions (like `top_left`, `top_right`, `bottom_left`, etc), I'd suggest setting this to `1` or `2` and also adding the following to your `custom.css` file:

```css
.mmm-nest-cameras .module-content {
    width: 300px;
}
```

This limits the width of the camera images to `300px` (which you, of course, can update to whatever width that looks nice on your mirror).

## Video Mode

Please read the [PSA about Nest Camera Streams](#PSA-about-nest-camera-streams) below.

When setting the `cameraMode` to `video` in this module, you will see a live stream of any **publicly-shared** Nest camera on your network.

- If the camera is online, but isn't shared publicly, it will display snapshots that are generated every time the module refreshes (which is based on the value in `updateInterval`).

- If the camera is online, but isn't shared publicly and there's an error getting the snapshot, you'll get a message telling you no snapshot is available. If you don't wish to see cameras that have no snapshots, set `hideNoSnapshotCameras` to `true` in your module configuration.

- If your camera is offline, you will get a message telling you so. If you don't wish to see cameras that are offline, set `hideOfflineCameras` to `true` in your module configuration.

## Image Mode

When setting the `cameraMode` to `image` in this module, you will see snapshots from any Nest camera on your network. These are generated from the actual camera stream.

- If the camera is online and there's an error getting the snapshot, you'll get a message telling you no snapshot is available. If you don't wish to see cameras that have no snapshots, set `hideNoSnapshotCameras` to `true` in your module configuration.

- If your camera is offline, you will get a message telling you so. If you don't wish to see cameras that are offline, set `hideOfflineCameras` to `true` in your module configuration.

## Camera Locations

To select exactly which cameras you want on your magic mirror, use the `camerasToShow` setting. By default it's set to `all`, but you can change it to an `array` with the location names of the cameras you wish to show. If you're unsure about the location name of a specific camera, check either the Nest mobile app or on Nest.com - the location name is displayed right above the camera.

Example:
```js
camerasToShow: ['outside']
```

This will now only show cameras that have a location of `outside` (it's not case sensitive, so you could have written `Outside` as well).

## Auto-Playing Video

If `autoPlay` is set to `true` in your configuration, this module will attempt to auto-play any **publicly-shared** Nest camera streams. Please note that this should be considered an experimental feature - normally you're supposed to click a play button to start the video in the Nest camera stream, but this module overrides this through a `preload` script for the `webview` object.

Don't be alarmed if the video doesn't start playing immediately - there's a 5 second delay before the module tries to start the video, and then it will try to do so 3 more times before giving up.

## PSA about Nest Camera Streams

From looking at the Nest camera API, you'd think there'd be plenty of options for embedding a camera stream into an `iframe` or `webview` suitable for use on a magic mirror. When you start digging, however, this turns out to be pretty far from the truth, unfortunately.

As of December 2018, the Nest camera API allows for the following camera streams:

### Web URL

API description: "Web URL (deep link) to the live video stream at home.nest.com.".

This provides a full webpage, similar to what you'd see when clicking on a camera on Nest.com.
This is what it looks like:

![image](https://user-images.githubusercontent.com/3209660/49701266-c5bac380-fbaf-11e8-8a7a-fb97352fa56e.png)

**There are multiple problems with this option** - the first one is that even though we're sending an authentication token to get this stream, [you will still need to sign in with your Nest.com credentials to see the actual feed](https://nestdevelopers.io/t/api-for-cameras-web-url-does-not-authenticate/1195). This is rather problematic on a mirror without a mouse.

Secondly, the view itself has a ton of extraneous options & information (if, for instance, the camera isn't using `Nest Aware` you'd see a large banner advertising this at the bottom) - it's not just a "clean" camera stream.

As such, this isn't really useful for a magic mirror.

### Password-protected Public URL

API description: "You can access this URL when a user makes their video stream public."

You get this by enabling **Camera sharing** for a specific camera on Nest.com and then choosing "Share with password".

There are even more problems with this option than the one above.

Firstly, you'll have to enter your password before seeing the stream:

![image](https://user-images.githubusercontent.com/3209660/49701340-da4b8b80-fbb0-11e8-858f-f788c5df1d97.png)

Secondly, this stream isn't using HTML5, it's a `Flash` player - which is just terrible.

And, lastly, this stream doesn't begin playing automatically - you'll have to manually click a play button to start it.

So ... this is a no-go as well.

### Public URL

API description: "You can access this URL when a user makes their video stream public."

You get this by enabling **Camera sharing** for a specific camera on Nest.com and then choosing "Share publicly".

**This is the option this module (reluctantly) uses.**

Using this URL gets you a HTML5 stream with no unnecessary icons & functionality.
It is also a **security risk** to make your camera completely public this way.

Check out this blog post by [Den Delimarsky](https://dennisdel.com/blog/psa-nest/).

So ... please choose carefuly before you share your camera like this - I would **never** recommend doing this for an indoor camera.

## FAQ

### I'm getting a "Nest API rate limit has been exceeded"-error - what does it mean?

Nest applies data rate limits for accessing their API - if you get this error, it means your account has reached that limit and is now **temporarily** blocked from getting Nest API data. When this happens, the module will automatically try to load data again after **10 minutes**.

There is, unfortunately, nothing you can do about this - you simply have to wait for their block to expire.

You can [read more here](https://developers.nest.com/guides/api/data-rate-limits).

### The image quality of my snapshots is bad. Why is this?

From the Nest API:

```
The snapshot quality from the API is only 1080p throughput if you are:

- actively viewing the camera stream in the application (web_url)
- actively viewing the public stream (app_url)
- subscribed to Nest Aware

If you are not actively viewing the stream or do not have a Nest Aware subscription, the API has no 1080p source from which to retrieve a snapshot at that resolution and generates a lower-quality image. Also, low local network bandwidth may cause the API snapshot resolution to dip below 1080p with Nest Aware present.
```

### My camera streams aren't playing

If you have `cameraMode` set to `video`, but your camera streams aren't playing, look closely at the camera image:

- if there's a grey `LIVE` text in the top left corner, you either have `autoPlay` set to `false` or the module was unable to start your camera stream. Either change `autoPlay` to `true` or try refreshing the page and see if that fixes the issue.

- if there's no `LIVE` text on the camera image, your camera isn't shared publicly and as such this module can't play the stream. Check the [Public Url](#public-url) section above to see what you need to do.

### How does the motionSleep setting work?

Setting the `motionSleep` setting to `true` makes this module continually listen for `USER_PRESENCE` notifications from the [MMM-PIR-Sensor](https://github.com/paviro/MMM-PIR-Sensor) module. Whenever a positive `USER_PRESENCE` notification is received, the module will reset a timer based on your `motionSleepSeconds` setting. When the timer reaches zero, the module will then do two things:

- temporarily stop pulling new data from Nest
- hide the mmm-nest-cameras module

You specify how long this timer should last by using the `motionSleepSeconds` setting - please note that this setting is in **seconds** (not ms).

This sleep mode will last till the next positive `USER_PRESENCE` notification is received, at which point the module will resume by immediately pulling new Nest data and then showing the mmm-nest-cameras module again.

This is a good option to enable if you're using a monitor that shows an ugly "no signal message" when the HDMI signal is lost and you've therefore turned off the `powerSaving` setting in the MMM-Pir-Sensor module.