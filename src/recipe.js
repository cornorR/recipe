recipe = (function(global, head, Q){
  'use strict';

  var base = '',
      method = '',
      cache = {},
      hasValue = function(value, array){
        var i, len;

        for(i = 0, len = array.length; i < len; i++){
          if(value === array[i]) {
            return true;
          }
        }
        return false;
      },
      dfd = {
        version: Q.defer(),
        dependencies: Q.defer()
      },
      uniq = function(array){
        var i,
            len,
            uniqued = [];
        for(i = 0, len = array.length; i < len; i++){
          if( !hasValue(array[i], uniqued) ){
           uniqued.push(array[i]);
          }
        }
        return uniqued;
      },
      define = function(id, deps, callback){
        var exports = recipe.exports,
            exported,
            variables = [],
            variable,
            i,
            length = deps.length;

        //initialize namespace

        for(i=0;i<length;i++){
          variable = recipe.exports[deps[i]];
          variables.push( variable );
        }

        exported = callback.apply( global, variables);

        if(exported) {
          recipe.exports[id] = exported;
        }
      },
      recipe = function(options){
        var namespace,
            exports = (options||{}).exports||{},
            libraries = (options||{}).libraries||[],
            scripts = (options||{}).scripts||[],
            isAmd = (options||{}).amd||false,
            urls = [],
            args = [],
            dfd = Q.defer(),
            len,
            deps,
            set,
            i;

        if(isAmd){
          if(!recipe.define){
            recipe.define = define;
          }

          for(namespace in exports){
            recipe.exports[namespace] = exports[namespace];
          }
        }

        recipe.get.version().promise.then(function(version){
          recipe.get.dependencies(isAmd).promise.then(function(dependencies){
            for( i = 0, len = libraries.length; i<len; i++){
              namespace = libraries[i];
              deps = dependencies[namespace];
              if(!deps && !recipe.exports[namespace]) {
                dfd.reject("Ingredients not found. namespace["+libraries[i]+"]");
                return dfd;
              }
              if(deps){
                urls = urls.concat( deps );
              }
            }

            urls = uniq( urls.concat(scripts) );
            for( i = 0, len = urls.length; i<len; i++){
              set = urls[i].split("#");
              if(!set[0]){
                dfd.reject("Illegal URL were exists. [\""+urls.join("\", \"")+"\"]");
                return dfd;
              }
              args.push(set[0]+"?_="+version+(set[1]?"#"+set[1]:""));
            }

            if(args.length) {
              args.push(function(){
                dfd.resolve(recipe.get.variables(libraries, isAmd));
              });
              head.js.apply(head, args);
            } else {
              dfd.resolve(recipe.get.variables(libraries, isAmd));
            }

          });
        });
        return dfd.promise.fail(function(e){
          if(global.console && global.console.error){
            console.error(e);
          }
          throw e;
        });
      },
      methods = {
        init: function(){
          var menu = recipe.get.menu();
          
          base = menu.replace(/\/[^\/]+$/, "");
          if(!menu) {
            throw "You might forget to order because of menu was not founded.";
          }

          recipe.setExportsFromAttribute();
          recipe.get.version().promise.then(function(version){
            recipe.resolve(menu, version);
          });

        },
        resolve: function(url, version){
          var set = url.split("#");
          head.js(set[0]+"?_="+version+(set[1]?"#"+set[1]:""));
        },
        setExportsFromAttribute: function(){
          var script = recipe.get.recipeTag()|| {getAttribute: function(){}},
              exports = (script.getAttribute('data-exports')||'').split(','),
              jQueryNoConflict = script.getAttribute('data-jquery-noconflict'),
              i,
              len,
              namespace,
              variable;

          for(i=0, len=exports.length; i < len; i++){
            namespace = exports[i];
            if(namespace){
              variable = global[namespace];
              if(namespace === 'jQuery' && jQueryNoConflict ){
                variable = global.jQuery.noConflict(jQueryNoConflict === "true" ? true : undefined);
              }
              recipe.exports[namespace] = variable;
            }
          }
        },
        get: {
          recipeTag: function(){
            var scripts,
                i,
                len,
                script,
                src;

            if(cache.recipeTag){
              return cache.recipeTag;
            }
            scripts = document.getElementsByTagName("script");

            if(scripts){
              for(i=0, len = scripts.length; i<len; i++){
                script = scripts[i];
                src = script.src || "";
                if( /\/recipe\.js(\?.*)?$/.test( src ) && script.getAttribute('data-menu')){
                  cache.recipeTag = script;
                  return script;
                }
              }
            }
          },
          menu: function(){
            var script = recipe.get.recipeTag() || {getAttribute:function(){}},
                menu = script.getAttribute("data-menu"),
                url = (script.getAttribute("src")||"").replace(/[^\/]+$/, "")+menu+".js";
            return menu ? url : "";
          },
          version: function(){
            if( !recipe.version ) {
              head.js(base+'/recipe.version.js?_='+(new Date().getTime()), function(){
                dfd.version.resolve(recipe.version);
              });
            } else {
              dfd.version.resolve(recipe.version);
            }
            return dfd.version;
          },
          dependencies: function(isAmd){
            if(!recipe.dependencies) {
              head.js(base+'/recipe.'+(isAmd?'amd.':'')+'dependencies.js?_='+recipe.version, function(){
                dfd.dependencies.resolve(recipe.dependencies);
              });
            } else {
              dfd.dependencies.resolve(recipe.dependencies);
            }
            return dfd.dependencies;
          },
          variables: function(libraries, isAmd){
            var variables = {},
                exports = recipe.exports,
                namespace,
                i, len;

            if(isAmd) {
              for(i=0, len=libraries.length; i<len; i++){
                namespace = libraries[i];
                variables[namespace] = exports[namespace];
              }
              return variables;
            }
          }
        }
      };

  for(method in methods){
    recipe[method] = methods[method];
  }
  recipe.exports = recipe.exports || {Q:Q};
  define.amd = {};

  recipe.init();
  return recipe;
})(this, head, Q);