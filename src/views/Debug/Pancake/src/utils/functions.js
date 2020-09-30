function makeSet(data, field){
    var set = [...new Set(data.map(d => d[field] ))];
    return set
  }

function ConvertToDecimal(num) {
    num = num.toString(); //If it's not already a String
    num = num.slice(0, (num.indexOf(".")) + 3); //With 3 exposing the hundredths place
    return  Number(num); //If you need it back as a Number    
}




  export{
      makeSet,
      ConvertToDecimal
  }