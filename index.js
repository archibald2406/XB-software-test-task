const sampleData = `"Nashville, TN", 36.17, -86.78;
"New York, NY", 40.71, -74.00;
"Atlanta, GA", 33.75, -84.39;
"Denver, CO", 39.74, -104.98;
"Seattle, WA", 47.61, -122.33;
"Los Angeles, CA", 34.05, -118.24;
"Memphis, TN", 35.15, -90.05;`;

const localStorageData = localStorage.getItem('cities');

const data = localStorageData ? localStorageData : sampleData;

class CityMap {
  constructor(data) {
    this.citiesList = [];

    const rowValidator = /^"[a-zA-Z]+(?:[\s-][a-zA-Z]+)*, [A-Z]{2}", -?\d+(\.\d+)?, -?\d+(\.\d+)?;$/;
    let dataRows = data.split('\n').filter(dataRow => dataRow.match(rowValidator));

    dataRows = dataRows.filter(dataRow => {
      const row = dataRow.split(', ');
      return latLongBoundsValidator(row[2], row[3]);
    });

    this.citiesList = dataRows.map(dataRow => {
      const row = dataRow.split(', ');

      return {
        city: row[0].slice(1),
        state: row[1].slice(0, row[1].length - 1),
        latitude: parseFloat(row[2]),
        longitude: parseFloat(row[3])
      };
    });
  }

  getFarthestCity(cardinalDirection) {
    switch (cardinalDirection) {
      case 'north':
        return getNorthernmostCity(this);
      case 'east':
        return getEasternmostCity(this);
      case 'south':
        return getSouthernmostCity(this);
      case 'west':
        return getWesternmostCity(this);
      default:
        return 'Wrong cardinal direction. It should be: "north", "east", "south" or "west".';
    }
  }

  getClosestCity(latitude, longitude) {
    if (!(typeof latitude === 'number') || !(typeof longitude === 'number') ||
      !latLongBoundsValidator(latitude, longitude)) {
      return 'Invalid latitude or longitude.';
    }

    const citiesDistancesList = createDistancesList(this, latitude, longitude);
    const minDistance = Math.min.apply(null, citiesDistancesList.map(city => city.distance));

    return citiesDistancesList.find(city => city.distance === minDistance).city;
  }

  getStates() {
    return this.citiesList.reduce((currentStateList, city) => {
      return currentStateList.indexOf(city.state) === -1 ? currentStateList + city.state + ' ' : currentStateList;
    }, '').trim();
  }

  getCitiesOfState(state) {
    return state.match(/^[A-Z]{2}$/)
    ? this.citiesList.filter(city => city.state === state).map(city => city.city) 
    : 'Invalid state name.';
  }

  addNewCity(city) {
    this.citiesList.push(city);
  }
}

function latLongBoundsValidator(latitude, longitude) {
  return -90 <= parseFloat(latitude) && parseFloat(latitude) <= 90 &&
         -180 <= parseFloat(longitude) && parseFloat(longitude) <= 180;
}

function getNorthernmostCity(context) {
  const maxLatitude = Math.max.apply(null, context.citiesList.map(city => city.latitude));
  return context.citiesList.find(city => city.latitude === maxLatitude).city;
}

function getEasternmostCity(context) {
  const maxLongitude = Math.max.apply(null, context.citiesList.map(city => city.longitude));
  return context.citiesList.find(city => city.longitude === maxLongitude).city;
}

function getSouthernmostCity(context) {
  const minLatitude = Math.min.apply(null, context.citiesList.map(city => city.latitude));
  return context.citiesList.find(city => city.latitude === minLatitude).city;
}

function getWesternmostCity(context) {
  const minLongitude = Math.min.apply(null, context.citiesList.map(city => city.longitude));
  return context.citiesList.find(city => city.longitude === minLongitude).city;
}

function createDistancesList(context, latitude, longitude) {
  return context.citiesList.map(city => {
    const firstCathetus = Math.pow(city.latitude - latitude, 2);
    const secondCathetus = Math.pow(city.longitude - longitude, 2);
    const distanceToTargetLocation = Math.sqrt(firstCathetus + secondCathetus);
    
    return {
      city: city.city,
      distance: distanceToTargetLocation
    };
  });
}

const cityMap = new CityMap(data);

//*** Examples of methods work ***
console.log(`The northernmost city is ${cityMap.getFarthestCity('north')}.`);
console.log(`The easternmost city is ${cityMap.getFarthestCity('east')}.`);
console.log(`The southernmost city is ${cityMap.getFarthestCity('south')}.`);
console.log(`The westernmost city is ${cityMap.getFarthestCity('west')}.`);

console.log(`The city that is closest to target location is ${cityMap.getClosestCity(33, -132.32)}.`);

console.log(`All states: ${cityMap.getStates()}.`);

console.log(`Cities of TN state: ${cityMap.getCitiesOfState('TN')}.`);
console.log(`Cities of CA state: ${cityMap.getCitiesOfState('CA')}.`);
//******

function validateCity(city) {
  const cityValidator = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
  const stateValidator = /^[A-Z]{2}$/;
  const latLongValidator = /^-?\d+(\.\d+)?$/;

  return city.city.match(cityValidator) &&
         city.state.match(stateValidator) &&
         city.latitude.match(latLongValidator) &&
         city.longitude.match(latLongValidator) &&
         latLongBoundsValidator(city.latitude, city.longitude);
}

function onSubmit(citiesListObj) {
  const form = document.forms.addCity;
  document.querySelector('#errorMessage').textContent = '';

  const newCity = {
    city: form.elements.city.value,
    state: form.elements.state.value,
    latitude: form.elements.latitude.value,
    longitude: form.elements.longitude.value
  };

  if (validateCity(newCity)) {
    newCity.latitude = parseFloat(newCity.latitude);
    newCity.longitude = parseFloat(newCity.longitude);
    citiesListObj.addNewCity(newCity);
    
    alert('City successfully added!');
  } else {
    const errorMessage = 'Invalid data in form is founded';
    document.querySelector('#errorMessage').textContent = errorMessage;
  }
}

function saveSityListToLocalStorage(citiesListObj) {
  const data = parseCityDataToString(citiesListObj);
  localStorage.setItem('cities', data);
}

function parseCityDataToString(citiesListObj) {
  return citiesListObj.citiesList.map(city => {
    return `"${city.city}, ${city.state}", ${city.latitude}, ${city.longitude};`
  }).join('\n'); 
}

window.onbeforeunload = () => saveSityListToLocalStorage(cityMap);