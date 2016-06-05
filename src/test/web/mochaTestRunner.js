var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');
require("mocha-qunit-ui");
var recursive = require('recursive-readdir');

// Instantiate a Mocha instance.
var mocha = new Mocha({
    ui:"qunit"
});

var testDir = 'sketching';

recursive(testDir,['*.html'], function (err, files) {
    console.log('files loaded!');
  files.forEach(function(file){
      console.log(
          'adding file', file
      );
      mocha.addFile(
          path.join(testDir, file)
      );
  });
console.log('running tests');
// Run the tests.
    mocha.run(function(failures){
        process.on('exit', function () {
            process.exit(failures);  // exit with non-zero status if there were failures
        });
    });
});
