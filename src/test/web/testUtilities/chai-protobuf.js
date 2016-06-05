define('chai-protobuf', ['generated_proto/commands', 'protobufUtils/sketchProtoConverter'], function (ProtoCommands, ProtoUtil) {
    var Commands = ProtoCommands.protobuf.srl.commands;

    /**
     * Returns a cleaned version of the update that is ready for comparison.
     */
    function cleanUpdateForComparison(update) {
        if (typeof update === 'undefined') {
            throw "Update can not be undefined";
        }
        return ProtoUtil.decode(update.toArrayBuffer(), Commands.SrlUpdate);
    }

    /**
     * Returns a copy of the updateList for the purpose of not being edited
     * while in use.
     *
     * This is a synchronous method.  Can freeze the browser for long list.  Should not use often.
     *
     */
    function cleanUpdateList(updateList) {
        var index = 0;
        var maxIndex = updateList.length;
        var newList = new Array();
        // for local scoping
        var oldList = updateList;
        for (var index = 0; index < oldList.length; index++) {
            newList.push(cleanUpdateForComparison(oldList[index]));
        }
        return newList;
    }

    function updateEqual(expect, actual, expected, message) {
        var actualUpdate = cleanUpdateForComparison(actual);
        var expectedUpdate = cleanUpdateForComparison(expected);
        expect([actualUpdate]).to.deep.include.members([expectedUpdate]);
    }

    function updateListEqual(expect, actual, expected, message) {
        var actualList = cleanUpdateList(actual);
        var expectedList = cleanUpdateList(expected);
        expect([actualList]).to.deep.include.members([expectedList]);
    }

    return {
        updateEqual: updateEqual,
        updateListEqual: updateListEqual
    }
});
