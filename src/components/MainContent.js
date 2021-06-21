import React, { useState, useEffect } from "react";
import { format, addDays, eachDayOfInterval } from "date-fns";

const MainContent = () => {
  const [weather, setWeather] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [symbol, setSymbol] = useState("");
  const [weatherData, setWeatherData] = useState("");

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const getDayString = (index) => {
    let mydate = new Date();
    const fullDay = days[(mydate.getDay() + index) % 7];
    return fullDay.substr(0, 3);
  };

  const dateBuilder = () => {
    let mydate = new Date();
    let hours = mydate.getHours();
    var minutes = (mydate.getMinutes() < 10 ? "0" : "") + mydate.getMinutes();
    let today = days[mydate.getDay()]; //getDay()=no 0-6
    return `${today} ${hours}:${minutes} `;
  };

  //using date-fns date utility library
  //get 6 days from tomorrow
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);
  const thisWeek = eachDayOfInterval({ start: today, end: sevenDaysFromNow });
  thisWeek.shift();

  //using date-fns date utility library
  //format to match api-dates
  const formattedDate = thisWeek.map((item) => {
    return format(item, "yyyy-MM-dd'T12'");
  });

  //get icon
  const icon = (symbol) => {
    return (
      <img src={require(`../assets/png/${symbol}.png`).default} alt={symbol} />
    );
  };

  useEffect(() => {
    let long;
    let lat;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        long = position.coords.longitude;
        lat = position.coords.latitude;

        const api = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${long}`;
        const legends = ` https://api.met.no/weatherapi/weathericon/2.0/legends`;
        const cityApi = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=sv`;

        //fetch city
        const getCity = async () => {
          try {
            const result = await fetch(cityApi);
            //result men status ej ok
            if (!result.ok) {
              throw Error("Could not fetch data");
            }
            const data = await result.json();
            setCity(data);
          } catch (err) {
            setError(err.message);
            console.log("Error:", err);
          }
        };
        getCity();
        //fetch weather forecast
        const getWeather = async () => {
          try {
            const result = await fetch(api);
            //result men status ej ok
            if (!result.ok) {
              throw Error("Could not fetch data");
            }
            const data = await result.json();
            setWeather(data);
          } catch (err) {
            setError(err.message);
            console.log("Error:", err);
          }
        };
        getWeather();
        //fetch legends
        const getDescription = async () => {
          try {
            const result = await fetch(legends);
            if (!result.ok) {
              throw Error("Could not fetch data");
            }
            const data = await result.json();
            setDescriptions(data);
          } catch (err) {
            setError(err.message);
            console.log("Error:", err);
          }
        };
        getDescription();
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (weather.properties) {
      console.log("weather.properties: ", weather.properties);
      //symbol
      const symbol =
        weather.properties.timeseries[0].data.next_1_hours.summary.symbol_code;
      setSymbol(symbol);

      //get my week from tomorrow from api
      const myWeek = formattedDate.map((refDate) => {
        return weather.properties.timeseries.filter((item) => {
          return item.time.includes(refDate);
        });
      });
      console.log("myWeek: ", myWeek);

      const daysInMyWeek = myWeek.map((item) => {
        return item[0];
      });
      console.log("daysInMyWeek: ", daysInMyWeek);

      const myWeatherData = daysInMyWeek.map((item, index) => {
        //   { day: "mon", icon: "rain", temp: "20°c", wind: "9m/s" },
        return {
          day: getDayString(index + 1),
          icon: item.data.next_6_hours.summary.symbol_code,
          temp:
            Math.round(item.data.next_6_hours.details.air_temperature_min) +
            "-" +
            Math.round(item.data.next_6_hours.details.air_temperature_max) +
            " °C",
          wind: item.data.instant.details.wind_speed + " m/s",
        };
      });
      //console.log("myWeatherData: ", myWeatherData);
      setWeatherData(myWeatherData);
    }
  }, [weather]);

  useEffect(() => {
    if (descriptions) {
      // console.log("descriptions: ", descriptions);
    }
  }, [descriptions]);
  useEffect(() => {
    // console.log("error: ", error);
  }, [error]);

  return (
    <section className="content">
      <header>
        <h2 className="city">{city.locality}</h2>
      </header>
      <main className="main">
        <section className="info">
          <p className="day">{dateBuilder()}</p>
          {descriptions[symbol] && (
            <p className="description">{descriptions[symbol].desc_en}</p>
          )}
        </section>
        <section className="icon">{symbol && icon(symbol)}</section>

        <section className="data">
          {weather.properties && (
            <div>
              <p className="degrees">
                {Math.round(
                  weather.properties.timeseries[0].data.next_6_hours.details
                    .air_temperature_min
                )}{" "}
                -{" "}
                {Math.round(
                  weather.properties.timeseries[0].data.next_6_hours.details
                    .air_temperature_max
                )}{" "}
                °C
              </p>
              <p className="wind">
                {
                  weather.properties.timeseries[0].data.instant.details
                    .wind_speed
                }{" "}
                m/s
              </p>
            </div>
          )}
        </section>
      </main>
      {error && <div className="error">{error}</div>}
      <footer>
        <div className="week_weather">
          {weatherData &&
            weatherData.map((item, index) => {
              return (
                <div key={index} className="day_weather">
                  <p className="day">{item.day}</p>
                  <p className="icon">{icon(item.icon)}</p>
                  <section className="data">
                    <p className="degrees">{item.temp}</p>
                    <p className="wind">{item.wind}</p>
                  </section>
                </div>
              );
            })}
        </div>
      </footer>
    </section>
  );
};

export default MainContent;
