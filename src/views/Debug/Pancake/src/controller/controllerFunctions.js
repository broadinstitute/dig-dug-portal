
// ########################################################################
// ############ FILTER FUNCTIONS ##########################################
// ########################################################################

function recordFilters(selection, checkedSelections){

    let attribute = (selection.id).split("-")[0]

    if (selection.value == "All"){
      checkedSelections[attribute] = [] // clear array of selections for this attribute
     
      let checkboxes = document.getElementsByClassName("checkbox-item-" + attribute); // select checkboxes for this attribute
      for (var i = 0; i < checkboxes.length ; i++){ checkboxes[i].checked = false  } // uncheck all checkboxes for this attribute
     
      document.getElementById(attribute + "-All").checked = true // check "All" checkbox for this attribute
    } 

    else {
      
      document.getElementById(attribute + "-All").checked = false // uncheck "All" if anything else is selected
     
      checkboxListener(attribute, selection.value, checkedSelections) 

      if (checkedSelections[attribute].length == 0){
        document.getElementById(attribute + "-All").checked = true // if none checked, check All
      }

    }

    return checkedSelections
}

/**
 * Check the function to see if it can be more efficient
 */
function filterCheckedSelections(data, selections){
    var filtered;
    selections = checkProperties(selections)

    if (Object.getOwnPropertyNames(selections).length === 0){  // if all attributes are empty, return all data
      filtered = data  
     } 
    else {
      filtered = []
      data.forEach(function(d){
           for (var prop in selections){
              for (var i=0; i < selections[prop].length; i++){
                if (d[prop] == selections[prop][i]){
                  filtered.push(d)
                }
              }
           }
      }) 
    }
  return filtered
}
/**
 * 
 * @param {*} obj is selections. 
 * the function returns just the attributes that arent empty 
 * but this isn't necessary. filter function should just account for empty arrays
 */
function checkProperties(obj) {
    var newobj = {};
    for (var key in obj) {
        if (obj[key].length !== 0){
          newobj[key] = obj[key]
        } 
    } 
    return newobj;
}
// selection is checkbox value
// dimension is attribute to populate
// selections is updated filter obj
function checkboxListener(selection, attribute, selections){
  // see if we are checking or unchecking item, by selecting it by its id
  checkedStatus(selection, attribute, selections)
  return selections
}

function checkedStatus(attrName, attrValue, selections) {

    if (selections[attrName].includes(attrValue)){
      removeItem(selections[attrName], attrValue)
    } 
    else {
      addItem(selections[attrName], attrValue)
    }
    return selections
}

function addItem(arr, item){
  if (!arr.includes(item)){  arr.push(item);  } 
  return arr
}

function removeItem(arr, item){
  for( var i = 0; i < arr.length; i++){ 
     if ( arr[i] === item) {  arr.splice(i, 1);  }
  }
  return arr
}
// ######################################################
// ######################################################
// function filterByFieldValue(data, filterField, filterBy){
//   let fdata = data.filter(function(d){
//     return d[filterField] == filterBy
//   })
//   return fdata
// }
// ################################################
// @ returns data filtered by credible set 
// function credibleSetDataHandler(data, credibleSet){
//   var subset;
//   if (credibleSet == "All"){ subset = data
//   } else{ subset = (filterByFieldValue(data, "credibleSetId", credibleSet))  }
//   return subset
// }

export{
    recordFilters,
    filterCheckedSelections
    // filterByFieldValue,
    // credibleSetDataHandler
}