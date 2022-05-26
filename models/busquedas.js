const fs  = require('fs');
const axios = require('axios');

class Busquedas {

    historial = [];
    dbPath = './db/database.json';

    constructor(){
        this.leerDB();
    }

    get historialCapitalizado(){
        return this.historial.map( lugar => {
            let palabras = lugar.split(' ');
            palabras = palabras.map( p => p[0].toUpperCase() + p.substring( 1 ) );
            return palabras.join(' ');
        })
    }

    get paramsMapbox(){
        return{
            'access_token': process.env.MAPBOX_KEY,
            'limit': '5',
            'language': 'es'
        }
    }

    get paramsOpenWeather(){
        return{
            appid: process.env.OPENWEATHER_KEY,
            units: 'metric',
            lang: 'es'
        }
    }

    async ciudades( lugar = '' ){
        // petición http
        const instance = axios.create({
            baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
            params: this.paramsMapbox
        });

        try{
            const resp = await instance.get();
            return resp.data.features.map( ciudad => ({
                id: ciudad.id,
                nombre: ciudad.place_name,
                lng: ciudad.center[0],
                lat: ciudad.center[1]
            }));
        }catch(error){
            console.log(error);
            return [];
        }
    }

    async climaLugar(lat, lon){
        try{
            //instance axios.create
            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: {...this.paramsOpenWeather, lat, lon}
            });
            const resp = await instance.get();
            const { weather, main } = resp.data;

            return {
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            };

        }catch(error){
            console.log(error);
            return [];
        }
    }

    agregarHistorial( lugar = '' ){
        
        if( this.historial.includes( lugar.toLocaleLowerCase() ) ){
            return;
        }

        this.historial = this.historial.splice(0, 5);
        
        this.historial.unshift( lugar.toLocaleLowerCase() );

        //Grabar en DB
        this.guardarDB();
    }

    guardarDB(){

        const payload = {
            historial : this.historial
        }

        fs.writeFileSync( this.dbPath, JSON.stringify(payload) );
    }

    leerDB(){
        if( fs.existsSync(this.dbPath) ){
            let info = fs.readFileSync(this.dbPath, { encoding: 'utf-8' });
            const data = JSON.parse( info );
            this.historial = data.historial;
        }
    }


}

module.exports = {
    Busquedas
}