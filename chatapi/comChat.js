
require('dotenv').config();
const axios = require('axios');


async function comchat(data) {
    // const URL = 'http://127.0.0.1:8000/api'; 
    const URL = 'https://chat.dhwaniastro.co.in/api'; 
    try {

const response = await axios.post(`${URL}/chat/completed`, data);


return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}
module.exports = comchat;
