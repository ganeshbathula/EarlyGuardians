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
  const [cityOptions, setCityOptions] = useState([]);
  const fetchDisasterInfo = async (city, country) => {
    //filter countries to get the country name
    const countryName = countries.find(c => c.code === country)?.name;
    console.log(`Fetching disaster info for ${city}, ${countryName}`);
    const res = await axios.post('http://localhost:5000/api/disaster-info', {
    city,
    countryName
     });
    alert(`Data for ${city}:\nTemperature: ${res.data.data.T2M["20250710"]}°C\nRainfall: ${res.data.data.PRECTOT["20250710"]}mm`);

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
    debounce((inputValue, callback, countryCode) => {
      if (!countryCode) {
        callback([]);
        setCityOptions([]);
        return;
      }
      // If no input, fetch basic cities for the selected country
      const params = {
        countryIds: countryCode,
        limit: 10
      };
      if (inputValue && inputValue.length >= 2) {
        params.namePrefix = inputValue;
        params.limit = 10; // Limit results to 10 for better performance
      }
      axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        headers: {
          'X-RapidAPI-Key': '9ae47a33famshf7d530901ff2e44p1b9ca9jsnb5facb76285d',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        },
        params
      }).then(res => {
        const options = res.data.data.map(city => ({
          label: city.name,
          value: city.name
        }));
        callback(options);
        setCityOptions(options);
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
            <Select
              options={countryOptions}
              value={countryOptions.find(opt => opt.value === selectedCountry) || null}
              onChange={option => {
                const country = option ? option.value : '';
                setSelectedCountry(country);
                setCityInput(''); // Reset city input when country changes
                debouncedLoadOptions('', () => { }, country);// Fetch basic info for the selected country

              }}
              placeholder="Select Country"
              // styles={{ container: base => ({ ...base, width: '50%' }) }}
              isSearchable
              isClearable
            />
          </div>
          <div className="col">
            {selectedCountry && (
              <AsyncSelect cacheOptions loadOptions={(inputValue, callback) => debouncedLoadOptions(inputValue, callback, selectedCountry)}
                defaultOptions={cityOptions}
                options={cityOptions}
                value={cityInput ? { label: cityInput, value: cityInput } : null}
                onChange={option => {
                  const city = option ? option.value : '';
                  setCityInput(city);
                  fetchDisasterInfo(city, selectedCountry);
                  if (!city) {
                    // Trigger basic city search when cleared
                    debouncedLoadOptions('', options => setCityOptions(options), selectedCountry);
                  }
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