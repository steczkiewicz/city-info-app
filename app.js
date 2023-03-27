import express from "express";
import cors from "cors";
import fetch from "node-fetch";
const app = express();
app.use(express.json());
app.use(cors());

const API_KEY_WEATHER = "260637e2e06eca0ee452293aca3810d0";
const API_KEY_C = "200ca9df019b49ffa1f1bd726600e14f";

app.get("/:name", async (req, res) => {
  try {
    if (!areDatesValid(req.query.start_date, req.query.end_date)) {
      return res.status(400).send("At least one of the dates is not valid!");
    }

    if (!isCityValid(req.params.name)) {
      return res.status(400).send("Not a valid city name!");
    }

    const weatherUrl = `https://pro.openweathermap.org/data/2.5/weather?q=${req.params.name}&appid=${API_KEY_WEATHER}`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      return res.status(502).send("Weather API request failed");
    }

    const weatherData = await weatherResponse.json();

    const country = weatherData.sys.country;

    const countryUrl = `https://restcountries.com/v2/name/${country}?fullText=true`;
    const countryResponse = await fetch(countryUrl);

    if (!countryResponse.ok) {
      return res.status(502).send("Country API request failed");
    }

    const countryData = await countryResponse.json();

    const curr = countryData[0].currencies[0].code;

    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    let max_ratio = 0;
    let min_ratio = 999999;
    for (
      let date = startDate;
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const historicalUrl = `https://openexchangerates.org/api/historical/${date
        .toISOString()
        .slice(0, 10)}.json?app_id=${API_KEY_C}&symbols=${curr}`;
      const historicalResponse = await fetch(historicalUrl);
      if (!historicalResponse.ok) {
        return res.status(502).send("Historical API request failed");
      }
      const historicalData = await historicalResponse.json();
      max_ratio = Math.max(historicalData.rates[curr], max_ratio);
      min_ratio = Math.min(historicalData.rates[curr], min_ratio);
    }

    const currUrl = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY_C}&symbols=${curr}`;
    const currResponse = await fetch(currUrl);

    if (!currResponse.ok) {
      return res.status(502).send("Currency API request failed");
    }

    const currData = await currResponse.json();

    const combinedData = {
      city: weatherData.name,
      country: countryData[0].nativeName,
      time: getCurrentTime(weatherData.timezone),
      temperature: Math.round(weatherData.main.temp - 273),
      max_temp: Math.round(weatherData.main.temp_max - 273),
      min_temp: Math.round(weatherData.main.temp_min - 273),
      wind: `${weatherData.wind.speed}m/s ${getWindDirection(
        weatherData.wind.deg
      )}`,
      currency: countryData[0].currencies[0].code,
      curr_ratio: currData.rates[curr],
      curr_max: max_ratio,
      curr_min: min_ratio,
      image: countryData[0].flags.png,
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching data");
  }
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});

const getWindDirection = (degrees) => {
  const directions = [
    [0, "N"],
    [45, "NE"],
    [90, "E"],
    [135, "SE"],
    [180, "S"],
    [225, "SW"],
    [270, "W"],
    [315, "NW"],
    [360, "N"],
  ];

  for (let i = 0; i < directions.length - 1; i++) {
    if (degrees >= directions[i][0] && degrees < directions[i + 1][0]) {
      return directions[i][1];
    }
  }

  return null;
};

const getCurrentTime = (timezoneOffset) => {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = utcTime + timezoneOffset * 1000;
  const localDate = new Date(localTime);
  return localDate.toLocaleTimeString();
};

const areDatesValid = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return false;
  }

  return true;
};

const isCityValid = (city) => {
  const regex = /^[A-Za-z\s-żźćńółęąŻŹĆĄŚĘŁÓŃáéíóúñÁÉÍÓÚÑüÜçÇàèìòùÀÈÌÒÙäëïöüÄËÏÖÜÿŸæÆœŒß]+$/;
  if (!regex.test(city)) {
    return false;
  }

  if (city.length < 2 || city.length > 50) {
    return false;
  }

  return true;
}
