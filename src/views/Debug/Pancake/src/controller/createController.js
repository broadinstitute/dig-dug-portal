import * as d3 from "d3";




function createCheckbox(config, domId, data, element){

    var select = document.getElementById(domId);
    select.innerHTML = '';
    
  
    var entity = domId.split("-")[2];
      data.unshift("All");
  
    for (var j = 0; j<=data.length-1; j++){
  
      var item = document.createElement('div');
      let checkbox = document.createElement('input'); 
  
      checkbox.type = "checkbox"; 
      checkbox.className = element + "-" + entity;
      checkbox.value = data[j]
      checkbox.id = entity + "-" + data[j];
  // determine if All should be selected based on checkedSelections
     var array = config.filterActive.checkedSelections[entity]
     if (array.length == 0){
      if (data[j] == "All"){ 
        checkbox.checked = true 
      }
     } else {
      for (var arr = -1; arr < array.length; arr++){
        if (checkbox.value == array[arr]){ 
          checkbox.checked = true  
        }
      } 
     }
      let label = document.createElement('label'); 
      label.htmlFor = entity + "-" + data[j];
      label.innerHTML = data[j] 
  
      item.appendChild(checkbox)
      item.appendChild(label)
      select.appendChild(item)
    }
  }

  
function createDropdown(dom, array, active){

 // if (array.length > 1){
    array.unshift("All");
 // } 

    d3.select("#" + dom).selectAll("option").remove()
    var select = document.getElementById(dom);
  
    for (var i = 0; i<=array.length-1; i++){
        var opt = document.createElement('option');
        opt.value = array[i];
        if (array[i] == "All"){
          opt.innerHTML = `${array[i]} (${array.length - 1})`
        } else {
          opt.innerHTML = array[i];
        }
      
        if (array[i][active] == true){
          opt.selected = "selected"
        } else if (array[i] == active){
            opt.selected = "selected"
        }
        select.appendChild(opt);
    }
  }

  function createDropdown2(dom, array, active){

    d3.select("#" + dom).selectAll("option").remove()
    var select = document.getElementById(dom);
  
    for (var i = 0; i<=array.length-1; i++){
        var opt = document.createElement('option');
        opt.value = array[i];
        opt.innerHTML = array[i];
        if (array[i] == active){
            opt.selected = "selected"
        }
        select.appendChild(opt);
    }
  }


  function createSelect(dom, array, active){

    d3.select("#" + dom).selectAll("option").remove()
    var select = document.getElementById(dom);
  
    for (var i = 0; i<=array.length-1; i++){
        var opt = document.createElement('option');
        opt.value = array[i].value;
        opt.innerHTML = array[i].name;
        if (array[i][active] == true){
          opt.selected = "selected"
        }
        select.appendChild(opt);
    }
  }

  function createButton(dom, data, colorScale){

    d3.select("#" + dom).selectAll("div").remove()
    var select = document.getElementById(dom);
  
    for (var i = 0; i<=data.length-1; i++){
        var opt = document.createElement('div');
        opt.id = data[i];
        opt.className = "pancakeplot-color-key";
        opt.style.backgroundColor = colorScale.get(data[i]);
        opt.style.opacity = .9;
        opt.style.color = "white";
  
        if (data[i] == "undefined"){
          opt.innerHTML = "false";
          opt.style.color = "black";
        } else {
          opt.innerHTML = data[i];
        }
        select.appendChild(opt);
    }
  
  }
  
  
  export{
      createCheckbox,
      createDropdown,
      createDropdown2,
      createButton,
      createSelect
  }