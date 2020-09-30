import * as d3 from "d3";


/**
 * Generate a list of Point objects with values based on a normal distribution of specified mu and sigma. 
 * @param {Number} data: need for sorting? 
 * @param {Object?} x: 
 * @param {Object?} y: 
 * @returns 
 */
var minCellSize = 25,
    maxCellSize = 50,
    defaultCellSize = 25;

    function nodes(config, data, xConfig, yConfig, ya_, yb_){

        var x = xConfig.attribute[xConfig.attribute.length - 1] // x
        var y = yConfig.attribute[yConfig.attribute.length - 1] // y
       
        var yb = yb_[yb_.length - 1] // the leaf of the dependent axis
        var ya = ya_;    
        // group elements by xy
        var nest = d3.nest()
            .key(function(d){ return d[x] + "*" + d[y] })
            .entries(data.filter(function(d){ return d[y] != undefined }) ) // remove data that doesn't apply to parent node (ie no tissue or gene)
    
        transformHier(nest) // replace key/values with name/children for d3.js circlePacking layout req
    
        var scaleR = d3.scaleSqrt()
          .domain([0, 150])
          .range([0, config.axis.x.tickSize])


      nest.forEach(function(d){
        d.x = xConfig.scale.get( d.name.split("*")[0] ) // replace this with a map result for value once you calc them
        d.y = yConfig.scale.get( d.name.split("*")[1] )
        d.xName = d.name.split("*")[0]
        d.yName = d.name.split("*")[1]
        d.xField = x;
        d.yField = y;
        d.yaField = ya;
        d.ybField = yb;

        var value = []

        d.definition = {
          x: {
            name: d.name.split("*")[0],
            attribute: x
          },
          y: {
            name: d.name.split("*")[1],
            attribute: y
          }
        }
        // group elements by xy
        var nodes = d3.nest()
            .key(function(e){ return e[ya] + "*" + e[yb] })
            .entries(d.children)

        transformHier(nodes)
    
        nodes.forEach(function(e){

          e.lineOfEvidence = e.name.split("*")[0];
          e[yb] = e.name.split("*")[1]; // gene or tissue
          e.definition = [
            {name: e.lineOfEvidence, attribute: "lineOfEvidence" }, 
            {name: e[yb], attribute: yb }, 
            {name:d.definition.y.name, attribute: d.definition.y.attribute}
          ]

            e.yName = [e.name.split("*")[0], e.name.split("*")[1]]
            e.yaName = e.name.split("*")[0];
            e.ybName = e.name.split("*")[1];
            e.yaField = ya[0];
            e.ybField = yb;
            e.value = 1;
          //  e.children_ = e.children;
            e.legend = {
              name:   e.ybName,
              field: e.ybField
            }
            delete e.children;
            value.push(e.value)
            
        })
        d.nodes = nodes;
    
        var root = {name: d.name, children: nodes }
        root.value = d3.sum(value)
        d.value = root.value;
    
      var packedLayout = d3.pack()
          .size([root.value*2, root.value*2])
          .padding(.2)
          .radius(function(d){ return scaleR(d.value)})
    
        d.pack = packedLayout(d3.hierarchy(root)).descendants()
        d.pack.forEach(function(e){

          if (e.depth >0){
            e.definition = e.data.definition;
          } else {
            e.definition = d.definition
          }

          e.group = e.data.name.split("*")[0]
          e.leaf = e.data.name.split("*")[1] 

        })
    
      })

        return nest
    }


    

// config is one of the axes. it has attribute list, sort 
function axis(data, config, pixelRange, maps){
  var attr = config.attribute[config.attribute.length - 1] 
  var sort = config.sort;
  var sortMap;
  if (sort != "name"){ sortMap = (maps[attr])[sort]; } 
  else { sortMap = "name" }

  data = data.filter(function(d){ return d[attr] != undefined})
  var nest = createHier(data, config.attribute) 
  nest = transformHier(nest) // dont do this 


  if (config.attribute.length == 2){

    nest.forEach(function(d){
    /**
     * to improve performance try adding the attribute during transform hierarchy
     */
      d.attribute = config.attribute[0]
      /** 
       * 
      */
      d.children = d.children.sort(function(a, b){
        if (sortMap != "name"){
          return d3.descending(sortMap.get(a.name), sortMap.get(b.name))
        } else {
          return d3.descending(a.name, b.name)
        }
      })
      d.children.forEach(function(e){
        e.attribute = config.attribute[1]
      })
    })
  } else {
    /**
     * to improve performance try adding the attribute during transform hierarchy
     */
    nest.forEach(function(d){   d.attribute = config.attribute[0] })
          /** 
       * 
      */
    nest = nest.sort(function(a, b){
      if (sortMap != "name"){
        return d3.descending(sortMap.get(a.name), sortMap.get(b.name))
      } else {
        return d3.descending(a.name, b.name)
      }
    })
  }

  // nest = removeLeaves(nest, config.attribute) 

   var numKeys = nest.length;
   var numValues = getNumLeaves(nest, config.attribute) // this could be simpler

   var tickSizeSum = numKeys + numValues;
   config.tickSize = calcCellSize(tickSizeSum, pixelRange)

  
   var model = calcPosition(nest, config.attribute, config.tickSize)
   return model

}

