try {
    require('node-define');
    require('node-amd-require');
    require('requirejs');
} catch(exception) {
    console.log(exception);
}

require(['RequireTest', 'SketchSurfaceManager' ], function (RequireTest, SketchSurfaceManager) {
    var expect = chai.expect;
    describe("sketchSurfaceManagerTests", function () {
       describe("sketch surface manager", function() {
           afterEach(function () {
               document.getElementById("sketchLocationCreator").innerHTML = "";
           });
           it("Should be creatable", function () {
               var sketchManager = new SketchSurfaceManager();
               expect(sketchManager).to.not.be.undefined;
           });


           it("sketch surface creation", function() {
               var manager = new SketchSurfaceManager();
               var sketch = manager.createSketch("5");
               expect(sketch).to.not.be.undefined;
           });

           it("sketch surface creation with ID should be grabble able", function() {
               var manager = new SketchSurfaceManager();
               var id = "5"; // so unique much wow.
               var sketch = manager.createSketch(id);
               expect(sketch).to.not.be.undefined;

               var sketch1 = manager.getSketch(id);
               expect(sketch1).withMessage('checking get sketch returns same sketch').to.equal(sketch);
           });

           it("sketch surface creation with ID should not recreate a sketch with the same id", function() {
               var manager = new SketchSurfaceManager();
               var id = "5"; // so unique much wow.
               var sketch = manager.createSketch(id);
               expect(sketch).to.not.be.undefined;

               var sketch2 = manager.createSketch(id);

               expect(sketch2).withMessage('checking create sketch returns same sketch').to.equal(sketch);
           });

           it("sketch surface grab correct ID's", function(assert) {
               var manager = new SketchSurfaceManager();
               var id = "5"; // so unique much wow.
               var sketch = manager.createSketch(id);

               var array = manager.getSketchIds();
               expect(array.length).to.equal(1);
               expect(array).to.have.members([sketch.id]);
           });
        });
    });
    mocha.run();
});

/*


test("sketch surface grab correct ID's", function(assert) {
    var manager = new SketchSurfaceHandler();
    var id = "5"; // so unique much wow.
    var sketch = manager.createSketch(id);

    var array = manager.getSketchIds();
    assert.equal(array.length, 1);
    assert.equal(array[0], id);
});

test("sketch surface reset", function(assert) {
    var manager = new SketchSurfaceHandler();
    var id = "5"; // so unique much wow.
    var sketch = manager.createSketch(id);

    var array = manager.getSketchIds();
    assert.equal(array.length, 1);
    assert.equal(array[0], id);

    manager.reset();
    array = manager.getSketchIds();
    assert.equal(array.length, 0);
});

test("add element throws exception when not correct type", function(assert) {
    var manager = new SketchSurfaceHandler();
    assert.throws(function() {
        manager.addElement({});
    });
});

QUnit.module("sketch surface manager", {
    teardown : function() {
        document.getElementById("sketchLocationCreator").innerHTML = "";
        SKETCHING_SURFACE_HANDLER.reset();
    }
});

test("add Element without Id throws an error", function(assert) {
    var manager = new SketchSurfaceHandler();

    var sketch = new SketchSurface();
    assert.throws(function() {
        manager.addElement(sketch);
    });

});

test("delete sketch removes all children", function(assert) {
    var manager = new SketchSurfaceHandler();

    var sketchSurface = document.createElement("sketch-surface");
    document.getElementById("sketchLocationCreator").appendChild(sketchSurface);

    manager.addElement(sketchSurface);

    manager.deleteSketch(sketchSurface.id);
    assert.equal(document.getElementById("sketchLocationCreator").children.length, 0);
});

test("finds all sketch surfaces in a given element", function(assert) {
    var manager = new SketchSurfaceHandler();

    var parent = document.getElementById("sketchLocationCreator");

    var sketchSurface = document.createElement("sketch-surface");
    console.log("ADDING SURFACE 1 TO THE DOM");
    parent.appendChild(sketchSurface);
    console.log("TEMP MANAGER");
    console.log(sketchSurface.updateListTEMP);
    console.log("SURFACE 1 ID");
    console.log(sketchSurface.id);

    var sketchSurface2 = document.createElement("sketch-surface");
    console.log("TEMP MANAGER");
    console.log(sketchSurface2.updateListTEMP);

    console.log("ADDING SURFACE TWO TO THE DOM");

    parent.appendChild(sketchSurface2);

    assert.equal(sketchSurface.updateListTEMP, sketchSurface2.updateListTEMP);
    manager.addFromElement(parent);
    assert.equal(manager.getSketchSurface(sketchSurface.id), sketchSurface);
    assert.equal(manager.getSketchSurface(sketchSurface2.id), sketchSurface2);
});
*/
