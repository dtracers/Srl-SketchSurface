define('RealTimeSketchPlayback', [ 'CallbackBarrier/CallbackBarrier', 'sketchLibrary/ProtoSketchFramework',
        'protobufUtils/protobufUtils', 'sketchLibrary/SketchLibraryException' ],
function(CallbackBarrier, SketchFramework, protoUtils, SketchException) {

    var Commands = SketchFramework.Commands;
    var ClassUtils = protoUtils.classUtils;

    /**
     * Plays back the user's commands from the beginning.
     * Strokes are drawn in real time, in sequence.
     * The other commands, such as undo/redo/clear are also called in sequence.
     *
     * @param {module:UpdateManager.UpdateManager} updateManager - The manager of the updates.
     * @param {Graphics} graphics - Used to draw objects to the screen.
     */
    function Playback(updateManager, graphics) {
        var ps = graphics.getPaper();
        var currentIndex = -1;
        var length = undefined;
        var updateList = undefined;

        /**
         * The id of this plugin.
         *
         * @type {String}
         */
        var pluginId = 'Playback Plugin';

        /**
         * Whether or not the sketching is currently playing back.
         *
         * @type {Boolean}
         */
        var isPlaying = false;

        var disable = false;

        /**
         * Whether or not the sketch was paused in the middle of a stroke.
         *
         * @type {Boolean}
         */
        var pauseDuringStroke = false;

        /**
         * Keeps track of the last index the playback was on when it paused.
         *
         * @type {Integer}
         */
        var lastPausedIndex = Number.MAX_VALUE;

        /**
         * Last stroke that was played back.
         *
         * @type {PaperStroke}
         */
        var lastCreatedStroke = undefined;

        /**
         * Last point that was added to the canvas.
         *
         * @type {SrlPoint}
         */
        var lastPointAdded = undefined;
        var pointList = undefined;

        var startingTime = undefined;

        /**
         * @returns {String} The plugin id of this plugin.
         */
        this.getPluginId = function() {
            return pluginId;
        };

        /**
         * Called when the {@link UpdateManager} adds an update.
         *
         * @param {SrlUpdate} update - The update to be sent to thee recognition server.
         * @param {Boolean} redraw - True if this update is needing to redraw the surface
         * @param {Number} updateIndex - The index of the update.
         * @param {Number} updateType - The type of the update.
         * @param {String} updatePluginId - The id of the plugin that created this specific update.
         */
        this.addUpdate = function(update, redraw, updateIndex, updateType, updatePluginId) {
            if (disable) {
                return;
            }
            var commandList = update.commands;

            /**
             * Sets up a barrier for the commands.
             * Calls playNext after all strokes are finished.
             */
            var commandBarrier = new CallbackBarrier();
            var commandFinished = commandBarrier.getCallbackAmount(commandList.length);
            commandBarrier.finalize(this.playNext);

            /*
             * Runs through all of the commands in the update.
             */
            for (var i = 0; i < commandList.length; i++) {
                var command = commandList[i];
                if (command.commandType === Commands.CommandType.ADD_STROKE && isPlaying) {
                    (function() {
                        var stroke = command.decodedData;
                        pointList = stroke.getPoints();

                        // set up the barrier...
                        var strokeBarrier = new CallbackBarrier();
                        var pointAdded = strokeBarrier.getCallbackAmount(pointList.length);
                        var strokePath = new ps.Path({
                            strokeWidth: 2,
                            strokeCap: 'round',
                            selected: false,
                            strokeColor: 'black'
                        });
                        if (pauseDuringStroke) {
                            pointAdded = lastPointAdded;
                            strokePath = lastCreatedStroke;
                        }
                        strokeBarrier.finalize(function() {
                            strokePath.simplify();
                            commandFinished();
                        });

                        var startingTime = pointList[0].getTime();
                        var timeOut;
                        var timeOutList = [];
                        var startingIndex = 0;
                        if (pauseDuringStroke) {
                            startingIndex = lastPausedIndex;
                            pauseDuringStroke = false;
                            lastPausedIndex = Number.MAX_VALUE;
                        }
                        for (var pointIndex = startingIndex; pointIndex < pointList.length; pointIndex++) {
                            (function(index) {
                                timeOut = setTimeout(function() {
                                    if (isPlaying) {
                                        strokePath.add(new ps.Point(pointList[index].getX(), pointList[index].getY()));
                                        graphics.getPaper().view.update();
                                        pointAdded();
                                    } else if (!isPlaying) { //pause during the stroke
                                        for (var j = 0; j < timeOutList.length; j++) {
                                            clearTimeout(timeOutList[j]);
                                        }
                                        if (lastPausedIndex > index) {
                                            lastPausedIndex = index;
                                        }
                                        lastCreatedStroke = strokePath;
                                        lastPointAdded = pointAdded;
                                        pauseDuringStroke = true;

                                    }
                                }, pointList[index].getTime() - startingTime);
                                timeOutList.push(timeOut);
                            })(pointIndex);
                        } // end of for loop
                    })();
                } else {
                    if (redraw) {
                        graphics.getPaper().view.update();
                    }
                    commandFinished();
                }
            }
        };

        /**
         * Calculates time between strokes and plays them back with a delay corresponding to this time.
         *
         * Also playback the sketch back from saved stroke index if it is paused.
         *
         * @param {Long} startTime - the time for when the sketch started.
         * @param {SketchSurface} surface - the surface.
         */
        this.playNext = function(startTime, surface) {
            if (!ClassUtils.isUndefined(startTime)) {
                startingTime = startTime;
            }
            graphics.setDrawUpdate(false);
            currentIndex++;
            if (currentIndex === 0) {
                graphics.getPaper().project.activeLayer.removeChildren();
                graphics.getPaper().view.update();
            }
            if (currentIndex >= length) {
                graphics.setDrawUpdate(true);
                // if we are done drawing then we should disable to prevent over drawing.
                disable = true;
                return;
            }
            var currentTime = (new Date().getTime());

            isPlaying = true;
            if (!pauseDuringStroke) {
                /*
                 * Time passed from start to current stroke.
                 */
                var playTime = currentTime - startingTime;

                /*
                 * Time of the next stroke.
                 */
                var updateTime = ((updateList[currentIndex].getTime()).subtract(updateList[0].getTime())).toNumber();

                /*
                 * Time between the last played stroke and the next one.
                 */
                var delayTime = updateTime - playTime;
                if (currentIndex === 1 || currentIndex === 0) {
                    delayTime = 0;
                }
                setTimeout(function() {
                    updateManager.addUpdate(updateList[currentIndex]);
                }, delayTime);
            } else {
                this.addUpdate(updateList[currentIndex], true, currentIndex);
            }
        };

        /**
         * Set isPlaying to false and pause the drawing.
         */
        this.pauseNext = function() {
            currentIndex--;
            isPlaying = false;
            disable = true;
        };

        /**
         * Resets the playback with a new update list, but the same manager.
         *
         * @param {Array<SrlUpdate>} newUpdateList - The update list that is being played back.
         */
        this.initialize = function(newUpdateList) {
            updateManager.clearUpdates(false);
            updateList = newUpdateList;
            length = updateList.length;
            currentIndex = -1;
            isPlaying = false;
            pauseDuringStroke = false;
            lastPausedIndex = Number.MAX_VALUE;
            lastCreatedStroke = undefined;
            lastPointAdded = undefined;
            pointList = undefined;
            startingTime = undefined;
            disable = false;
        };
    }

    /**
     * Plays back the user's commands from the beginning.
     *
     * Strokes are drawn in real time, in sequence.
     * The other commands, such as undo/redo/clear are also called in sequence.
     *
     * @param {module:SketchSurface} sketchSurface - The sketch surface this playback is being created with.
     */
    return {
        createSketchPlaybackPlugin: function createSketchPlaybackPlugin(sketchSurface) {
            var playback = new Playback(sketchSurface.getUpdateManager(), sketchSurface.getGraphics());
            return playback;
        },
        Playback: Playback
    }
});
