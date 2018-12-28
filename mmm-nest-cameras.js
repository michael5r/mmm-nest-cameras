/* global Module */

/* Magic Mirror
 * Module: mmm-nest-cameras
 *
 * By Michael Schmidt
 * https://github.com/michael5r
 *
 * MIT Licensed.
 */

Module.register('mmm-nest-cameras', {

    defaults: {
        token: '',
        camerasToShow: 'all',
        camerasPerRow: 3,
        cameraMode: 'image',
        showNames: true,
        autoPlay: true,
        hideNoSnapshotCameras: true,
        hideOfflineCameras: false,
        alignment: 'left',
        motionSleep: false,
        motionSleepSeconds: 300, // this is in seconds (not ms)
        updateInterval: 3 * 60 * 1000,
        animationSpeed: 2 * 1000,
        initialLoadDelay: 0,
        version: '1.1.0'
    },

    getStyles: function() {
        return [
            'mmm-nest-cameras.css'
        ];
    },

    start: function() {

        Log.info('Starting module: ' + this.name + ', version ' + this.config.version);

        this.errMsg = '';

        this.usingNestStatusData = false; // whether we're using data from the `mmm-nest-status` module
        this.loaded = false;

        this.sleepTimer = null;
        this.sleeping = false;

        this.cameras = [];
        this.camerasStatus = [];

    },

    getDom: function() {

        var camerasToShow = this.config.camerasToShow;
        var camerasPerRow = parseInt(this.config.camerasPerRow);
        var camerasDisplayed = 0; // how many cameras we actually end up showing
        var cameraMode = this.config.cameraMode;
        var numberOfCameras = this.cameras.length;
        var showNames = this.config.showNames;
        var alignment = this.config.alignment;
        var autoPlay = this.config.autoPlay;

        var outer_wrapper = document.createElement('div');
        var nestHome = '<svg viewBox="0 0 19.5 18.2" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path transform="translate(-6.2 -6.7)" d="M18.1,24.9H13.8V19.4a2.1,2.1,0,0,1,4.2,0v5.5Zm6-8.1-1.8-1.5v9.5H19.9V19.3a3.9,3.9,0,1,0-7.8,0v5.5H9.6V15.3L7.8,16.8l-1.6-2L16,6.7l4.3,3.6V9.1h2V12l3.4,2.8Z" fill="#999999"/></svg><br>';

        // show error message
        if (this.errMsg !== '') {
            outer_wrapper.innerHTML = nestHome + this.errMsg;
            outer_wrapper.className = 'normal regular small';
            return outer_wrapper;
        }

        // show loading message
        if (!this.loaded) {
            outer_wrapper.innerHTML = nestHome + '... loading ...';
            outer_wrapper.className = 'bright light small';
            return outer_wrapper;
        }

        outer_wrapper.className = this.classNames('nest-wrapper',alignment);

        var camera = {};
        var offlineImg = '<img src="modules/mmm-nest-cameras/images/no-snapshot.gif"></img>';
        var noSnapshotMessage = offlineImg + '<span class="message xsmall dimmed">There is currently no snapshot from this camera. Please try again later.</span>';
        var offlineMessage = offlineImg + '<span class="message xsmall bright">This camera is currently offline.</span>';

        // loop through cameras
        for (i = 0; i < numberOfCameras; i++) {

            camera = this.cameras[i];

            var isStreaming = camera.is_streaming; // if the camera is off, this will be off too
            var isPublic = camera.public_share_url;
            var isOnline = camera.is_online;
            var hasSnapshot = camera.snapshot_url;
            var showCamera = true;

            var camera_wrapper = document.createElement('div');
            camera_wrapper.className = 'camera';

            var inner = document.createElement('div');
            inner.className = 'inner';

            if (cameraMode === 'image') {
                // image mode

                if (isStreaming) {
                    // camera is on

                    if (hasSnapshot) {
                        // camera has snapshot
                        inner.innerHTML = '<img src="' + camera.snapshot_url + '" id="nest-snapshot-' + camera.device_id +'"></img>';
                        camera_wrapper.appendChild(inner);
                    } else {
                        // camera has no snapshot
                        if (this.config.hideNoSnapshotCameras) {
                            showCamera = false;
                        } else {
                            camera_wrapper.classList.add('no-snapshot');
                            camera_wrapper.innerHTML = noSnapshotMessage;
                        }
                    }

                } else {
                    // camera is off
                    if (this.config.hideOfflineCameras) {
                        showCamera = false;
                    } else {
                        camera_wrapper.classList.add('no-snapshot', 'offline');
                        camera_wrapper.innerHTML = offlineMessage;
                    }

                }

            } else {
                // video mode

                if (isPublic && isStreaming) {
                    // camera is on with public video stream

                    var publicShareUrl = camera.public_share_url.replace('video.nest.com/live', 'video.nest.com/embedded/live');

                    // add hidden snapshot behind video (to size things correctly)
                    inner.innerHTML = '<img src="' +  camera.snapshot_url + '"></img>';

                    // add webview object with video stream
                    var webview = document.createElement('webview');
                    webview.setAttribute('src', publicShareUrl);
                    webview.setAttribute('nodeintegration', true);
                    webview.setAttribute('webpreferences', 'allowRunningInsecureContent, sandbox="allow-same-origin", webSecurity=false');
                    webview.setAttribute('disablewebsecurity', true);
                    webview.setAttribute('id', 'nest-stream' + camera.device_id);

                    // add experimental auto-playing
                    if (autoPlay) {
                        webview.setAttribute('preload', 'file://' + process.cwd() + '/modules/mmm-nest-cameras/autoplay-stream.js');

                        // so we get console status messages about the video
                        webview.addEventListener('console-message', function(e) {
                            console.log(e.message)
                        });

                    }

                    var stream = document.createElement('div');
                    stream.className = 'stream';

                    stream.appendChild(webview);
                    inner.appendChild(stream);
                    camera_wrapper.appendChild(inner);
                    camera_wrapper.classList.add('with-stream');

                } else if (isStreaming) {
                    // camera is on, but no public video stream

                    if (hasSnapshot) {
                        // camera has snapshot
                        inner.innerHTML = '<img src="' + camera.snapshot_url + '" id="nest-snapshot-' + camera.device_id +'"></img>';
                        camera_wrapper.appendChild(inner);
                    } else {
                        // camera has no snapshot
                        if (this.config.hideNoSnapshotCameras) {
                            showCamera = false;
                        } else {
                            camera_wrapper.classList.add('no-snapshot');
                            camera_wrapper.innerHTML = noSnapshotMessage;
                        }
                    }

                } else {
                    // camera is off
                    if (this.config.hideOfflineCameras) {
                        showCamera = false;
                    } else {
                        camera_wrapper.classList.add('no-snapshot', 'offline');
                        camera_wrapper.innerHTML = offlineMessage;
                    }

                }

            }

            if (showCamera) {
                camerasDisplayed++;

                if (!isOnline) {
                    var offline = document.createElement('span');
                    offline.className = 'offline-message xsmall';
                    camera_wrapper.classList.add('offline');
                    camera_wrapper.appendChild(offline-message);
                }

                if (camerasPerRow > 1) {
                    camera_wrapper.setAttribute('style', 'width: calc(' + Math.round((100/camerasPerRow) * 100) / 100 + '% - 20px);'); // due to the 10px margin around each camera
                }

                if (showNames) {
                    var title = document.createElement('span');
                    title.className = 'camera-name xsmall' + (isOnline ? ' bright' : '');
                    title.innerHTML = camera.name;
                    camera_wrapper.appendChild(title);
                }

                outer_wrapper.appendChild(camera_wrapper);

            }

        }

        if (camerasDisplayed < 1) {
            // no cameras to show based on user settings
            var cameraPre = this.cameras.length > 1 ? ' cameras' : 'camera';
            var cameraPost = this.cameras.length > 1 ? ' none of them are being shown.' : ' it is not being shown.';
            this.errMsg = 'You have ' + this.cameras.length + cameraPre + ' in your account, but due to your settings' + cameraPost;
            this.updateDom(this.config.animationSpeed);
        } else {
            return outer_wrapper;
        }

    },

    refreshDom: function() {
        // update image snapshots

        var numberOfCameras = this.cameras.length;
        var img;
        var imgId;
        var isNestAware;
        var forceUpdate;

        for (i = 0; i < numberOfCameras; i++) {

            camera = this.cameras[i];
            isNestAware = camera.is_video_history_enabled;
            forceUpdate = false;

            imgId = 'nest-snapshot-' + camera.device_id;
            img = document.getElementById(imgId);

            if (img) {
                this.updateSnapshot('nest-snapshot-' + camera.device_id, camera.snapshot_url);
            }

        }
    },

    updateSnapshot: function(id,src) {

        var newImg = new Image();
        var newImgSrc = src + '&time=' + new Date().getTime();
        newImg.src = newImgSrc;
        newImg.onload = function() {
            document.getElementById(id).setAttribute('src', newImgSrc);
        };

    },

    getData: function() {

        if ((this.motionSleep && !this.sleeping) || (!this.motionSleep)) {

            if (this.config.token === '') {
                this.errMsg = 'Please run getToken.sh and add your Nest API token to the MagicMirror config.js file.';
                this.updateDom(this.config.animationSpeed);
            } else {
                this.sendSocketNotification('MMM_NEST_CAMERAS_GET', {
                    token: this.config.token
                });
            }

        }

    },

    notificationReceived(notification, payload, sender) {

        /*
            Seeing that this module uses the same data as `mmm-nest-status`, let's wait until all
            modules have loaded to see if the user has also installed `mmm-nest-status`.

            If that's the case, we'll share the data from that socket instead of doing our
            own calls to the Nest API.

        */

        var self = this;

        if (notification === 'ALL_MODULES_STARTED') {

            // check if `mmm-nest-status` module is installed
            var nestStatusModule = MM.getModules().withClass('mmm-nest-status');
            this.usingNestStatusData = nestStatusModule.length > 0 ? true : false;

            // do the initial load if the `mmm-nest-status` module wasn't found
            if (!this.usingNestStatusData) {
                this.scheduleUpdate(this.config.initialLoadDelay);
            }

        } else if (notification === 'MMM_NEST_STATUS_UPDATE') {
            // use the data from the `mmm-nest-status` module
            this.processNestData(payload);

        } else if ((notification === 'USER_PRESENCE') && (this.config.motionSleep)) {
            if (payload === true) {
                if (this.sleeping) {
                    this.resumeModule();
                } else {
                    clearTimeout(self.sleepTimer);
                    self.sleepTimer = setTimeout(function() {
                        self.suspendModule()
                    }, self.config.motionSleepSeconds * 1000);
                }
            }
        }
    },


    socketNotificationReceived: function(notification, payload) {

        var self = this;

        if (notification === 'MMM_NEST_CAMERAS_DATA') {
            self.processNestData(payload);
            self.scheduleUpdate(self.config.updateInterval);
        } else if (notification === 'MMM_NEST_CAMERAS_DATA_ERROR') {
            self.errMsg = 'Nest API Error: ' + payload;
            self.updateDom(self.config.animationSpeed);
        } else if (notification === 'MMM_NEST_CAMERAS_DATA_BLOCKED') {
            // this is a specific error that occurs when the Nest API rate limit has been exceeded.
            // https://developers.nest.com/guides/api/data-rate-limits
            // we'll try again after 10 minutes
            setTimeout(function() {
                self.scheduleUpdate(self.config.updateInterval);
            }, 10 * 60 * 1000);
            self.errMsg = 'The Nest API rate limit has been exceeded.<br>This module will try to load data again in 10 minutes.';
            self.updateDom(self.config.animationSpeed);
        }
    },

    suspendModule: function() {

        var self = this;

        this.hide(self.config.animationSpeed, function() {
            self.sleeping = true;
        });

    },

    resumeModule: function() {

        var self = this;

        if (this.sleeping) {

            this.sleeping = false;

            // get new data
            if (!this.usingNestStatusData) {
                this.getData();
            }

            this.show(self.config.animationSpeed, function() {
                // restart timer
                clearTimeout(self.sleepTimer);
                self.sleepTimer = setTimeout(function() {
                    self.suspendModule()
                }, self.config.motionSleepSeconds * 1000);
            });
        }

    },

    processNestData: function(data) {

        var self = this;

        var oldCameras = this.cameras;
        var oldCamerasStatus = this.camerasStatus;
        var numberOfOldCameras = this.cameras.length;

        var cameras = [];
        var camerasStatus = [];
        var numberOfCameras = (data.devices && data.devices.cameras) ? Object.keys(data.devices.cameras).length : 0;

        var refreshDom = false;

        // convert object to an array for easier handling
        if (numberOfCameras > 0) {

            Object.keys(data.devices.cameras).forEach(function(key) {

                var camera = data.devices.cameras[key];
                var shouldShow = false;
                var cameraWhere = camera.where_name;

                if (self.isArray(self.config.camerasToShow)) {
                    for (var j=0; j < self.config.camerasToShow.length; j++) {
                        if (cameraWhere.toLowerCase().indexOf(self.config.camerasToShow[j].toLowerCase()) > -1) {
                            shouldShow = true;
                        }
                    }
                } else {
                    shouldShow = true;
                }

                if (shouldShow) {
                    camerasStatus.push({
                        device_id: camera.device_id,
                        is_online: camera.is_online,
                        is_streaming: camera.is_streaming,
                        is_public_share_enabled: camera.is_public_share_enabled
                    });
                    cameras.push(camera);
                }

            });

        }

        numberOfCameras = cameras.length; // update this here because cameras may have been filtered out
        if (numberOfCameras === 0) {
            if (self.isArray(self.config.camerasToShow)) {
                this.errMsg = 'There are either no Nest cameras in this account<br>or you did not enter the correct camera name(s) in the camerasToShow setting.';
            } else {
                this.errMsg = 'There are no Nest cameras in this account.';
            }
        } else {
            this.errMsg = '';
        }

        if (this.loaded) {

            /*
                Check to see if the status of the cameras have changed - if not, we'll
                simply refresh the camera snapshots instead of updating the entire DOM.
            */

            if (numberOfOldCameras !== numberOfCameras) {
                // number of cameras changed (update dom)
            } else if (this.errMsg !== '') {
                // no cameras (update dom)
            } else {
                // compare status of cameras (possible refresh)
                if (this.jsonEqual(oldCamerasStatus,camerasStatus)) {
                    refreshDom = true;
                }
            }

        }

        this.loaded = true;
        this.cameras = cameras;
        this.camerasStatus = camerasStatus;

        if (refreshDom) {
            // we don't want to re-render the DOM, just update any image snapshots
            this.refreshDom(this.config.animationSpeed);
        } else {
            this.updateDom(this.config.animationSpeed);
        }

    },

    // https://github.com/JedWatson/classnames/
    classNames: function() {
        var classes = [];

        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (!arg) continue;

            var argType = typeof arg;

            if (argType === 'string' || argType === 'number') {
                classes.push(arg);
            } else if (Array.isArray(arg) && arg.length) {
                var inner = classNames.apply(null, arg);
                if (inner) {
                    classes.push(inner);
                }
            } else if (argType === 'object') {
                for (var key in arg) {
                    if (hasOwn.call(arg, key) && arg[key]) {
                        classes.push(key);
                    }
                }
            }
        }

        return classes.join(' ');
    },

    isArray: function(val) {
        return Array.isArray(val);
    },

    jsonEqual: function(a,b) {
        return JSON.stringify(a) === JSON.stringify(b);
    },

    scheduleUpdate: function(delay) {

        var nextLoad = this.config.updateInterval;
        if (typeof delay !== 'undefined' && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setTimeout(function() {
            self.getData();
        }, nextLoad);
    }

});
