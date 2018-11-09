function getType(any) {
  return Object.prototype.toString.call(any);
}

function isArray(any) {
  return getType(any) === "[object Array]";
}

function isFunc(any) {
  return getType(any) === "[object Function]";
}

function isObject(any) {
  return getType(any) === "[object Object]";
}

// function travel(data) {
//   if (isObject(data)) {
//     Object.keys(data).forEach(function(key) {
//         data[key] = travel(data[key]);
//     })
//   }

//   if (isFunc(data)) {
//     data = travel(data());
//   }

//   if (isArray(data)) {
//     for (var i = 0; i < data.length; i++) {
//       data[i] = travel(data[i]);
//     }
//   }

//   return data;
// }

function travel(data, args) {
    if (isObject(data)) {
      Object.keys(data).forEach(function(key) {
          data[key] = travel(data[key]);
      })
    }
  
    if (isFunc(data)) {
      data = travel(data(args));
    }
  
    if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = travel(data[i]);
      }
    } 
    return data;
}

var data = {
  a: 1,
  b: () => {
    return 2 * 3;
  },
  c: {
    d: 7,
    e: () => {
      return 88;
    }
  },
  f: [
    1,
    () => {
      return 6;
    },
    {
        b: 5,
        c: {
            d: () => {
                return 99
            }
        }
    }
  ]
};
console.log(data)
console.log(travel(data));
