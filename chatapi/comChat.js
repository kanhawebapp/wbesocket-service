
require('dotenv').config();
const axios = require('axios');


async function comchat(data) {
    try {

        const URL = 'https://chat.dhwaniastro.co.in/api'; 
     
        const response = await axios.post(`${URL}/chat/completed`, data);

        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = comchat;
