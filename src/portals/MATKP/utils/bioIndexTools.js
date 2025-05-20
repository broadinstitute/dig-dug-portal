const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

export async function getParams(endpoint, arity=2){
  let params = [];
  let url = `${BIO_INDEX_HOST}/api/bio/keys/${endpoint}/${arity}`;
  try {
      const response = await fetch(url);
      const data = await (response.json());
      let allKeys = data.keys;
      params = Array.from(new Set(allKeys.map(item => item[0])));
  } catch (error) {
      console.error("Error: ", error);
  }
  return params;
}