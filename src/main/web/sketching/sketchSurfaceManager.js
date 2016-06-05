define(['protobufUtils/classCreator', 'sketchLibrary/SrlSketch'], function (ClassUtils, SrlSketch) {
    /**
     * This file contains all of the resources for managing sketches.
     *
     * @class
     * @param {SketchSurface} sketchSurface - The surface that is being managed.
     */
    return function SketchSurfaceManager(sketchSurface) {
        var sketchMap = new Map();
        var parentSketch = undefined;

        /**
         * @type {SrlSketch}
         */
        var currentSketch = undefined;

        /**
         * Sets the parent sketch.
         *
         * @param {SrlSketch} sketch - The top level sketch.
         */
        this.setParentSketch = function (sketch) {
            parentSketch = sketch;
            if (ClassUtils.isUndefined(currentSketch)) {
                currentSketch = sketch;
            }
        };

        /**
         * Sets the id of the parent sketch.
         * A sketch surface can contain multiple sketches but the first sketch object created is the parent sketch.
         *
         * @param {UUID} id - The id of the parent sketch.
         */
        this.setParentSketchId = function (id) {
            parentSketch.id = id;
            this.setSketch(parentSketch);
        };

        /**
         * Adds the sketch with its Id to the list of sketches related to this sketch surface.
         * (replaces an old sketch with the same id if it already exist in the list).
         *
         * @param {SrlSketch} sketch - The sketch that is being set.
         */
        this.setSketch = function (sketch) {
            if (ClassUtils.isUndefined(sketch.id)) {
                // TODO: change to exception object
                throw 'id must be defined to add it.';
            }
            sketchMap.set(sketch.id, sketch);
        };

        /**
         * @param {UUID} id - The id of the sketch that is being grabbed.
         * @returns {SrlSketch} a sketch based off of its id.
         */
        this.getSketch = function (id) {
            return sketchMap.get(id);
        };

        /**
         * Creates a new sketch with the given id.
         * NOTE: this does not change what the current sketch is pointed to.
         *
         * @param {UUID} id - The of the new sketch.
         * @param {SrlSketch} sketchData - currently ignored.
         */
        this.createSketch = function (id, sketchData) {
            var sketch = new SrlSketch();
            sketch.id = id;
            this.setSketch(sketch);
        };

        /**
         * Sets the current sketch for input and drawing to the one specified by the given id.
         *
         * @param {UUID} id - the id of the sketch to take input and drawing.
         */
        this.setCurrentSketch = function (id) {
            currentSketch = this.getSketch(id);
        };

        /**
         * @returns {SrlSketch} The current sketch that is being used by this sketch surface.
         */
        this.getCurrentSketch = function () {
            return currentSketch;
        };

        /**
         * Deletes the sketch from the list of possible sketches.
         *
         * @param {UUID} id - the id of the sketch to be removed.
         */
        this.deleteSketch = function (id) {
            sketchMap.delete(id);
        };
    }
});
