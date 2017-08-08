exports.analyze = function(data, callback) {
  var orderDetail = data.BBIORD01OperationResponse.ca.ca_order_detail;
  var items = {};

  // Go through the list once to cound how different trips that they bought an item
  // regardless of the quantity that they bought at the time.
  for (var i in orderDetail) {
    var item = orderDetail[i];

    var productNumber = item.ca_product_num;

    if (!items[productNumber]) {
      items[productNumber] = [];
    }

    items[productNumber].push(item);
  }

  // Version 1 of the algorithm is to look at the most often purchased item over the period of
  // time.

  // Currently we are just looking for the top three items bought.
  // by changing the topX value, to a different value, it will search for the
  // top X values.  if you change it to 4, it will look for the top 4 items bought
  var topX = 3;
  var topXList = [];
  for (var i = 0; i < topX; ++i) {
    topXList.push([]);
  }

  for (var i in items) {
    var itemRecord = items[i];
    var productName = itemRecord[0].ca_product_name;

    for (var j in topXList) {
      if (itemRecord.length > topXList[j].length) {
        topXList.splice(j, 0, itemRecord);
        topXList = topXList.slice(0, -1);
        break;
      }
    }
  }

  var customerId = data.BBIORD01OperationResponse.ca.ca_customer_num
  var results = [];
//  console.log('The top three items for ' + customerId + ' are: ');
  console.log('The top ' + topX + ' items for ' + customerId + ' are: ');
  for (var i in topXList) {
    if (topXList[i][0]) {
      results.push(topXList[i][0]);
      console.log('Name: ' + topXList[i][0].ca_product_name);
    }
  }

  callback(null, {
    customerid: customerId,
    recom: results
  });
}
