import axios from 'axios';
import {url} from './api.js';



async function insertData(data) {
   
const URL = url; 

    try {
 const response = await axios.post(`${URL}/chat/message`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}


export {insertData};
