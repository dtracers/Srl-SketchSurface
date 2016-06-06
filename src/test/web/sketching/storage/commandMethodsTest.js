try {
    require('node-define');
    require('node-amd-require');
    require('requirejs');
} catch (exception) {
    console.log(exception);
}

require(['DefaultSketchCommands', 'generated_proto/commands',
        'generated_proto/sketchUtil', 'protobufUtils/classCreator', 'protobufUtils/sketchProtoConverter', 'RequireTest'],
    function (CommandException, ProtoCommands, GenericProtobuf, ClassUtils, ProtoUtil, RequireTest) {
        var expect = chai.expect;
        var Commands = ProtoCommands.protobuf.srl.commands;
        var ProtoSketchUtil = GenericProtobuf.protobuf.srl.utils;
        var CommandUtil = ProtoUtil.commands;

        var minNumInList = 10;

        describe("CommandMethodsTest", function () {
            describe("types", function () {
                it("names are correctly called with the type", function () {
                    var type = "";
                    for (type in Commands.CommandType) {
                        var command = new Commands.SrlCommand();
                        command.setCommandType(Commands.CommandType[type]);
                        expect(command.getCommandTypeName()).to.equal(type);
                    }
                });
                it("an exception is thrown when type does not exist", function () {
                    var command = new Commands.SrlCommand();
                    command.commandType = -1; // a type that does not exist
                    var spy = sinon.spy(command, "getCommandTypeName");

                    expect(function () {
                        command.getCommandTypeName();
                    }).to.throw(CommandException);
                });
            });

            describe("SrlUpdateList#redo()", function () {
                it("returns true when all subcompontents return true", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'redo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                    }

                    expect(updateList.redo()).withMessage("true if the method signifies redrawing").to.be.true;
                });

                it("only calls each item once", function () {
                    var updateList = new Commands.SrlUpdate();

                    var listOfStubs = [];
                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'redo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                        listOfStubs.push(stub);
                    }

                    updateList.redo();
                    for (var i = 0; i < listOfStubs.length; i++) {
                        expect(listOfStubs[i]).withMessage("the stub should only be called once").to.be.calledOnce;
                    }

                });

                it("returns false when all subcompontents returns false", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'redo');
                        stub.returns(false);
                        updateList.getCommands().push(srlCommand);
                    }

                    expect(updateList.redo()).withMessage("this method should not be returning true").to.be.false;
                });

                it("returns true when at least one subcompontent returns true", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'redo');
                        stub.returns(false);
                        updateList.getCommands().push(srlCommand);
                    }

                    var srlCommand = new Commands.SrlCommand();
                    var stub = sinon.stub(srlCommand, 'redo');
                    stub.returns(true); // should make everything return false
                    updateList.getCommands().push(srlCommand);

                    expect(updateList.redo()).withMessage("true if the method signifies redrawing").to.be.true;
                });

                it("redo calls methods in forward order", function () {
                    var updateList = new Commands.SrlUpdate();

                    var listOfStubs = [];
                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'redo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                        listOfStubs.push(stub);
                    }

                    updateList.redo();

                    /*
                     Checks that the methods are called one after each other but in forward order.
                     */
                    for (var i = 0; i < minNumInList - 1; i++) {
                        var firstStub = listOfStubs[i]; // 0
                        var secondStub = listOfStubs[i + 1]; // 1

                        expect(firstStub).withMessage("first stub should be called after second Stub").to.be.calledBefore(secondStub);
                    }
                });
            });

            describe("SrlUpdateList#undo()", function () {
                it("returns true when all subcompontents return true", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'undo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                    }

                    expect(updateList.undo()).withMessage("true if the method signifies redrawing").to.be.true;
                });

                it("only calls each item once", function () {
                    var updateList = new Commands.SrlUpdate();

                    var listOfStubs = [];
                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'undo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                        listOfStubs.push(stub);
                    }

                    updateList.undo();
                    for (var i = 0; i < listOfStubs.length; i++) {
                        expect(listOfStubs[i]).withMessage("the stub should only be called once").to.be.calledOnce;
                    }

                });

                it("returns false when all subcompontents returns false", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'undo');
                        stub.returns(false);
                        updateList.getCommands().push(srlCommand);
                    }

                    expect(updateList.undo()).withMessage("true if the method signifies redrawing").to.be.false;
                });

                it("returns true when at least one subcompontent returns true", function () {
                    var updateList = new Commands.SrlUpdate();

                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'undo');
                        stub.returns(false);
                        updateList.getCommands().push(srlCommand);
                    }

                    var srlCommand = new Commands.SrlCommand();
                    var stub = sinon.stub(srlCommand, 'undo');
                    stub.returns(true); // should make everything return false
                    updateList.getCommands().push(srlCommand);

                    expect(updateList.undo()).withMessage("true if the method signifies redrawing").to.be.true;
                });

                it("undo calls methods in reverse order", function () {
                    var updateList = new Commands.SrlUpdate();

                    var listOfStubs = [];
                    for (var i = 0; i < minNumInList; i++) {
                        var srlCommand = new Commands.SrlCommand();
                        var stub = sinon.stub(srlCommand, 'undo');
                        stub.returns(true);
                        updateList.getCommands().push(srlCommand);
                        listOfStubs.push(stub);
                    }

                    updateList.undo();

                    /*
                     Checks that the methods are called one after each other but in reverse order.
                     */
                    for (var i = 0; i < minNumInList - 1; i++) {
                        var firstStub = listOfStubs[i]; // 0
                        var secondStub = listOfStubs[i + 1]; // 1
                        expect(secondStub).withMessage("first stub should be called after second Stub").to.be.calledBefore(firstStub);
                    }
                });
            });
            describe("SrlCommand add and remove verification", function () {
                var specialFunction = function () {
                  // does nothing
                };
                beforeEach(function () {
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.MARKER, specialFunction);
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.MARKER, specialFunction);
                });
                afterEach(function () {
                    Commands.SrlCommand.removeRedoMethod(Commands.CommandType.MARKER);
                    Commands.SrlCommand.removeUndoMethod(Commands.CommandType.MARKER);
                });

                it("addRedoMethod Throws error if method already exists", function() {
                    function thrower() {
                        Commands.SrlCommand.addRedoMethod(Commands.CommandType.MARKER, specialFunction);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("removeRedoMethod Throws error if method does not exist", function() {
                    function thrower() {
                        Commands.SrlCommand.removeRedoMethod(-1);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("addUndoMethod Throws error if method already exists", function() {
                    function thrower() {
                        Commands.SrlCommand.addUndoMethod(Commands.CommandType.MARKER, specialFunction);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("removeUndoMethod Throws error if method does not exist", function() {
                    function thrower() {
                        Commands.SrlCommand.removeUndoMethod(-1);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("removeUndoMethod Throws error if method does not exist", function() {
                    function thrower() {
                        Commands.SrlCommand.removeUndoMethod(undefined);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("removeRedoMethod Throws error if method does not exist", function() {
                    function thrower() {
                        Commands.SrlCommand.removeRedoMethod(undefined);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("addRedoMethod Throws error if given undefined", function() {
                    function thrower() {
                        Commands.SrlCommand.addRedoMethod(undefined, specialFunction);
                    }
                    expect(thrower).to.throw(CommandException);
                });

                it("addUndoMethod Throws error if given undefined", function() {
                    function thrower() {
                        Commands.SrlCommand.addUndoMethod(undefined, specialFunction);
                    }
                    expect(thrower).to.throw(CommandException);
                });
            });

            describe("SrlCommand Redo", function () {
                var specialFunction = function () {
                    // does nothing
                };
                beforeEach(function () {
                    try {
                        Commands.SrlCommand().removeRedoMethod(Commands.CommandType.MARKER);
                    } catch (exception) {
                    }
                    try {
                        Commands.SrlCommand().removeUndoMethod(Commands.CommandType.MARKER);
                    } catch (exception) {
                    }
                });
                afterEach(function () {
                    try {
                        Commands.SrlCommand().removeRedoMethod(Commands.CommandType.MARKER);
                    } catch (exception) {
                    }
                    try {
                        Commands.SrlCommand().removeUndoMethod(Commands.CommandType.MARKER);
                    } catch (exception) {
                    }
                });

                it("tests that calling redo on a command works", function() {
                    var command = CommandUtil.createBaseCommand(Commands.CommandType.MARKER, false);
                    var spy = sinon.spy();
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.MARKER, spy);
                    Commands.SrlCommand.addRedoMethod(Commands.CommandType.MARKER, spy);
                    command.redo();
                    expect(spy).to.be.calledOnce;
                });

                it("tests that calling undo on a command works", function() {
                    var command = CommandUtil.createBaseCommand(Commands.CommandType.MARKER, false);
                    var spy = sinon.spy();
                    Commands.SrlCommand.addUndoMethod(Commands.CommandType.MARKER, spy);
                    command.undo();
                    expect(spy).to.be.calledOnce;
                });

            });
        });
        mocha.run();
    });

/*


 QUnit.module("SrlCommand Redo/Undo", {
 teardown : function() {
 try {
 Commands.SrlCommand().removeRedoMethod(Commands.CommandType.MARKER);
 } catch (exception) {
 }
 try {
 Commands.SrlCommand().removeUndoMethod(Commands.CommandType.MARKER);
 } catch (exception) {
 }
 // clean up after each test
 }
 });
 it("tests that calling redo on a command works", function() {
 var command = CommandUtil.createBaseCommand(Commands.CommandType.MARKER, false);
 var spy = sinon.spy();
 Commands.SrlCommand().addRedoMethod(Commands.CommandType.MARKER, spy);
 command.redo();
 ok(spy.calledOnce);
 });

 it("tests that calling undo on a command works", function() {
 var command = CommandUtil.createBaseCommand(Commands.CommandType.MARKER, false);
 var spy = sinon.spy();
 Commands.SrlCommand().addUndoMethod(Commands.CommandType.MARKER, spy);
 command.undo();
 ok(spy.calledOnce);
 });


 */
