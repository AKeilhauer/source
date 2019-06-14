"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var file_system_1 = require("tns-core-modules/file-system");
var types_1 = require("tns-core-modules/utils/types");
var common_1 = require("../common");
var options_1 = require("../options");
var TNSPlayer = (function (_super) {
    __extends(TNSPlayer, _super);
    function TNSPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TNSPlayer.prototype, "events", {
        get: function () {
            if (!this._events) {
                this._events = new observable_1.Observable();
            }
            return this._events;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNSPlayer.prototype, "ios", {
        get: function () {
            return this._player;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNSPlayer.prototype, "debug", {
        set: function (value) {
            common_1.TNSPlayerUtil.debug = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNSPlayer.prototype, "volume", {
        get: function () {
            return this._player ? this._player.volume : 0;
        },
        set: function (value) {
            if (this._player && value >= 0) {
                this._player.volume = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNSPlayer.prototype, "duration", {
        get: function () {
            if (this._player && this._player.currentItem) {
                var seconds = CMTimeGetSeconds(this._player.currentItem.asset.duration);
                var milliseconds = seconds * 1000.0;
                return milliseconds;
            }
            else {
                return 0;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNSPlayer.prototype, "currentTime", {
        get: function () {
            if (this._player && this._player.currentItem) {
                return ((this._player.currentTime().value /
                    this._player.currentTime().timescale) *
                    1000);
            }
            else {
                return 0;
            }
        },
        enumerable: true,
        configurable: true
    });
    TNSPlayer.prototype.initFromFile = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.autoPlay = false;
            _this.playFromFile(options).then(resolve, reject);
        });
    };
    TNSPlayer.prototype.playFromFile = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._statusObserver = PlayerObserverClass.alloc();
                _this._statusObserver['_owner'] = _this;
                var fileName = types_1.isString(options.audioFile)
                    ? options.audioFile.trim()
                    : '';
                if (fileName.indexOf('~/') === 0) {
                    fileName = file_system_1.path.join(file_system_1.knownFolders.currentApp().path, fileName.replace('~/', ''));
                }
                common_1.TNS_Player_Log('fileName', fileName);
                _this._setIOSAudioSessionOutput();
                _this._setupPlayerItem(fileName, true);
                if (options.loop) {
                    NSNotificationCenter.defaultCenter.addObserverSelectorNameObject(_this, 'playerItemDidReachEnd', AVPlayerItemDidPlayToEndTimeNotification, _this._player.currentItem);
                }
                if (options.autoPlay) {
                    _this._player.play();
                }
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.playerItemDidReachEnd = function () {
        if (this._player) {
            this._player.seekToTime(kCMTimeZero);
            this._player.play();
        }
    };
    TNSPlayer.prototype.initFromUrl = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.autoPlay = false;
            _this.playFromUrl(options).then(resolve, reject);
        });
    };
    TNSPlayer.prototype.playFromUrl = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._statusObserver = PlayerObserverClass.alloc();
                _this._statusObserver['_owner'] = _this;
                _this._setIOSAudioSessionOutput();
                _this._setupPlayerItem(options.audioFile, false);
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player &&
                    _this._player.timeControlStatus === 2) {
                    common_1.TNS_Player_Log('pausing player...');
                    _this._player.pause();
                    resolve(true);
                }
            }
            catch (ex) {
                common_1.TNS_Player_Log('pause error', ex);
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.play = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!_this.isAudioPlaying()) {
                    common_1.TNS_Player_Log('player play...');
                    _this._player.play();
                    resolve(true);
                }
            }
            catch (ex) {
                common_1.TNS_Player_Log('play error', ex);
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.resume = function () {
        if (this._player && this._player.currentItem) {
            common_1.TNS_Player_Log('resuming player...');
            this._player.play();
        }
    };
    TNSPlayer.prototype.playAtTime = function (time) {
        if (this._player && this._player.currentItem) {
            common_1.TNS_Player_Log('playAtTime', time);
            this._player.seekToTime(CMTimeMakeWithSeconds(time, 1000));
        }
    };
    TNSPlayer.prototype.seekTo = function (time) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player.currentItem &&
                    _this._player.currentItem.status === 1) {
                    common_1.TNS_Player_Log('seekTo', time);
                    _this._player.seekToTime(CMTimeMakeWithSeconds(time, 1000));
                    resolve(true);
                }
            }
            catch (ex) {
                common_1.TNS_Player_Log('seekTo error', ex);
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.dispose = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                common_1.TNS_Player_Log('disposing TNSPlayer...');
                if (_this._player) {
                    if (_this._player.currentItem) {
                        _this._removeStatusObserver(_this._player.currentItem);
                    }
                    _this._player.pause();
                    _this._player.replaceCurrentItemWithPlayerItem(null);
                    _this._player = null;
                }
                resolve();
            }
            catch (ex) {
                common_1.TNS_Player_Log('dispose error', ex);
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.isAudioPlaying = function () {
        return this._player &&
            this._player.timeControlStatus === 2
            ? true
            : false;
    };
    TNSPlayer.prototype.getAudioTrackDuration = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var seconds = CMTimeGetSeconds(_this._player.currentItem.asset.duration);
                var milliseconds = seconds * 1000.0;
                common_1.TNS_Player_Log('audio track duration', milliseconds);
                resolve(milliseconds.toString());
            }
            catch (ex) {
                common_1.TNS_Player_Log('getAudioTrackDuration error', ex);
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.changePlayerSpeed = function (speed) {
        if (this._player && speed) {
            if (typeof speed === 'string') {
                speed = parseFloat(speed);
            }
            this._player.rate = speed;
        }
    };
    TNSPlayer.prototype._sendEvent = function (eventName, data) {
        if (this.events) {
            this.events.notify({
                eventName: eventName,
                object: this,
                data: data
            });
        }
    };
    TNSPlayer.prototype._setupPlayerItem = function (audioUrl, isLocalFile) {
        var url;
        if (isLocalFile) {
            url = NSURL.fileURLWithPath(audioUrl);
        }
        else {
            url = NSURL.URLWithString(audioUrl);
        }
        var avAsset = AVURLAsset.URLAssetWithURLOptions(url, null);
        var playerItem = AVPlayerItem.playerItemWithAsset(avAsset);
        if (this._player && this._player.currentItem) {
            this._player.replaceCurrentItemWithPlayerItem(playerItem);
        }
        else {
            this._player = AVPlayer.playerWithPlayerItem(playerItem);
            this._player.automaticallyWaitsToMinimizeStalling = false;
        }
        this._addStatusObserver(playerItem);
    };
    TNSPlayer.prototype._setIOSAudioSessionOutput = function () {
        var audioSession = AVAudioSession.sharedInstance();
        var output = audioSession.currentRoute.outputs.lastObject.portType;
        common_1.TNS_Player_Log('output', output);
        if (output.match(/Receiver/)) {
            try {
                audioSession.setCategoryError(AVAudioSessionCategoryPlayAndRecord);
                audioSession.overrideOutputAudioPortError(1936747378);
                audioSession.setActiveError(true);
                common_1.TNS_Player_Log('audioSession category set and active');
            }
            catch (err) {
                common_1.TNS_Player_Log('setting audioSession category failed');
            }
        }
    };
    TNSPlayer.prototype._addStatusObserver = function (currentItem) {
        this._statusObserverActive = true;
        currentItem.addObserverForKeyPathOptionsContext(this._statusObserver, 'status', 0, null);
    };
    TNSPlayer.prototype._removeStatusObserver = function (currentItem) {
        if (!this._statusObserverActive) {
            return;
        }
        this._statusObserverActive = false;
        if (currentItem) {
            currentItem.removeObserverForKeyPath(this._statusObserver, 'status');
        }
    };
    return TNSPlayer;
}(NSObject));
exports.TNSPlayer = TNSPlayer;
var PlayerObserverClass = (function (_super) {
    __extends(PlayerObserverClass, _super);
    function PlayerObserverClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlayerObserverClass.prototype.observeValueForKeyPathOfObjectChangeContext = function (path, obj, change, context) {
        if (path === 'status') {
            if (this['_owner']._player.currentItem.status ===
                1) {
                this['_owner']._sendEvent(options_1.AudioPlayerEvents.ready);
                this['_owner']._player.play();
            }
        }
    };
    return PlayerObserverClass;
}(NSObject));
