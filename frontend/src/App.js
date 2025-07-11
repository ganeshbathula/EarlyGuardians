import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchCountries = async () => {
    const res = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/countries', {
        params: {
      limit: 10
    },
        headers: {
        'X-RapidAPI-Key': '9ae47a33famshf7d530901ff2e44p1b9ca9jsnb5facb76285d',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });
    setCountries(res.data.data);
  };

  const handleCityInput = async (value) => {
    setCityInput(value);
    if (value.length < 2 || !selectedCountry) return;

    const res = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      headers: {
        'X-RapidAPI-Key': '9ae47a33famshf7d530901ff2e44p1b9ca9jsnb5facb76285d',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      },
      params: {
        countryIds: selectedCountry,
        namePrefix: value,
        limit: 5
      }
    });
    setSuggestions(res.data.data.map(city => city.name));
  };

  const fetchDisasterInfo = async (city, country) => {
    const res = await axios.post('http://localhost:5000/api/disaster-info', {
      city,
      country
    });
    alert(`Data for ${city}:\nTemperature: ${res.data.data.T2M["20250710"]}°C\nRainfall: ${res.data.data.PRECTOT["20250710"]}mm`);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🌍 Disaster Early Warning System</h2>
      <label>Select Country:</label>
      <select onChange={(e) => setSelectedCountry(e.target.value)}>
        <option value="">--Choose--</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>

      {selectedCountry && (
        <>
          <br /><br />
          <label>Enter City:</label>
          <input
            value={cityInput}
            onChange={(e) => handleCityInput(e.target.value)}
          />
          <ul>
            {suggestions.map((city, index) => (
              <li key={index} onClick={() => {
                setCityInput(city);
                setSuggestions([]);
                fetchDisasterInfo(city, countries.find(c => c.code === selectedCountry)?.name);
              }}>
                {city}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;