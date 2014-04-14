## Use

This is used to transpile to various formats.

    var res = transpile.to({
      name: "my/module",
      source: "var foo = require('foo')",
      metdata: {format: "cjs"}
    }, "amd")
    
    res //-> "define("my/module", function(require, exports, module) { ... "
    

It currently supports from:
 
 - es6, 
 - cjs, 
 - amd, 
 - steal
 
to 

 - amd, 
 - steal, 
 - cjs.

Currently, it can not transpile to ES6 module syntax.