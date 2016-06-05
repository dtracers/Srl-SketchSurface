try {
    require('node-define');
    require('node-amd-require');
} catch(exception) {
    console.log(exception);
}

require(['DefaultSketchCommands', 'UpdateManager', 'generated_proto/commands',
        'generated_proto/sketchUtil', 'protobufUtils/classCreator', 'protobufUtils/sketchProtoConverter', 'SketchSurfaceManager', 'RequireTest'],
    function (CommandException,UpdateManagerModule, ProtoCommands, GenericProtobuf, ClassUtils, ProtoUtil, SketchSurfaceManager, RequireTest) {
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
                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                    });
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
                    var updateList = new UpdateManager({
                        getCurrentSketch: function () {
                            return cleanFakeSketch;
                        }
                    }, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                    });

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
                    var updateList = new UpdateManager({
                        getCurrentSketch: function () {
                            return cleanFakeSketch;
                        }
                    }, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                    });

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
                    } catch(ignoredException) {

                    }
                });

                it("testing adding an update Marker.SUBMISSION And test the last update is submission", function (done) {
                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });

                    expect(updateList.isLastUpdateSubmission(), "there are no submissions before the marker submission is added").to.be.false;

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);
                    expect(updateList.isLastUpdateSubmission()).withMessage("afer marker is added the submission is the last update").to.be.true;
                    done();
                });

                it("testing isValidForSubmission with empty list", function (done) {
                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });
                    expect(updateList.isValidForSubmission()).withMessage("empty list are not valid for submissions").to.be.false;
                    done();
                });

                it("testing isValidForSubmission with last item being a submission marker", function (done) {

                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });

                    var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);

                    expect(updateList.isValidForSubmission()).withMessage("afer marker is added the submission is the last update").to.be.false;
                    done();
                });

                it("testing isValidForSubmission with last item being a submission marker", function (done) {

                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });

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
                        console.log(error);
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
                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });
                    var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
                    var update = CommandUtil.createUpdateFromCommands([markerObject]);
                    updateList.addUpdate(update);
                    expect(stub).withMessage('redo assign attribute is only called once').to.be.calledOnce;
                    done();
                });

                it("testing adding an update Marker.SUBMISSION after adding SAVE And test the last update is submission", function (done) {

                    var updateList = new UpdateManager(undefined, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                        done();
                    });

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

                    this.sketchManager = new SketchSurfaceManager();
                    var updateList = new UpdateManager(cleanFakeSketchManager, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
                    });

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

                    this.sketchManager = new SketchSurfaceManager();
                    var updateList = new UpdateManager(cleanFakeSketchManager, function (error) {
                        console.log(error);
                        expect(false).to.equal(true, '' + error);
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
        });

        mocha.run();
        /*

        QUnit.module("CLEAR data tests", {
            sketch: {
                resetSketch: function () {
                }
            },
            sketchManager: new SketchSurfaceManager()
        }); // basically a bunch of test about wether or not it is resetable.
        QUnit.test("tests that the list is empty, and the submission pointer and current pointer is changed.", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(false, error);
                done();
            });


            var localSketch = this.sketch;
            this.sketchManager.getCurrentSketch = function () {
                return localSketch
            };

            var saveObject = updateList.createMarker(true, Commands.Marker.MarkerType.SAVE, "Save the sketch!");
            var saveUpdate = CommandUtil.createUpdateFromCommands([saveObject]);
            updateList.addUpdate(saveUpdate);

            var markerObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
            var update = CommandUtil.createUpdateFromCommands([markerObject]);
            updateList.addUpdate(update);

            var list = updateList.getUpdateList();
            assert.updateEqual(list[0], saveUpdate, "first object added was a SAVE object");
            assert.updateEqual(list[1], update, "second object added was a submission object");

            assert.equal(updateList.isLastUpdateSubmission(), true, "afer marker is added the submission is the last update");
            assert.equal(updateList.getCurrentPointer(), 2, "there are two items in the list and the pointer should be 2");

            updateList.clearUpdates(false);

            assert.equal(updateList.isLastUpdateSubmission(), false, "afer Clear there should not be a last update submission");
            assert.equal(updateList.getCurrentPointer(), 0, "afer SAVE the pointer should be 0");
            assert.deepEqual(updateList.getUpdateList(), [], "afer SAVE there should be an empty list");
            done();
        });

        QUnit.module("undo and redo tests", {
            sketch: {
                resetSketch: function () {
                }
            },
            sketchManager: new SketchSurfaceManager()
        });
        QUnit.test("trying to redo when you can't redo throws an error", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(error instanceof UndoRedoException, error);
                done();
            });

            var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
            var update = CommandUtil.createUpdateFromCommands([markerObject]);
            updateList.addUpdate(update);
        });

        QUnit.test("single undo throws error when list is empty", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(error instanceof UndoRedoException, error);
                done();

            });

            var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
            var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
            updateList.addUpdate(undoUpdate);
        });

        QUnit.test("you can undo a marker (maybe it just skips over it?)", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                console.log(error);
                assert.ok(false, error);
                done();
            });

            var localSketch = this.sketch;
            this.sketchManager.getCurrentSketch = function () {
                return localSketch
            };

            var submissionObject = updateList.createMarker(true, Commands.Marker.MarkerType.SUBMISSION, "pounded you to submission");
            var subUpdate = CommandUtil.createUpdateFromCommands([submissionObject]);
            updateList.addUpdate(subUpdate);

            assert.equal(updateList.getCurrentPointer(), 1, "a single item means pointer is at 1");

            var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
            var update = CommandUtil.createUpdateFromCommands([markerObject]);
            updateList.addUpdate(update);

            assert.equal(updateList.getCurrentPointer(), 0, "after undoing once the pointer should be at zero");
            done();
        });

        QUnit.test("a single undo", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(false, error);
                done();
            });

            var stub = sinon.stub();
            stub.returns(false); // we are not drawing.
            Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, function () {
            });
            Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, stub);
            var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
            var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
            updateList.addUpdate(assignUpdate);

            assert.equal(updateList.getCurrentPointer(), 1, "a single item means pointer is at 1");

            var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
            var update = CommandUtil.createUpdateFromCommands([markerObject]);
            updateList.addUpdate(update);

            assert.equal(updateList.getCurrentPointer(), 0, "after undoing once the pointer should be at zero");
            assert.ok(stub.calledOnce, "Undo method for the assign should be called once");

            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.test("double undo throws error", function (assert) {
            var done = assert.async();
            expect(1);

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(error instanceof UndoRedoException, error);
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

            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
        });

        QUnit.test("a single undo then redo", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(false, error);
                done();
            });

            var undoStub = sinon.stub();
            undoStub.returns(false); // we are not drawing.

            var redoStub = sinon.stub();
            redoStub.returns(false); // we are not drawing.
            Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
            Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
            var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
            var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
            updateList.addUpdate(assignUpdate);

            assert.equal(updateList.getCurrentPointer(), 1, "a single item means pointer is at 1");
            assert.ok(redoStub.calledOnce, "Redo should be called once");

            var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.UNDO, false);
            var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
            updateList.addUpdate(undoUpdate);

            assert.equal(updateList.getCurrentPointer(), 0, "after undoing once the pointer should be at zero");
            assert.ok(undoStub.calledOnce, "Undo method for the assign should be called once");

            var undoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
            var undoUpdate = CommandUtil.createUpdateFromCommands([undoMarkerObject]);
            updateList.addUpdate(undoUpdate);

            assert.equal(updateList.getCurrentPointer(), 1, "after undoing once the pointer should be at zero");
            assert.ok(redoStub.calledTwice, "redo method for the assign should be called a second time");

            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.test("a single undo then redo using udoAction and redoAction methods", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(false, error);
                done();
            });

            var undoStub = sinon.stub();
            undoStub.returns(false); // we are not drawing.

            var redoStub = sinon.stub();
            redoStub.returns(false); // we are not drawing.
            Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, redoStub);
            Commands.SrlCommand.addUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, undoStub);
            var assignAt = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
            var assignUpdate = CommandUtil.createUpdateFromCommands([assignAt]);
            updateList.addUpdate(assignUpdate);

            assert.equal(updateList.getCurrentPointer(), 1, "a single item means pointer is at 1");
            assert.ok(redoStub.calledOnce, "Redo should be called once");

            updateList.undoAction(false);

            assert.equal(updateList.getCurrentPointer(), 0, "after undoing once the pointer should be at zero");
            assert.ok(undoStub.calledOnce, "Undo method for the assign should be called once");

            updateList.redoAction(false);

            assert.equal(updateList.getCurrentPointer(), 1, "after undoing once the pointer should be at zero");
            assert.ok(redoStub.calledTwice, "redo method for the assign should be called a second time");

            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.test("a undo/redo causing a split", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(false, error);
                done();
            });

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
            console.log(updateList);
            assert.equal(6, updateList.length);
            assert.equal(updateList[0].commands[0].commandType, Commands.CommandType.ASSIGN_ATTRIBUTE);
            assert.equal(updateList[1].commands[0].commandType, Commands.CommandType.MARKER);
            assert.equal(updateList[2].commands[0].commandType, Commands.CommandType.UNDO);
            assert.equal(updateList[3].commands[0].commandType, Commands.CommandType.REDO);
            assert.equal(updateList[4].commands[0].commandType, Commands.CommandType.MARKER);
            assert.equal(updateList[5].commands[0].commandType, Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.test("adding a Create sketch command then calling undo on it", function (assert) {

            var clock = sinon.useFakeTimers();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(false, error);
            });

            var spy = sinon.spy(this.sketchManager, "createSketch");
            var stub1 = sinon.stub(this.sketchManager, "getSketch");
            var stub2 = sinon.stub(this.sketchManager, "deleteSketch");
            var stub3 = sinon.stub(this.sketchManager, "getCurrentSketch");

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

            assert.ok(spy.calledWith(id) && spy.calledTwice);
            assert.ok(stub1.calledWith(id) && stub1.calledTwice);

            updateList.undoAction(true);
            clock.tick(10);

            assert.ok(stub1.calledWith(id1) && stub1.calledThrice, "get sketch should be called 3 times");
            assert.ok(stub2.calledWith(id) && stub2.calledOnce, "delete should only happen once");
        });

        QUnit.test("undoing first create sketch throws an exception", function (assert) {

            var clock = sinon.useFakeTimers();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(error instanceof UpdateException, "Successfully threw: " + error);
            });

            var spy = sinon.spy(this.sketchManager, "createSketch");
            var stub1 = sinon.stub(this.sketchManager, "getSketch");
            var stub2 = sinon.stub(this.sketchManager, "deleteSketch");

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

        QUnit.test("adding a swtich sketch and then undoing that creation", function (assert) {

            var clock = sinon.useFakeTimers();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(false, error);
            }, this.sketchManager);

            var stub = sinon.stub(this.sketchManager, "getSketch");
            var stub2 = sinon.stub(this.sketchManager, "getCurrentSketch");

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
            assert.ok(stub.calledWith(id2), "get sketch should be called with: " + id2);
            assert.ok(stub.calledTwice, "get sketch should be called twice, once for create another for switch");

            updateList.undoAction(false);
            clock.tick(10);

            assert.ok(stub.calledWith(id), "get sketch should also be called with: " + id);
            assert.ok(stub.calledThrice, "get sketch should be called a third time after undoing");
        });

        QUnit.test("undo switch sketch throws exception no previous sketch exist", function (assert) {

            var clock = sinon.useFakeTimers();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(error instanceof UpdateException, "Successfully threw: " + error);
            });

            var stub = sinon.stub(this.sketchManager, "getSketch");

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

        QUnit.module("SPLIT tests", {
            sketch: {
                resetSketch: function () {
                }
            },
            sketchManager: new SketchSurfaceManager()
        });
        QUnit.test("a single split", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(this.sketch, function (error) {
                assert.ok(false, error);
                done();
            });

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

            sinon.assert.notCalled(redoStub);
            sinon.assert.notCalled(undoStub);
            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.module("Complex tests", {
            sketch: {
                resetSketch: function () {
                }
            },
        });

        QUnit.test("a single split then an undo then a redo", function (assert) {
            var done = assert.async();

            var updateList = new UpdateManager(this.sketchManager, function (error) {
                assert.ok(false, error);
                done();
            });

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

            assert.equal(updateList.getCurrentPointer(), 0);

            var redoMarkerObject = CommandUtil.createBaseCommand(Commands.CommandType.REDO, false);
            var redoUpdate = CommandUtil.createUpdateFromCommands([redoMarkerObject]);
            updateList.addUpdate(redoUpdate);

            assert.equal(updateList.getCurrentPointer(), updateList.getListLength() - 2);

            sinon.assert.notCalled(redoStub);
            sinon.assert.notCalled(undoStub);
            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            Commands.SrlCommand.removeUndoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
            done();
        });

        QUnit.module("plugin tests", {
            sketch: {
                resetSketch: function () {
                },
                id: "SketchId!"
            },
            sketchManager: {
                getCurrentSketch: function () {
                    return this.sketch;
                },
                deleteSketch: function () {
                },
                createSketch: function () {
                }
            },
        });

        QUnit.test("plugin gets correct data for simple update", function (assert) {
            expect(5);
            var clock = sinon.useFakeTimers();
            var stub = sinon.stub();
            stub.returns(false); // we are not drawing.

            Commands.SrlCommand.addRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE, stub);
            var updateList = new UpdateManager(undefined, function (error) {
                assert.ok(false, error);
            });

            var markerObject = CommandUtil.createBaseCommand(Commands.CommandType.ASSIGN_ATTRIBUTE, true);
            var update = CommandUtil.createUpdateFromCommands([markerObject]);

            // actual test
            updateList.addPlugin({
                addUpdate: function (pluginUpdate, redraw, updateIndex, lastUpdateType) {
                    assert.updateEqual(pluginUpdate, update);
                    assert.equal(redraw, false);
                    assert.equal(updateIndex, 1);
                    assert.equal(lastUpdateType, 0);
                }
            });

            updateList.addSynchronousUpdate(update);

            // only used for plugins not for update itself
            clock.tick(10);
            assert.ok(stub.calledOnce, "spy is called once");
            Commands.SrlCommand.removeRedoMethod(Commands.CommandType.ASSIGN_ATTRIBUTE);
        });
        QUnit.start();
*/
    });