function createHier(data, features){
	var nest = d3.nest();
	for (var i = 0; i < features.length; i++) {
	    nest = nest.key( generateNest(features[i]) );
  }
  // rename to use name for key and child for
    return nest.entries(data)
}

	function generateNest(propertyName){
	  return function(d){ 
	            return d[propertyName];
	         };
  }
  
  function transformHier(nest){
    nest.forEach(function(d){
        d.name = d.key
        d.children = d.values;
        delete d.values
        delete d.key

        d.children.forEach(function(e){
         
          if (e.values){
            e.name = e.key
            e.children = e.values
            delete e.values
            delete e.key
        
            // e.children.forEach(function(f){
            //   if (f.values){
            //     f.name = f.key
            //     f.children = f.values
            //     delete f.key
            //     delete f.values
            //   }
            // })

          }
        })
    })
    return nest
   // return removeUndefinedKeys(nest)
  }

  function getNumLeaves(nest, levels){
    var leaves = []
   if (levels.length == 2){
     nest.forEach(function(d){
        d.children.forEach(function(e){
            leaves.push(e)
        })
     })
     return leaves.length
    } else {
        return 0
    }
  }

  function calcCellSize(size, maxSize){
    var cellSize;
    if (maxSize == false){   maxSize = size * defaultCellSize;  }  
    cellSize = maxSize/ size
	if (cellSize >= maxCellSize){ cellSize = maxCellSize
	} else if (cellSize <= minCellSize){ cellSize = minCellSize }
	return cellSize
}


  function calcPosition(nest, levels, size){
    var newnest;
    if (levels.length == 1){
      newnest = oneLevel(nest, size)
    }
   else  if (levels.length == 2){
     newnest = twoLevel(nest, size)
    }
    return newnest
  }
  
  
    function oneLevel(nest, size){
        var prev;
        nest.forEach(function(d, i){
        var start, end;
        if (i==0){
            start = 0
            end = size
            prev = end
        } else {
            start = prev
            end = start + size
            prev = end;
        }
        d.x = start
        d.x0 = start
        d.y = 0
        d.y0 = 0
        d.depth = 1
        })
        return nest
    }
  
  
  function twoLevel(nest, size){
    var prevEndPosition;
    var flat = []
  
    nest.forEach(function(d, i){

         var sizeOfGroup = (d.children.length * size) + size;
          var parentStartPos, parentEndPos;
      
          if (i == 0){
            parentStartPos = 0;
            parentEndPos = sizeOfGroup;
            prevEndPosition = parentEndPos;
          } else {
            parentStartPos = prevEndPosition;
            parentEndPos = parentStartPos + sizeOfGroup
            prevEndPosition = parentEndPos
          }
          d.x = parentStartPos
          d.y = 0
          d.x0 = parentStartPos
          d.y0 = 0
          d.depth = 1
          var prevChildEndPosition;
      
          d.children.forEach(function(e, j){
            var childStartPosition;
            if (j==0){
              prevChildEndPosition = parentStartPos + size
              childStartPosition = prevChildEndPosition
            } else {
              prevChildEndPosition = prevChildEndPosition + size
              childStartPosition = prevChildEndPosition
            }
            e.x0 = childStartPosition
            e.y0 = 0
            e.x = childStartPosition
            e.y = 0
            e.depth = 2
            flat.push(e)
          })
          flat.push(d)
    })
    return flat
  }
  
  // function removeLeaves(nest, levels){
//     nest.forEach(function(d){ 
//         if (levels.length == 1){
//             delete d.children
//             d.value = 1
//         }   
//         else if (levels.length == 2){
//             d.children.forEach(function(e){
//                 delete e.children
//                 e.value = 1
//               })
//         } 
//         else if (levels.length == 3){
//             d.children.forEach(function(e){
//                 e.children.forEach(function(f){
//                     delete f.children
//                     f.value = 1
//                 })
//               })
//         }
//     }) 
//     return nest
// }

// function removeUndefinedKeys(nest){
//     nest = nest.filter(function(d){ return d.name != "undefined"})
//     return nest
//   }

//function betterHierarchyCommingSoon(){
    //  let range = [];
  //  for (let root = 0; root < nest.length; root++){
  //    if (config.attribute.length <=1){
  //       range.push({"parentId":false, "id":`${config.attribute[0]}:${nest[root].key}`, "name": nest[root].key, "depth":0, "attribute":config.attribute[0] })
  //    }  
  //    else {
  //       range.push({"id":`${config.attribute[0]}:${nest[root].key}`, "name": nest[root].key, "depth":0, "attribute":config.attribute[0] })
  //     for(let leaf = 0; leaf < nest[root].values.length; leaf++){
  //       range.push({"parentId":`${config.attribute[0]}:${nest[root].key}` ,"id":`${config.attribute[1]}:${nest[root].values[leaf].key}`, "name": nest[root].values[leaf].key, "depth":1, "attribute":config.attribute[1] })
  //     }
  //    }
  //  }
    // nest.forEach(function(d){
    //   d.values.forEach(function(e){ 
    //     let sort;
    //     e.values.forEach(function(f){
    //         sort = f[config.sort]
    //     })
    //     e.sort = sort;
    //     if (d.key != undefined){
    //       e.values.sort(function(a, b){
    //         return d3.descending( a.sort, b.sort ) 
    //       })
    //     }
    //     d.values = d.values.sort(function(a, b){ return d3.descending(a.sort, b.sort)})
    //   })
    // })
//}
  





export {
    axis,
    nodes
};
