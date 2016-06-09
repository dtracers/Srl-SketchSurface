/**
 * Adds a couple of really useful methods to the commands. Depends on
 * {@code /src/utilities/connection/protobufInclude.html}.
 */
define('BaseCommands', [ 'generated_proto/commands', 'generated_proto/sketchUtil', 'protobufUtils/sketchProtoConverter',
    'protobufUtils/classCreator',
    'sketchLibrary/SketchLibraryException' ],
function(ProtoCommands, ProtoSketchUtil, ProtoUtil, ClassUtils, SketchException) {
    var Commands = ProtoCommands.protobuf.srl.commands;
    var CommandUtil = ProtoUtil.commands;

    /**
     * @class CommandException
     * @extends BaseException
     */
    function CommandException(message, cause) {
        this.superConstructor(message, cause);
        this.name = 'CommandException';
    }
    ClassUtils.Inherits(CommandException, SketchException);

    var ProtoSrlUpdate = Commands.SrlUpdate.prototype;
    var ProtoSrlCommand = Commands.SrlCommand.prototype;

    Commands.SrlCommand.prototype.sketchId = undefined;
    Commands.SrlUpdate.prototype.sketchId = undefined;

    // these functions should not be created more than once in the entirety of the program.
    if (!ClassUtils.isUndefined(ProtoSrlCommand.getLocalSketchSurface)) {
        return;
    }

    /**
     * Calls redo on an {@link SrlCommand} list in the order they are added to the list.
     *
     * @returns {Boolean} true if the sketch needs to be redrawn, false
     *          otherwise.
     *
     * @memberof SrlUpdate
     * @function redo
     * @instance
     */
    Commands.SrlUpdate.prototype.redo = function() {
        var redraw = false;
        var commandList = this.getCommands();
        var commandLength = commandList.length;
        var getLocalSketchSurface = function() {
            return this.sketchManager.getCurrentSketch();
        }.bind(this);
        for (var i = 0; i < commandLength; i++) {
            var command = commandList[i];
            // the command needs to know what sketch object to act upon.
            command.getLocalSketchSurface = getLocalSketchSurface;
            if (command.redo() === true) {
                redraw = true;
            }
        }
        return redraw;
    };

    /**
     * Calls undo on an {@link SrlCommand} list in the reverse of the order they are added to the list.
     *
     * <b>Note</b> that we do not add the methods we added in redo.
     * This is because we assert that you can not undo something until it has been redone first.  So the methods already exist.
     *
     * @returns {Boolean} true if the sketch needs to be redrawn, false otherwise.
     *
     * @memberof SrlUpdate
     * @function undo
     * @instance
     */
    Commands.SrlUpdate.prototype.undo = function() {
        var commandList = this.getCommands();
        var commandLength = commandList.length;
        var redraw = false;
        for (var i = commandLength - 1; i >= 0; i--) {
            commandList[i].sketchId = this.sketchId;
            if (commandList[i].undo() === true) {
                redraw = true;
            }
        }
        return redraw;
    };

    /**
     * @memberof SrlCommand
     * @function getCommandTypeName
     * @instance
     * @returns {String} The human readable name of the given command type.
     */
    ProtoSrlCommand.getCommandTypeName = function() {
        var commandType = this.getCommandType();
        for (var type in Commands.CommandType) {
            if (Commands.CommandType[type] === commandType) {
                return '' + type;
            }
        }
        throw new CommandException('The assigned type (' + commandType + ') is not a value for enum CommandType');
    };

    ProtoSrlCommand.decodedData = false;

    /**
     * Redoes the specific command.  How the command is redone depends on the command type.
     *
     * @memberof SrlCommand
     * @function redo
     * @instance
     * @returns {Boolean} true if redoing the command requires a redraw of the screen.
     */
    ProtoSrlCommand.redo = function() {
        var redoFunc = this[ 'redo' + this.getCommandType()];
        if (ClassUtils.isUndefined(redoFunc)) {
            throw (this.getCommandTypeName() + ' is not defined as a redo function');
        }
        return redoFunc.bind(this)();
    };

    /**
     * Undoes the specific command.  How the command is undone depends on the command type.
     *
     * @memberof SrlCommand
     * @function undo
     * @instance
     * @returns {Boolean} true if undoing the command requires a redraw of the screen.
     */
    ProtoSrlCommand.undo = function() {
        var undoFunc = this[ 'undo' + this.getCommandType()];
        if (ClassUtils.isUndefined(undoFunc)) {
            throw (this.getCommandTypeName() + ' is not defined as an undo function');
        }
        return undoFunc.bind(this)();
    };

    /**
     * Allows one to dynamically add and remove methods to the command type.
     *
     * @memberof SrlCommand
     * @static
     * @function addRedoMethod
     * @param {CommandType} commandType - The type of command that is being added.
     * @param {Function} func - The function that is called when redo method is called.
     */
    Commands.SrlCommand.addRedoMethod = function(commandType, func) {
        if (ClassUtils.isUndefined(commandType)) {
            throw new CommandException('The input commandType can not be undefined');
        }
        if (!ClassUtils.isUndefined(ProtoSrlCommand[ 'redo' + commandType])) {
            throw new CommandException('Method is already defined');
        }
        ProtoSrlCommand[ 'redo' + commandType] = func;
    };

    /**
     * Allows one to dynamically add and remove methods to the command type.
     *
     * @memberof SrlCommand
     * @static
     * @function removeRedoMethod
     * @param {CommandType} commandType - The type of command that is being removed.
     */
    Commands.SrlCommand.removeRedoMethod = function(commandType) {
        if (ClassUtils.isUndefined(commandType)) {
            throw new CommandException('The input commandType can not be undefined');
        }
        if (ClassUtils.isUndefined(ProtoSrlCommand[ 'redo' + commandType])) {
            throw new CommandException('Method does not exist');
        }
        ProtoSrlCommand[ 'redo' + commandType] = undefined;
    };

    /**
     * Allows one to dynamically add and remove methods to the command type.
     *
     * @memberof SrlCommand
     * @static
     * @function addUndoMethod
     * @param {CommandType} commandType - The type of command that is being added.
     * @param {Function} func - The function that is called when undo method is called.
     */
    Commands.SrlCommand.addUndoMethod = function(commandType, func) {
        if (ClassUtils.isUndefined(commandType)) {
            throw new CommandException('The input commandType can not be undefined');
        }
        if (!ClassUtils.isUndefined(ProtoSrlCommand[ 'undo' + commandType])) {
            throw new CommandException('Method is already defined');
        }
        ProtoSrlCommand[ 'undo' + commandType] = func;
    };

    /**
     * Allows one to dynamically add and remove methods to the command type.
     *
     * @memberof SrlCommand
     * @static
     * @function removeUndoMethod
     * @param {CommandType} commandType - The type of command that is being removed.
     */
    Commands.SrlCommand.removeUndoMethod = function(commandType) {
        if (ClassUtils.isUndefined(commandType)) {
            throw new CommandException('The input commandType can not be undefined');
        }
        if (ClassUtils.isUndefined(ProtoSrlCommand[ 'undo' + commandType])) {
            throw new CommandException('Method does not exist');
        }
        ProtoSrlCommand[ 'undo' + commandType] = undefined;
    };

    return CommandException;
});
