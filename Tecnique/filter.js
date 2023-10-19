let api = "https://api/example/data";

fetch(api)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Response is not ok");
    }
    return response.json();
  })
  .then((data) => {
    let filterdata = data.filter((item) => item.year === 1915);
    console.log(filterdata);
  })
  .catch((err) => {
    console.log(err);
  });
