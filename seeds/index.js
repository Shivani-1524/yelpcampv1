const mongoose = require('mongoose');
const cities = require('./cities');
const {places,descriptors} = require('./seedHelpers');
const Campground = require('../models/campground')

mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser:true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database Connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async()=>{
    await Campground.deleteMany({});
    for(let i=0; i<200; i++){
        const random1000 = Math.floor(Math.random()*1000);
        const price =  Math.floor(Math.random()*20)+10;
        const camp = new Campground({
            author:'608a60d67471522304a84b3c',
            location:`${cities[random1000].city}, ${cities[random1000].state}`,
            title:`${sample(places)}${sample(descriptors)}`,
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/ds9sho1ch/image/upload/v1619796763/YelpCamp/yqgjnf96t72yqu8oi19p.jpg',
                  filename: 'YelpCamp/yqgjnf96t72yqu8oi19p'
                },
                {
                  url: 'https://res.cloudinary.com/ds9sho1ch/image/upload/v1619796763/YelpCamp/aktxolg9ormqvwt2eivn.jpg',
                  filename: 'YelpCamp/aktxolg9ormqvwt2eivn'
                }
              ],
            description:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas, ad ea rem dolorem cupiditate necessitatibus officia architecto maxime commodi magni facere neque tenetur! Sunt deleniti officiis aliquam quisquam culpa iure.'
        })
        await camp.save()
    }
}

seedDB().then(()=>{
    mongoose.connection.close();
})