import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';

// Debounce utility
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}


function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [cityInput, setCityInput] = useState('');

  const fetchDisasterInfo = async (city, country) => {
    //filter countries to get the country name
    const countryName = countries.find(c => c.code === country)?.name;
    console.log(`Fetching disaster info for ${city}, ${countryName}`);
    // const res = await axios.post('http://localhost:5000/api/disaster-info', {
    //   city,
    //   country
    // });
    // alert(`Data for ${city}:\nTemperature: ${res.data.data.T2M["20250710"]}°C\nRainfall: ${res.data.data.PRECTOT["20250710"]}mm`);

  };

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,cca2")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data.map((country) => ({
          name: country.name.common,
          code: country.cca2,
          flag: country.flags.png,
        }));
        setCountries(countryList.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => console.error("Error fetching countries:", err));
  }, []);

  // Wrap loadOptions with debounce
  const debouncedLoadOptions = useCallback(
    debounce((inputValue, callback) => {
      if (!selectedCountry || inputValue.length < 2) {
        callback([]);
        return;
      }
      axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        headers: {
          'X-RapidAPI-Key': '9ae47a33famshf7d530901ff2e44p1b9ca9jsnb5facb76285d',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        },
        params: {
          countryIds: selectedCountry,
          namePrefix: inputValue,
          limit: 5
        }
      }).then(res => {
        const options = res.data.data.map(city => ({
          label: city.name,
          value: city.name
        }));
        callback(options);
      });
    }, 1000), // 1000ms = 1 second
    [selectedCountry]
  );

  const countryOptions = countries.map(c => ({
    value: c.code,
    label: c.name
  }));

  useEffect(() => {
    setCityInput('');
  }, [selectedCountry]);

  return (
    <div className='container' style={{ padding: 20 }}>
      <style>
        {`
        label{
          padding-right: 12px;
        }
        .city-input, .city-suggestions {
          width: 50%;
        }
        input.city-input {
        /* Optional: keep other input styles */
        padding: 8px;
        }
        ul.city-suggestions {
        margin-top: 0;
        padding-left: 0;
        list-style: none;
        }
      `}
      </style>
      <div className='text-center mb-4'>
        <h2>🌍 Disaster Early Warning System</h2>
      </div>
      <div className="container text-center align-items-center">
        <div className="row align-items-start">
          <div className="col">
            {/* <label>Select Country : </label> */}
            {/*<select style={{ width: '50%' }} onChange={(e) => setSelectedCountry(e.target.value)}>
              <option value="">--Choose--</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select> */}
            <Select
              options={countryOptions}
              value={countryOptions.find(opt => opt.value === selectedCountry) || null}
              onChange={option => setSelectedCountry(option ? option.value : '')}
              placeholder="Select Country"
              // styles={{ container: base => ({ ...base, width: '50%' }) }}
              isSearchable
              isClearable
            />
          </div>
          <div className="col">
            {selectedCountry && (
              <AsyncSelect cacheOptions loadOptions={debouncedLoadOptions} defaultOptions
                value={cityInput ? { label: cityInput, value: cityInput } : null}
                onChange={option => {
                  const city = option ? option.value : '';
                  setCityInput(city);
                  fetchDisasterInfo(city, selectedCountry);
                }}
                placeholder="Enter City Name"
                isClearable />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;