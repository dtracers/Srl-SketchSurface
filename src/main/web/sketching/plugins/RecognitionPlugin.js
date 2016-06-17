define('RecognitionPlugin', [], function() {
    /**
     * A plugin used to send updates to the server.
     *
     * @class RecognitionPlugin
     * @param {UpdateManager} updateManager - The manager of the update that results are added to.
     * @param {UUID} sketchId - The id of the sketch that this recognition plugin is being created for.
     * @param {RecognitionManager} recognitionManager - Where the updates get submitted for recognition.
     */
    function RecognitionPlugin(updateManager, sketchId, recognitionManager) {

        /**
         * The id of this plugin.
         *
         * @type {String}
         */
        var pluginId = 'Recognition Plugin';

        /**
         * @returns {String} The plugin id of this plugin.
         */
        this.getPluginId = function() {
            return pluginId;
        };

        /**
         * Holds the list of updates that are waiting to be sent to the server.
         *
         * This list should almost always be near empty.
         */
        var queuedServerUpdates = [];

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
            if (updatePluginId !== pluginId) {
                recognitionManager.addUpdate(sketchId, update, function(err, msg) {
                    if ((!ClassUtils.isUndefined(err) && err !== null) || isUndefined(msg)) {
                        return;
                    }
                    var updateList = msg.changes;
                    var updates = updateList.list;
                    for (var i = 0; i < updates.length; i++) {
                        var recognition_update = updates[i];
                        updateManager.addUpdate(recognition_update, pluginId);
                    }
                });
            }
        };
    }

    /**
     * Creates a recognition plugin for this specific recognition manager and sketchId.
     *
     * @param {UpdateManager} updateManager - The manager of the update that results are added to.
     * @param {UUID} sketchId - The id of the sketch that this recognition plugin is being created for.
     * @param {RecognitionManager} recognitionManager - Where the updates get submitted for recognition.
     * @returns {RecognitionPlugin} An instance of the recognition plugin.
     */
    return function createRecognitionPlugin(updateManager, sketchId, recognitionManager) {
        return new RecognitionPlugin(updateManager, sketchId, recognitionManager);
    };
});
