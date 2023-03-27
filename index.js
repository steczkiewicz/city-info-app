const app = {
  init: () => {
    document
      .getElementById("submit")
      .addEventListener("click", app.clickSubmit);
  },

  clickSubmit: async (ev) => {
    const city = document.getElementById("city").value.toLowerCase();
    const start_date = document.getElementById("from").value;
    const end_date = document.getElementById("to").value;
    const response = await fetch(`http://localhost:3000/${city}?start_date=${start_date}&end_date=${end_date}`);
    if (!response.ok) {
      const message = await response.text();
      console.log(message);
      return;
    }
    const data = await response.json();
    app.updateValues(data);
  },

  updateValues: (data) => {
    document.getElementById('name').textContent = data.city;
    document.getElementById('country').textContent = data.country;
    document.getElementById('time').textContent = data.time;
    document.getElementById('temperature').textContent = data.temperature;
    document.getElementById('max_temperature').textContent = data.max_temp;
    document.getElementById('min_temperature').textContent = data.min_temp;
    document.getElementById('wind').textContent = data.wind;
    document.getElementById('currency').textContent = data.currency;
    document.getElementById('currency_rate').textContent = data.curr_ratio;
    document.getElementById('currency_rate_max').textContent = data.curr_max;
    document.getElementById('currency_rate_min').textContent = data.curr_min;
    document.getElementById('curr_info').textContent = `USD/${data.currency} ratio:`;
    document.getElementById('curr_info_max').textContent = `USD/${data.currency} max ratio:`;
    document.getElementById('curr_info_min').textContent = `USD/${data.currency} min ratio:`;
    document.querySelector('img').setAttribute('src',data.image);
  }
  
};

app.init();

