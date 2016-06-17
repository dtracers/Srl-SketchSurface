/*jshint maxparams: 10 */
define('SketchSurface', [ 'UpdateManager', 'protobufUtils/classCreator', 'protobufUtils/sketchProtoConverter', 'sketchLibrary/SketchLibraryException',
    'SketchGraphics', 'SketchSurfaceManager', 'sketchLibrary/SrlSketch', 'sketchLibrary/ProtoSketchFramework', 'SketchInputListener' ],
function(UpdateManagerModule, ClassUtils, ProtoUtil, SketchException, Graphics, SketchSurfaceManager, SrlSketch, ProtoFramework, InputListener) {
    var CommandUtil = ProtoUtil.commands;
    var Commands = ProtoFramework.Commands;

    /**
     * The Sketch Surface is actually used as part of an element. But can be used
     * without actually being an element if you spoof some methods.
     *
     * Supported attributes.
     * <ul>
     * <li>data-existingList: This is meant to tell the surface that the update
     * list will be provided for it.</li>
     * <li>data-existingManager: This is meant to tell the surface that the update
     * manager will be provided for it. and to not bind an update manager</li>
     * <li>data-customId: This is meant to tell the surface that the Id of the
     * element will be provided to it and to not assign a random id to it.</li>
     * <li>data-readOnly: This tells the sketch surface to ignore any input and it
     * will only display sketches.</li>
     * <li>data-autoResize: This is meant to tell the sketch surface that it
     * should resize itself every time the window changes size.</li>
     * </ul>
     *
     * @class
     */
    function SketchSurface() {
        this.bindUpdateListCalled = false;

        /**
         * Draws the stroke then creates an update that is added to the update
         * manager, given a stroke.
         *
         * @param {SrlStroke} stroke - A stroke that is added to the sketch.
         */
        function addStrokeCallback(stroke) {

            var command = CommandUtil.createBaseCommand(Commands.CommandType.ADD_STROKE, true);
            command.commandData = stroke.toArrayBuffer();
            command.decodedData = stroke;
            var update = CommandUtil.createUpdateFromCommands([ command ]);
            this.updateManager.addUpdate(update);
        }

        /**
         * @param {InputListener} InputListenerClass - A class that represents an input listener.
         */
        this.initializeInput = function(InputListenerClass) {
            var InputClass = InputListenerClass;
            if (ClassUtils.isUndefined(InputListenerClass)) {
                InputClass = InputListener;
            }
            this.localInputListener = new InputClass();

            this.localInputListener.initializeCanvas(this, addStrokeCallback.bind(this), this.graphics);

            this.eventListenerElement = this.sketchCanvas;

            this.resizeSurface();
        };
    }

    SketchSurface.prototype = Object.create(HTMLElement.prototype);

    /**
     * @param {Element} templateClone - An element representing the data inside tag, its content
     *            has already been imported and then added to this element.
     */
    SketchSurface.prototype.initializeElement = function(templateClone) {
        var root = this.createShadowRoot();
        root.appendChild(templateClone);
        this.shadowRoot = this;
        document.body.appendChild(templateClone);
        this.sketchCanvas = this.shadowRoot.querySelector('#drawingCanvas');
    };

    /**
     * Called to initialize the sketch surface.
     *
     * Looks at attributes and sets up the sketch surface based on these attributes.
     *
     * @param {InputListener} InputListenerClass - The class used to listen for input.
     * @param {UpdateManager} UpdateManagerClass - The class used to manage updates to the sketch.
     */
    SketchSurface.prototype.initializeSurface = function(InputListenerClass, UpdateManagerClass) {
        /*jshint maxcomplexity:13 */
        this.initializeSketch();
        this.initializeGraphics();

        if (ClassUtils.isUndefined(this.dataset) || ClassUtils.isUndefined(this.dataset.readonly)) {
            this.initializeInput(InputListenerClass);
        }

        if (ClassUtils.isUndefined(this.dataset) || ClassUtils.isUndefined(this.dataset.customid) ||
                ClassUtils.isUndefined(this.id) || this.id === null || this.id === '') {
            this.id = ClassUtils.generateUuid();
        }

        if (ClassUtils.isUndefined(this.dataset) || ClassUtils.isUndefined(this.dataset.existingManager)) {
            this.bindToUpdateManager(UpdateManagerClass);
        }

        if (ClassUtils.isUndefined(this.dataset) || (ClassUtils.isUndefined(this.dataset.existinglist) &&
                ClassUtils.isUndefined(this.dataset.customid))) {
            this.createSketchUpdate();
        }

        if (!ClassUtils.isUndefined(this.dataset) && !(ClassUtils.isUndefined(this.dataset.autoresize))) {
            this.makeResizeable();
        }
        window.addEventListener('load', function() {
            this.resizeSurface();
        }.bind(this));
    };


    /**
     * Does some manual GC. TODO: unlink some circles manually.
     */
    SketchSurface.prototype.finalize = function() {
        this.updateManager.clearUpdates(false, true);
        this.updateManager = undefined;
        this.localInputListener = undefined;
        this.sketchEventConverter = undefined;
        this.sketch = undefined;
        this.sketchManager = undefined;
        this.graphics.finalize();
    };

    /**
     * Creates a sketch update in the update list if it is empty so the update
     * list knows what Id to assign to subsequent events.
     */
    SketchSurface.prototype.createSketchUpdate = function() {
        if (ClassUtils.isUndefined(this.id)) {
            this.id = ClassUtils.generateUuid();
        }
        if (!ClassUtils.isUndefined(this.updateManager) && this.updateManager.getListLength() <= 0) {
            var command = CommandUtil.createNewSketch(this.id, -1, -1, -1, -1);
            var update = CommandUtil.createUpdateFromCommands([ command ]);
            this.updateManager.addUpdate(update);
        }
    };

    /**
     * Sets the listener that is called when an error occurs.
     *
     * @param {Function} error - callback for when an error occurs.
     */
    SketchSurface.prototype.setErrorListener = function(error) {
        this.errorListener = error;
    };

    /**
     * @returns {SrlSketch} The sketch object used by this sketch surface.
     */
    SketchSurface.prototype.getCurrentSketch = function() {
        return this.sketchManager.getCurrentSketch();
    };

    /**
     * Binds the sketch surface to an update manager.
     *
     * @param {UpdateManager} UpdateManagerClass - This takes an either an instance of an update manager.
     * Or a update manager class that is then constructed.
     * You can only bind an update list to a sketch once.
     */
    SketchSurface.prototype.bindToUpdateManager = function(UpdateManagerClass) {
        if (this.bindUpdateListCalled === false) {
            this.updateManager = undefined;
        }

        if (ClassUtils.isUndefined(this.updateManager)) {
            if (UpdateManagerClass instanceof UpdateManagerModule.UpdateManager) {
                this.updateManager = UpdateManagerClass;
            } else {
                this.updateManager = new UpdateManagerModule.UpdateManager(this.sketchManager, this.errorListener);
            }
            this.bindUpdateListCalled = true;
            // sets up the plugin that draws the strokes as they are added to the update list.
            this.updateManager.addPlugin(this.graphics);
        } else {
            throw new Error('Update list is already defined');
        }
    };


    /**
     * Resize the canvas so that its dimensions are the same as the css dimensions.  (this makes it a 1-1 ratio).
     */
    SketchSurface.prototype.resizeSurface = function() {
        this.sketchCanvas.height = $(this.sketchCanvas).height();
        this.sketchCanvas.width = $(this.sketchCanvas).width();
    };

    /**
     * Binds a function that resizes the surface every time the size of the window changes.
     */
    SketchSurface.prototype.makeResizeable = function() {
        $(window).resize(function() {
            this.resizeSurface();
            this.graphics.correctSize();
        }.bind(this));
    };

    /**
     * Initializes the sketch and resets all values.
     */
    SketchSurface.prototype.initializeSketch = function() {
        this.sketchManager = new SketchSurfaceManager(this);
        this.updateManager = undefined;
        this.bindUpdateListCalled = false;
        this.sketchManager.setParentSketch(new SrlSketch());
        this.eventListenerElement = undefined;
    };

    /**
     * Initializes the graphics for the sketch surface.
     */
    SketchSurface.prototype.initializeGraphics = function() {
        this.graphics = new Graphics(this.sketchCanvas, this.sketchManager);
    };

    /**
     * Returns the element that listens to the input events.
     */
    SketchSurface.prototype.getElementForEvents = function() {
        return this.eventListenerElement;
    };

    /**
     * @returns {Element} The element where the sketch is drawn to.
     */
    SketchSurface.prototype.getElementForDrawing = function() {
        return this.sketchCanvas;
    };

    /**
     * @returns {SrlUpdateList} The update list of the element.
     */
    SketchSurface.prototype.getUpdateList = function() {
        return this.updateManager.getUpdateList();
    };

    /**
     * @returns {UpdateManager} Returns the manager for this sketch surface.
     */
    SketchSurface.prototype.getUpdateManager = function() {
        return this.updateManager;
    };

    /**
     * This is a cleaned version of the list and modifying this list will not affect the update manager list.
     *
     * @return {SrlUpdateList} proto object.
     */
    SketchSurface.prototype.getSrlUpdateListProto = function() {
        var updateProto = CourseSketch.prutil.SrlUpdateList();
        updateProto.list = this.updateManager.getUpdateList();
        return ProtoUtil.decode(updateProto.toArrayBuffer(), Commands.SrlUpdateList);
    };

    /**
     * Redraws the sketch so it is visible on the screen.
     */
    SketchSurface.prototype.refreshSketch = function() {
        this.graphics.loadSketch();
    };

    /**
     * @returns {module:SketchGraphics} The graphics used by this sketch surface.
     */
    SketchSurface.prototype.getGraphics = function() {
        return this.graphics;
    };

    /**
     * Extracts the canvas id from the sketch list.
     *
     * @param {SrlUpdateList} updateList - The update list from which the id is being extracted.
     */
    SketchSurface.prototype.extractIdFromList = function(updateList) {
        var update = updateList[0];
        if (!ClassUtils.isUndefined(update)) {
            var firstCommand = update.commands[0];
            if (firstCommand.commandType === Commands.CommandType.CREATE_SKETCH) {
                var sketch = ProtoUtil.decode(firstCommand.commandData,
                    Commands.ActionCreateSketch);
                this.id = sketch.sketchId.idChain[0];
                this.sketchManager.setParentSketchId(this.id);
            }
        }
    };

    /**
     * Loads all of the updates into the sketch.
     * This should only be done after the sketch surface is inserted into the dom.
     *
     * @param {Array<SrlUpdate>} updateList - The update list that is being loaded into the update manager.
     * @param {PercentBar} percentBar - The object that is used to update how much of the sketch is updated.
     * @param {Function} finishedCallback - called when the sketch is done loading.
     */
    SketchSurface.prototype.loadUpdateList = function(updateList, percentBar, finishedCallback) {
        try {
            this.extractIdFromList(updateList);
        } catch (exception) {
            console.error(exception);
            throw exception;
        }
        this.updateManager.setUpdateList(updateList, percentBar, finishedCallback);
    };

    /**
     * Tells the sketch surface to fill the screen so it is completely visible.
     * This currently is only allowed on read-only canvases.
     */
    SketchSurface.prototype.fillCanvas = function() {
        if (ClassUtils.isUndefined(this.dataset) || ClassUtils.isUndefined(this.dataset.readonly)) {
            throw new SketchException('This can only be performed on read only sketch surfaces');
        }
    };
    return SketchSurface;
});
