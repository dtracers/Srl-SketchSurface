try {
    require('node-define');
    require('node-amd-require');
    require('requirejs');
} catch(exception) {
    console.log(exception);
}

require(['DefaultSketchCommands', 'UpdateManager', 'generated_proto/commands',
        'generated_proto/sketchUtil', 'protobufUtils/classCreator', 'protobufUtils/sketchProtoConverter', 'SketchSurfaceManager', 'RequireTest'],
    function (CommandException, UpdateManagerModule, ProtoCommands, GenericProtobuf, ClassUtils, ProtoUtil, SketchSurfaceManager, RequireTest) {
        var expect = chai.expect;
        var UpdateManager = UpdateManagerModule.UpdateManager;
        var Commands = ProtoCommands.protobuf.srl.commands;
        var ProtoSketchUtil = GenericProtobuf.protobuf.srl.utils;
        var CommandUtil = ProtoUtil.commands;
        // COPY PASTA FOR TESTING TAKEN FROM DEFAULT_SKETCH_COMMANDS.js

        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.CREATE_SKETCH);

        /**
         * Do nothing
         *
         * @returns {boolean} true.  because if we switch sketch we should probably do something about it.
         */
        Commands.SrlCommand.addRedoMethod(Commands.CommandType.CREATE_SKETCH, function () {
            return true;
        });

        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.SWITCH_SKETCH);
        /**
         * Do nothing
         *
         * @returns {boolean} true.  because if we switch sketch we should probably do something about it.
         */
        Commands.SrlCommand.addRedoMethod(Commands.CommandType.SWITCH_SKETCH, function () {
            return true;
        });

        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.CREATE_SKETCH);
        /**
         * Do nothing
         *
         * @returns {boolean} true.  because if we switch sketch we should probably do something about it.
         */
        Commands.SrlCommand.addUndoMethod(Commands.CommandType.CREATE_SKETCH, function () {
            return true;
        });

        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.SWITCH_SKETCH);
        /**
         * Do nothing
         *
         * @returns {boolean} true.  because if we switch sketch we should probably do something about it.
         */
        Commands.SrlCommand.addUndoMethod(Commands.CommandType.SWITCH_SKETCH, function () {
            return true;
        });

        var onErrorCallback = RequireTest.createErrorCallback(expect);
        var MinListNumber = 10;
        describe('test', function () {
            var cleanFakeSketch;
            var cleanFakeSketchManager;
            beforeEach(function createMockSketch() {
                // runs before each test in this block
                cleanFakeSketch = {
                    resetSketch: function () {
                    },
                    id: "SketchId!"
                };

                cleanFakeSketchManager = {
                    getCurrentSketch: function () {
                        return cleanFakeSketch;
                    },
                    deleteSketch: function () {
                    },
                    createSketch: function () {
                    }
                };
            });
            describe('creation', function () {
                it('should allow a basic creation of the item', function () {
                    var update = new UpdateManager(undefined, undefined);
                    expect(update).to.not.be.null;
                });
            });

            describe('misc Functions', function () {
                it("createMarker returns correct value", function () {
                    var update = new UpdateManager(undefined, undefined);
                    var otherData = "data";
                    var markerObject = update.createMarker(true, Commands.Marker.MarkerType.SAVE, otherData);
                    expect(markerObject).to.be.an.instanceof(Commands.SrlCommand, "testing that command is an object of the correct protobuf type");
                    expect(markerObject.isUserCreated).to.equal(true, "testing input for userCreated matches");
                    expect(markerObject.getCommandType()).to.equal(Commands.CommandType.MARKER, "testing input for commandType matches");
                    expect(markerObject.getCommandId()).not.to.equal(null, "testing that the command Id is not null");

                    var markerData = ProtoUtil.decode(markerObject.getCommandData(), Commands.Marker);
                    expect(markerData.type).to.equal(Commands.Marker.MarkerType.SAVE);
                    expect(markerData.otherData).to.equal(otherData);
                });

                it("get Clean list returns the same list but different objects", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                        return false;
                    });
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                        return false;
                    });
                    for (var i = 0; i < MinListNumber; i++) {
                        var SAVEObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "SAVE the sketch!");
                        var SAVEUpdate = CommandUtil.createUpdateFromCommands([SAVEObject]);
                        updateList.addUpdate(SAVEUpdate);

                        var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                        var update = CommandUtil.createUpdateFromCommands([markerObject]);
                        updateList.addUpdate(update);

                        var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                        var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                        updateList.addUpdate(assignUpdate);
                    }

                    var listCallback = undefined;
                    var listOne = updateList.getUpdateList(function (listThree) {
                        listCallback = listThree;
                        // do nothing it is fine;
                    });
                    ChaiProtobuf.updateListEqual(expect, listCallback, listOne);
                    restoreRealTime();

                    updateList.getCleanUpdateList(function (list) {
                        expect(list.length).to.be.equal(listOne.length, "list size should be the same");
                        for (var i = 0; i < listOne.length; i++) {
                            expect(listOne[i]).to.not.be.equal(list[i]);
                            ChaiProtobuf.updateEqual(expect, listOne[i], list[i]);
                        }
                        done();
                    });
                    Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                });

                it("setUpdateList creates the updates in the correct order", function () {
                    var clock = sinon.useFakeTimers();
                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var localUpdateList = new Array();
                    for (var i = 0; i < MinListNumber; i++) {
                        var SAVEObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "SAVE the sketch!");
                        var SAVEUpdate = CommandUtil.createUpdateFromCommands([SAVEObject]);
                        localUpdateList.push(SAVEUpdate);

                        var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                        var update = CommandUtil.createUpdateFromCommands([markerObject]);
                        localUpdateList.push(update);

                        var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                        var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                        localUpdateList.push(assignUpdate);
                    }

                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });

                    updateList.setUpdateList(localUpdateList);
                    for (var i = 0; i < MinListNumber * 3; i++) {
                        clock.tick(20);
                    }

                    Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    var listCallback = undefined;
                    var listOne = updateList.getUpdateList();
                    ChaiProtobuf.updateListEqual(expect, listOne, localUpdateList);
                    restoreRealTime();
                });

                it("setUpdateList calls with the correct values", function () {
                    var clock = sinon.useFakeTimers();
                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var localUpdateList = new Array();
                    for (var i = 0; i < MinListNumber; i++) {
                        var SAVEObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "SAVE the sketch!");
                        var SAVEUpdate = CommandUtil.createUpdateFromCommands([SAVEObject]);
                        localUpdateList.push(SAVEUpdate);

                        var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                        var update = CommandUtil.createUpdateFromCommands([markerObject]);
                        localUpdateList.push(update);

                        var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                        var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                        localUpdateList.push(assignUpdate);
                    }

                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });

                    var percent = sinon.spy();
                    var finished = sinon.spy();
                    var bar = {
                        isRunning: function () {
                            return true;
                        },
                        updatePercentBar: percent,
                        finishWaiting: finished
                    };
                    updateList.setUpdateList(localUpdateList, bar);
                    var total = MinListNumber * 3;
                    for (var i = 0; i < total; i++) {
                        clock.tick(20);
                        expect(percent).to.have.been.calledWith(i, total);
                    }
                    expect(percent).to.have.been.calledWith(1, 1);
                    Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);

                    expect(finished).withMessage("the percent bar finishes").to.have.been.calledOnce;
                });
            });
            describe("submission tests", function () {
                afterEach(function () {
                    try {
                        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    } catch(ignoredException) {

                    }
                });

                it("testing adding an update Marker.SUBMISSION And test the last update is submission", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    expect(updateList.isLastUpdateSubmission(), "there are no submissions before the marker submission is added").to.be.false;

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);
                    expect(updateList.isLastUpdateSubmission()).withMessage("afer marker is added the submission is the last update").to.be.true;
                    done();
                });

                it("testing isValidForSubmission with empty list", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));
                    expect(updateList.isValidForSubmission()).withMessage("empty list are not valid for submissions").to.be.false;
                    done();
                });

                it("testing isValidForSubmission with last item being a submission marker", function (done) {

                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.isValidForSubmission()).withMessage("afer marker is added the submission is the last update").to.be.false;
                    done();
                });

                it("testing isValidForSubmission with last item being a submission marker", function (done) {

                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "pounded you to saving");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.isValidForSubmission()).withMessage("after marker is added the save is the last update").to.be.true;
                    done();
                });
            });

            describe("addUpdateTest", function () {
                it("testing adding an empty update should throw an exception", function (done) {
                    var updateList = new UpdateManager(undefined, function (error) {
                        expect(error).to.be.an.instanceof(UpdateManagerModule.UpdateException);
                        done();
                    });

                    var update = CommandUtil.createUpdateFromCommands([]);
                    updateList.addUpdate(update);
                });

                it("testing adding an update ASSIGN_ATTRIBUTE (return false)", function (done) {

                    var stub = sinon.stub();
                    stub.returns(false); // we are not drawing.

                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, stub);
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));
                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);
                    expect(stub).withMessage('redo assign attribute is only called once').to.be.calledOnce;
                    done();
                });

                it("testing adding an update Marker.SUBMISSION after adding SAVE And test the last update is submission", function (done) {

                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    expect(updateList.isLastUpdateSubmission())
                        .withMessage("there are no submissions before the marker submission is added").to.be.false;

                    var SAVEObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "SAVE the sketch!");
                    var update = CommandUtil.createUpdateFromCommands([SAVEObject]);
                    updateList.addUpdate(update);

                    expect(updateList.isLastUpdateSubmission())
                        .withMessage("there are no submissions before the marker submission is added").to.be.false;

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.isLastUpdateSubmission())
                        .withMessage("afer marker is added the submission is the last update").to.be.true;
                    done();
                });

                it("testing adding a Create sketch command", function () {
                    cleanFakeSketchManager = new SketchSurfaceManager();
                    var clock = sinon.useFakeTimers();

                    cleanFakeSketchManager = new SketchSurfaceManager();
                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var spy = sinon.spy(cleanFakeSketchManager, "createSketch");
                    var stub = sinon.stub(cleanFakeSketchManager, "getSketch");

                    var secondSketch = {};

                    stub.returns(secondSketch);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.CREATE_SKETCH, false);
                    var sketchData = new Commands.ActionCreateSketch();
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    console.log(id);
                    sketchData.sketchId = idChain;
                    command.setCommandData(sketchData.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(20);

                    expect(spy).to.be.calledWith(id);
                    expect(spy).to.be.calledOnce;
                    expect(stub).to.be.calledWith(id);
                    expect(stub).to.be.calledOnce;
                });

                it("testing adding a switch sketch command", function () {
                    cleanFakeSketchManager = new SketchSurfaceManager();
                    var clock = sinon.useFakeTimers();

                    cleanFakeSketchManager = new SketchSurfaceManager();
                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var stub = sinon.stub(cleanFakeSketchManager, "getSketch");

                    var secondSketch = {};

                    stub.returns(secondSketch);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.SWITCH_SKETCH, false);
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    command.setCommandData(idChain.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(20);

                    expect(stub).to.be.calledWith(id);
                    expect(stub).to.be.calledOnce;
                });

                it("testing adding a switch sketch command undefined manager", function () {

                    var clock = sinon.useFakeTimers();

                    var updateList = new UpdateManager(undefined, function (error) {
                        expect(error).to.be.an.instanceof(UpdateManagerModule.UpdateException);
                    });

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.SWITCH_SKETCH, false);
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    command.setCommandData(idChain.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);
                });
            });

            describe("CLEAR data tests (basically about resetting the sketch", function () {
                beforeEach(function () {
                    cleanFakeSketchManager = new SketchSurfaceManager();
                });

                it("tests that the list is empty, and the submission pointer and current pointer is changed.", function (done) {

                    var updateList = new UpdateManager(cleanFakeSketchManager, RequireTest.createErrorCallback(expect, done));

                    cleanFakeSketchManager.getCurrentSketch = function () {
                        return cleanFakeSketch;
                    };

                    var saveObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "Save the sketch!");
                    var saveUpdate = CommandUtil.createUpdateFromCommands([saveObject]);
                    updateList.addUpdate(saveUpdate);

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    var list = updateList.getUpdateList();
                    ChaiProtobuf.updateEqual(expect, list[0], saveUpdate, "first object added was a SAVE object");
                    ChaiProtobuf.updateEqual(expect, list[1], update, "second object added was a submission object");

                    expect(updateList.isLastUpdateSubmission()).withMessage("afer marker is added the submission is the last update").to.be.true;
                    expect(updateList.getCurrentPointer()).to.be.equal(2, "there are two items in the list and the pointer should be 2");

                    updateList.clearUpdates(false);

                    expect(updateList.isLastUpdateSubmission()).withMessage("afer Clear there should not be a last update submission").to.be.false;

                    expect(updateList.getCurrentPointer()).to.equal(0, "afer SAVE the pointer should be 0");
                    ChaiProtobuf.updateListEqual(expect, updateList, [], "afer SAVE there should be an empty list");
                    done();
                });
            });
            describe("undo and redo tests", function () {
                beforeEach(function () {
                    cleanFakeSketchManager = new SketchSurfaceManager();
                });

                afterEach(function () {
                    try {
                        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    } catch(ignoredException) {

                    }
                });

                it("trying to redo when you can't redo throws an error", function (done) {

                    var updateList = new UpdateManager(undefined, function (error) {
                        expect(error).to.be.an.instanceof(UpdateManagerModule.UndoRedoException);
                        done();
                    });

                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);
                });

                it("single undo throws error when list is empty", function (done) {

                    var updateList = new UpdateManager(undefined, function (error) {
                        expect(error).to.be.an.instanceof(UpdateManagerModule.UndoRedoException);
                        done();
                    });

                    var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
                    updateList.addUpdate(undoUpdate);
                });

                it("you can undo a marker (maybe it just skips over it?)", function (done) {
                    var updateList = new UpdateManager(cleanFakeSketchManager, RequireTest.createErrorCallback(expect, done));
                    cleanFakeSketchManager.getCurrentSketch = function () {
                        return cleanFakeSketch
                    };

                    var submissionObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var subUpdate = CommandUtil.createUpdateFromCommands([submissionObject]);
                    updateList.addUpdate(subUpdate);

                    expect(updateList.getCurrentPointer()).withMessage("a single item means pointer is at 1").to.equal(1);

                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.getCurrentPointer()).withMessage("after undoing once the pointer should be at zero").to.equal(0);
                    done();
                });

                it("a single undo", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    var stub = sinon.stub();
                    stub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, stub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    expect(updateList.getCurrentPointer()).withMessage("a single item means pointer is at 1").to.equal(1);

                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.getCurrentPointer()).withMessage("after undoing once the pointer should be at zero").to.equal(0);
                    expect(stub).withMessage("Undo method for the assign should be called once").to.be.calledOnce;
                    done();
                });

                it("double undo throws error", function (done) {
                    expect(1);

                    var updateList = new UpdateManager(cleanFakeSketchManager, function (error) {
                        console.log(error);
                        expect(error).to.be.an.instanceof(UpdateManagerModule.UndoRedoException);
                        done();
                    });

                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
                    });
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
                    updateList.addUpdate(undoUpdate);
                    // no done here is called when checking the error.
                });

                it("a single undo then redo", function (done) {
                    var updateList = new UpdateManager(cleanFakeSketchManager, RequireTest.createErrorCallback(expect, done));

                    var undoStub = sinon.stub();
                    undoStub.returns(false); // we are not drawing.

                    var redoStub = sinon.stub();
                    redoStub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    expect(updateList.getCurrentPointer()).withMessage("a single item means pointer is at 1").to.equal(1);
                    expect(redoStub).withMessage("Redo should be called once").to.be.calledOnce;

                    var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
                    updateList.addUpdate(undoUpdate);

                    expect(updateList.getCurrentPointer()).withMessage("after undoing once the pointer should be at zero").to.equal(0);
                    expect(undoStub).withMessage("Undo method for the assign should be called once").to.be.calledOnce;

                    var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
                    var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
                    updateList.addUpdate(undoUpdate);

                    expect(updateList.getCurrentPointer()).withMessage("after redoing the list should be back at 1").to.equal(1);
                    expect(redoStub).withMessage("redo method for the assign should be called a second time").to.be.calledTwice;
                    done();
                });

                it("a single undo then redo using udoAction and redoAction methods", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    var undoStub = sinon.stub();
                    undoStub.returns(false); // we are not drawing.

                    var redoStub = sinon.stub();
                    redoStub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    expect(updateList.getCurrentPointer()).to.be.equal(1, "a single item means pointer is at 1");
                    expect(redoStub).withMessage("Redo should be called once").to.be.calledOnce;

                    updateList.undoAction(false);

                    expect(updateList.getCurrentPointer()).to.be.equal(0, "after undoing once the pointer should be at zero");
                    expect(undoStub).withMessage("Undo method for the assign should be called once").to.be.calledOnce;

                    updateList.redoAction(false);

                    expect(updateList.getCurrentPointer()).to.be.equal(1, "after undoing once the pointer should be at zero");
                    expect(redoStub).withMessage( "redo method for the assign should be called a second time").to.be.calledTwic;

                    done();
                });

                it("a undo/redo causing a split", function (done) {
                    var updateList = new UpdateManager(undefined, RequireTest.createErrorCallback(expect, done));

                    var undoStub = sinon.stub();
                    undoStub.returns(false); // we are not drawing.

                    var redoStub = sinon.stub();
                    redoStub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    updateList.undoAction(false);

                    updateList.redoAction(false);

                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);

                    var updateList = updateList.getUpdateList();
                    expect(6).withMessage("list shoudl be correct number of elements").to.be.equal(updateList.length);
                    expect(updateList[0].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    expect(updateList[1].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.MARKER);
                    expect(updateList[2].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.UNDO);
                    expect(updateList[3].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.REDO);
                    expect(updateList[4].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.MARKER);
                    expect(updateList[5].commands[0].commandType).withMessage("command type should represent split")
                        .to.be.equal(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    done();
                });

                it("adding a Create sketch command then calling undo on it", function () {
                    var clock = sinon.useFakeTimers();

                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var spy = sinon.spy(cleanFakeSketchManager, "createSketch");
                    var stub1 = sinon.stub(cleanFakeSketchManager, "getSketch");
                    var stub2 = sinon.stub(cleanFakeSketchManager, "deleteSketch");
                    var stub3 = sinon.stub(cleanFakeSketchManager, "getCurrentSketch");

                    var secondSketch = {};

                    stub1.returns(secondSketch);
                    stub3.returns(secondSketch);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.CREATE_SKETCH, false);
                    var sketchData = new Commands.ActionCreateSketch();
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id1 = ClassUtils.generateUuid();
                    idChain.idChain = [id1];
                    sketchData.sketchId = idChain;
                    command.setCommandData(sketchData.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.CREATE_SKETCH, false);
                    var sketchData = new Commands.ActionCreateSketch();
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    sketchData.sketchId = idChain;
                    command.setCommandData(sketchData.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(10);

                    expect(spy).to.be.calledWith(id);
                    expect(spy).to.be.calledTwice;
                    expect(stub1).to.be.calledWith(id);
                    expect(stub1).to.be.calledTwice;

                    updateList.undoAction(true);
                    clock.tick(10);

                    expect(stub1).withMessage("get sketch should be called 3 times").to.be.calledWith(id1);
                    expect(stub1).to.be.calledThrice;
                    expect(stub2).withMessage("delete should only happen once").to.be.calledWith(id);
                    expect(stub2).to.be.calledOnce;
                });

                it("undoing first create sketch throws an exception", function () {
                    var clock = sinon.useFakeTimers();

                    var updateList = new UpdateManager(cleanFakeSketchManager, function (error) {
                        expect(error).to.be.instanceof(UpdateManagerModule.UpdateException);
                    });

                    var spy = sinon.spy(cleanFakeSketchManager, "createSketch");
                    var stub1 = sinon.stub(cleanFakeSketchManager, "getSketch");
                    var stub2 = sinon.stub(cleanFakeSketchManager, "deleteSketch");

                    var secondSketch = {};

                    stub1.returns(secondSketch);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.CREATE_SKETCH, false);
                    var sketchData = new Commands.ActionCreateSketch();
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    sketchData.sketchId = idChain;
                    command.setCommandData(sketchData.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(10);

                    updateList.undoAction(true);
                    clock.tick(10);
                });

                it("adding a swtich sketch and then undoing that creation", function () {
                    var clock = sinon.useFakeTimers();

                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var stub = sinon.stub(cleanFakeSketchManager, "getSketch");
                    var stub2 = sinon.stub(cleanFakeSketchManager, "getCurrentSketch");

                    var secondSketch = {};

                    stub.returns(secondSketch);
                    stub2.returns(secondSketch);

                    // assuming this works!
                    var command = CommandUtil.createBaseCommand(Commands.CommandType.CREATE_SKETCH, false);
                    var sketchData = new Commands.ActionCreateSketch();
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    sketchData.sketchId = idChain;
                    command.setCommandData(sketchData.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(10);

                    // TEST CODE HERE
                    var command = CommandUtil.createBaseCommand(Commands.CommandType.SWITCH_SKETCH, false);
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id2 = ClassUtils.generateUuid();
                    idChain.idChain = [id2];
                    command.setCommandData(idChain.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(10);

                    // first call is from create sketch
                    expect(stub).withMessage( "get sketch should be called with: " + id2).to.be.calledWith(id2);
                    expect(stub).withMessage("get sketch should be called twice, once for create another for switch").to.be.calledTwice;

                    updateList.undoAction(false);
                    clock.tick(10);

                    expect(stub).withMessage("get sketch should also be called with: " + id).to.be.calledWith(id);
                    expect(stub).withMessage( "get sketch should be called a third time after undoing").to.be.calledThrice;
                });

                it("undo switch sketch throws exception no previous sketch exist", function () {
                    var clock = sinon.useFakeTimers();

                    var updateList = new UpdateManager(cleanFakeSketchManager, function (error) {
                        expect(error).to.be.instanceof(UpdateManagerModule.UpdateException);
                    });

                    var stub = sinon.stub(cleanFakeSketchManager, "getSketch");

                    var secondSketch = {};

                    stub.returns(secondSketch);

                    var command = CommandUtil.createBaseCommand(Commands.CommandType.SWITCH_SKETCH, false);
                    var idChain = new ProtoSketchUtil.IdChain();
                    var id = ClassUtils.generateUuid();
                    idChain.idChain = [id];
                    command.setCommandData(idChain.toArrayBuffer());
                    var update = CommandUtil.createUpdateFromCommands([command]);
                    updateList.addUpdate(update);

                    clock.tick(10);

                    updateList.undoAction(false);
                    clock.tick(10);
                });
            });

            describe("split tests", function() {
                beforeEach(function () {
                    cleanFakeSketchManager = new SketchSurfaceManager();
                    try {
                        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    } catch(ignoredException) {

                    }
                });

                afterEach(function () {
                    try {
                        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    } catch(ignoredException) {

                    }
                });

                it("a single split", function (done) {
                    var updateList = new UpdateManager(this.sketch, RequireTest.createErrorCallback(expect, done));

                    var startSplitObject = updateList.createMarker(true, Commands.Marker.MarkerType.SPLIT, "1");
                    var startSplitUpdate = CommandUtil.createUpdateFromCommands([startSplitObject]);
                    updateList.addUpdate(startSplitUpdate);

                    var undoStub = sinon.stub();
                    undoStub.returns(false); // we are not drawing.

                    var redoStub = sinon.stub();
                    redoStub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    var endSplitObject = updateList.createMarker(true, Commands.Marker.MarkerType.SPLIT, "-1");
                    var endSplitUpdate = CommandUtil.createUpdateFromCommands([endSplitObject]);
                    updateList.addUpdate(endSplitUpdate);

                    expect(redoStub).to.be.not.called;
                    expect(undoStub).to.be.not.called;
                    done();
                });
            });
            describe("complex tests", function () {
                it("a single split then an undo then a redo", function (done) {
                    var updateList = new UpdateManager(cleanFakeSketchManager, RequireTest.createErrorCallback(expect, done));

                    var startSplitObject = updateList.createMarker(true, Commands.Marker.MarkerType.SPLIT, "1");
                    var startSplitUpdate = CommandUtil.createUpdateFromCommands([startSplitObject]);
                    updateList.addUpdate(startSplitUpdate);

                    var undoStub = sinon.stub();
                    undoStub.returns(false); // we are not drawing.

                    var redoStub = sinon.stub();
                    redoStub.returns(false); // we are not drawing.
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
                    var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
                    updateList.addUpdate(assignUpdate);

                    var endSplitObject = updateList.createMarker(true, Commands.Marker.MarkerType.SPLIT, "-1");
                    var endSplitUpdate = CommandUtil.createUpdateFromCommands([endSplitObject]);
                    updateList.addUpdate(endSplitUpdate);

                    var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
                    var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
                    updateList.addUpdate(undoUpdate);

                    expect(updateList.getCurrentPointer()).to.equal(0);

                    var redoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
                    var redoUpdate = CommandUtil.createUpdateFromCommands([redoMarkerObject]);
                    updateList.addUpdate(redoUpdate);

                    expect(updateList.getCurrentPointer()).to.equal(updateList.getListLength() - 2);

                    expect(redoStub).to.be.not.called;
                    expect(undoStub).to.be.not.called;
                    done();
                });
            });

            describe("plugin tests", function () {
                beforeEach(function () {
                    try {
                        Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                        Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
                    } catch(ignoredException) {

                    }
                });
                it("plugin gets correct data for simple update", function (done) {
                    expect(5);
                    var clock = sinon.useFakeTimers();
                    var stub = sinon.stub();
                    stub.returns(false); // we are not drawing.

                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, stub);
                    var updateList = new UpdateManager(cleanFakeSketchManager, onErrorCallback);

                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);

                    // actual test
                    updateList.addPlugin({
                        addUpdate: function (pluginUpdate, redraw, updateIndex, lastUpdateType, updatePluginId) {
                            ChaiProtobuf.updateEqual(expect, pluginUpdate, update);
                            expect(redraw).to.equal(false);
                            expect(updateIndex).to.equal(1);
                            expect(lastUpdateType).to.equal(0);
                            expect(updatePluginId).to.equal(undefined);
                            done();
                        }
                    });

                    updateList.addSynchronousUpdate(update);

                    // only used for plugins not for update itself
                    clock.tick(10);
                    expect(stub).to.be.calledOnce;
                });
            });
        });
        mocha.run();
    });
