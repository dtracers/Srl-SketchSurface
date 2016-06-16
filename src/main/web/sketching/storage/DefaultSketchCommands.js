/*******************************************************************************
 * METHODS FOR THE REDO AND UNDO ARE BELOW.
 *
 * Each method is a prototype of the command or the update
 *
 * @overview This file holds the redo and undo methods for the default sketch command.
 ******************************************************************************/
define('DefaultSketchCommands', [ 'BaseCommands', 'sketchLibrary/ProtoSketchFramework',
        'protobufUtils/protobufUtils',
    'sketchLibrary/SrlStroke', 'sketchLibrary/SrlShape' ],
function(CommandException, SketchFramework, protoUtils, SrlStroke, SrlShape) {
    var ClassUtils = protoUtils.classUtils;
    var ProtoUtil = protoUtils.converterUtils;
    var exceptionUtils = protoUtils.exceptionUtils;

    var Commands = SketchFramework.Commands;

    /**
     * Removes all elements of the sketch.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.CLEAR, function() {
        var sketch = this.getLocalSketchSurface();
        var objects = sketch.resetSketch();
        this.decodedData = objects;
        return true;
    });

    /**
     * Adds all of the sketch data back.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.CLEAR, function() {
        var sketch = this.getLocalSketchSurface();
        sketch.addAllSubObjects(this.decodedData);
        this.decodedData = undefined;
        return true;
    });

    /**
     * Do nothing.
     *
     * @returns {Boolean} true.  because if we switch sketch we should probably do something about it.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.CREATE_SKETCH, function() {
        return true;
    });

    /**
     * Do nothing.
     *
     * @returns {Boolean} true.  because if we switch sketch we should probably do something about it.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.SWITCH_SKETCH, function() {
        return true;
    });

    /**
     * Do nothing.
     *
     * @returns {Boolean} true.  because if we switch sketch we should probably do something about it.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.CREATE_SKETCH, function() {
        return true;
    });

    /**
     * Do nothing.
     *
     * @returns {Boolean} true.  because if we switch sketch we should probably do something about it.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.SWITCH_SKETCH, function() {
        return true;
    });

    /**
     * Adds a stroke to this local sketch object.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ADD_STROKE, function() {
        if (!this.decodedData) {
            var stroke = ProtoUtil.decode(this.commandData, SrlStroke);
            this.decodedData = SrlStroke.createFromProtobuf(stroke);
        }
        this.getLocalSketchSurface().add(this.decodedData);
        return true;
    });

    /**
     * The undo method associated with adding a stroke to the sketch.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ADD_STROKE, function() {
        if (!this.decodedData) {
            var stroke = ProtoUtil.decode(this.commandData, SrlStroke);
            this.decodedData = SrlStroke.createFromProtobuf(stroke);
        }
        this.getLocalSketchSurface().removeSubObjectById(this.decodedData.getId());
        return true;
    });

    /**
     * Adds a shape to this local sketch object.
     *
     * @returns {Boolean} false. This will never ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ADD_SHAPE, function() {
        if (!this.decodedData) {
            var shape = ProtoUtil.decode(this.commandData, SrlShape);
            this.decodedData = SrlShape.createFromProtobuf(shape);
        }
        this.getLocalSketchSurface().add(this.decodedData);
        return false;
    });

    /**
     * Undoes adding a shape command which basically means it removes the shape.
     *
     * @returns {Boolean} false. This will never ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ADD_SHAPE, function() {
        if (!this.decodedData) {
            var shape = ProtoUtil.decode(this.commandData, SrlShape);
            this.decodedData = SrlShape.createFromProtobuf(shape);
        }
        this.getLocalSketchSurface().removeSubObjectById(this.decodedData.getId());
        this.getLocalSketchSurface().add(this.decodedData);
        return false;
    });

    /**
     * Removes an object from the {@code this.getLocalSketchSurface()}.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.REMOVE_OBJECT, function() {
        if (!this.decodedData || !isArray(this.decodedData)) {
            this.decodedData = [];
            var idChain = ProtoUtil.decode(this.commandData, ProtoSketchUtil.IdChain);
            this.decodedData[0] = idChain;
        }
        this.decodedData[1] = this.getLocalSketchSurface().removeSubObjectByIdChain(this.decodedData[0].idChain);
        return true;
    });

    /**
     * Undoes removing an object from the sketch Removes an object from the
     * {@code this.getLocalSketchSurface()}.
     *
     * @returns {Boolean} true. This will always ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.REMOVE_OBJECT, function() {
        if (!this.decodedData || !isArray(this.decodedData)) {
            this.decodedData = [];
            var idChain = ProtoUtil.decode(this.commandData, ProtoSketchUtil.IdChain);
            this.decodedData[0] = idChain;
        }
        this.getLocalSketchSurface().add(this.decodedData[1]);
        // this.decodedData[1];
        return true;
    });

    /**
     * Moves shapes from one shape to another shape.
     *
     * @returns {Boolean} false. This will never ask for the sketch to be
     *          redrawn. TODO: change it so that it knows what sketch it is
     *          associated with.
     */
    Commands.SrlCommand.addRedoMethod(Commands.CommandType.PACKAGE_SHAPE, function() {
        if (ClassUtils.isUndefined(this.decodedData) || (!this.decodedData)) {
            this.decodedData = ProtoUtil.decode(this.commandData, Commands.ActionPackageShape);
        }
        this.decodedData.redo(this.getLocalSketchSurface());
        return false;
    });

    /**
     * Moves shapes from one shape to another shape. But does the opposite as the redo package shape.
     *
     * @returns {Boolean} false. This will never ask for the sketch to be
     *          redrawn.
     */
    Commands.SrlCommand.addUndoMethod(Commands.CommandType.PACKAGE_SHAPE, function() {
        if (ClassUtils.isUndefined(this.decodedData) || (!this.decodedData)) {
            this.decodedData = ProtoUtil.decode(this.commandData, Commands.ActionPackageShape);
        }
        this.decodedData.undo(this.getLocalSketchSurface());
        return false;
    });

    /***************************************************************************
     * MARKER SPECIFIC UPDATES.
     **************************************************************************/

    /**
     * @returns {String} the human readable name of the given marker type.
     */
    Commands.Marker.prototype.getCommandTypeName = function() {
        switch (this.getType()) {
            case this.MarkerType.SUBMISSION:
                return 'SUBMISSION';
            case Commands.CommandType.FEEDBACK:
                return 'FEEDBACK';
            case Commands.CommandType.SAVE:
                return 'SAVE';
            case Commands.CommandType.SPLIT:
                return 'SPLIT';
            case Commands.CommandType.CLEAR:
                return 'CLEAR';
        }
        return 'NO_NAME # is: ' + this.getCommandType();
    };

    /***************************************************************************
     * Specific commands and their actions.
     **************************************************************************/

    /**
     * Moves the shapes from the old container to the new container.
     *
     * @param {SrlSketch} sketch - The sketch object that is being affected by these changes.
     */
    Commands.ActionPackageShape.prototype.redo = function(sketch) {

        if (this.newContainerId) {
            console.log('SHAPE ID: ', this.newContainerId.getIdChain());
        }

        var oldContainingObject = !(this.oldContainerId) ? sketch : sketch.getSubObjectByIdChain(this.oldContainerId.getIdChain());
        var newContainingObject = !(this.newContainerId) ? sketch : sketch.getSubObjectByIdChain(this.newContainerId.getIdChain());

        if (oldContainingObject === newContainingObject) {
            // done moving to same place.
            return;
        }
        for (var shapeIndex = 0; shapeIndex < this.shapesToBeContained.length; shapeIndex++) {
            var shapeId = this.shapesToBeContained[ shapeIndex ];
            var object = oldContainingObject.removeSubObjectById(shapeId);
            newContainingObject.add(object);
        }
    };

    /**
     * Moves the shapes from the new container to the old container.
     *
     * This is a reverse of the process used in redo.
     *
     * @param {SrlSketch} sketch - The sketch object that is being affected by these changes.
     */
    Commands.ActionPackageShape.prototype.undo = function(sketch) {
        var oldContainingObject = !(this.newContainerId) ? sketch : sketch.getSubObjectByIdChain(this.newContainerId.getIdChain());
        var newContainingObject = !(this.oldContainerId) ? sketch : sketch.getSubObjectByIdChain(this.oldContainerId.getIdChain());

        if (oldContainingObject === newContainingObject) {
            // done moving to same place.
            return;
        }

        for (var shapeId in this.shapesToBeContained) {
            if (this.shapesToBeContained.hasOwnProperty(shapeId)) {
                var object = oldContainingObject.removeSubObjectById(shapeId);
                newContainingObject.add(object);
            }
        }
    };

    // pass the up through the default exceptions
    return CommandException;

});
