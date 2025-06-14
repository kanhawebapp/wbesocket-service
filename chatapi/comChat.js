
require('dotenv').config();
const axios = require('axios');


async function comchat(data) {
    try {
     
        const response = await axios.post(`${process.env.API_URL}/chat/completed`, data);

        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = comchat;
