const axios = require('axios');


async function insertData(data) {
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/chat/message', data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = insertData;
