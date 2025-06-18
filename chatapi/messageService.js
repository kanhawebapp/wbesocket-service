
require('dotenv').config();
const axios = require('axios');
const url = require('./api');



async function insertData(data) {
   
const URL = url; 

    try {
 const response = await axios.post(`${URL}/chat/message`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = insertData;
