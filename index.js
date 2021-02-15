if(process.env.NODE_ENV !== "production") {
  module.exports = require('dotenv').config();
} else { // production mode
  module.exports = require('./keys_prod');
}

// console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const express   = require('express');
const exphbs    = require('express-handlebars');
const app       = express();
const biography = require('./Biography');
const multer    = require('multer'); // Where to store uploaded images etc. 
const PORT      = process.env.PORT || 80;
const vision    = require('@google-cloud/vision')    // Import Google Cloud Vision library
const client    = new vision.ImageAnnotatorClient()  // Create a client

// handlebars middleware
app.engine('handlebars', exphbs({ defaultLayout: 'main'})); // view engine is handlebars, file name layout = main.handlebars
app.set('view engine', 'handlebars'); 

// homepage route
app.get('/', (req, res) => { // get random person to display on index page
  var show_camera   = "display: inline";  // show camera option
  var show_person   = "display: none";    // hide bio
  var random_number = Math.floor(Math.random()*(9380)).toString(); // biography.length
  var url_exists    = biography.find((element) => element.url.includes(random_number));
  random_number     = (url_exists) ? random_number : 1; // Some urls might not exist 

  res.render('index', { // render index.handlebars
    show_camera,
    show_person,
    random_number
  });
});

// A person was found
app.get('/:id', (req, res) => {
  const id          = req.params.id; 
  const search_url  = `https://www.stolpersteine-berlin.de/de/biografie/${id}`;
  const person      = biography.find((element) => element.url.includes(search_url));
  if(person) {
    var name           = person.name;  
    var place          = person.place;
    var date           = person.date; 
    var sh_date        = (date == "") ? "display: none;" : "display: block;";
    var born           = person.born;  
    var deportation    = person.deportation;
    var sh_deportation = (deportation == "") ? "display: none" : "display: block;";
    var destiny        = person.destiny;  
    var description    = person.description;  
    var fotos          = person.foto_list; // [0], [1], ...
    var fotos_rechte   = person.foto_recht; // [0], [1], ...
    var url            = person.url;
    var show_camera    = "display: none";   // hide camera option
    var show_person    = "display: inline"; // show result
    
    res.render('index', { // render index.handlebars
        name,
        place,
        date,
        sh_date,
        born,
        deportation,
        sh_deportation,
        destiny,
        description,
        fotos,
        fotos_rechte,
        url,
        show_camera,
        show_person
      }
    )
  } else {
    res.redirect('/not-found');
  }
});

// storage 
const storage = multer.diskStorage( {
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    var extension         = file.originalname.split('.').pop();
    var random_image_name = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + "." + extension; // abDc132.[ext]
    cb(null, `${random_image_name}`); // file.originalname
  }
});
const upload = multer({storage}).single("stolperstein");

// user uploads img called from index.html
app.post('/', (req, res) => {
  upload(req, res, err => {
    var pathToImage  =  './public/uploads/x78fo9i7r9ptu0h1fwrlf.jpg'; // `./public/uploads/` + req.file.filename;
    imageCalculation();
    async function imageCalculation() {
      var person_id    = "";
      const data       = await recognizeImage(pathToImage); // -> Berechnet den Text auf dem Bild, auskommentieren, um billing zu entgehen
      const data_split = data.split("\n"); // Hier wohne \n VORNAME NACHNAME 
      var data_name    = word_uppercase(data_split[1]); // Vorname Nachname
      var found        = biography.find((element) => element.name.includes(data_name));
      if(!found) { // i.e. "Hier wohnte \n und arbeitete \n Vorname Nachname"
        data_name = word_uppercase(data_split[2]); // Vorname Nachname
        found     = biography.find((element) => element.name.includes(data_name));
      }
      if(found) { // get id, so we can redirect to that person
        const person_url = found.url; // "https://www.stolpersteine-berlin.de/de/biografie/3416
        const url_arr    = person_url.split("/"); 
        person_id        = url_arr[(url_arr.length)-1]; // Letztes Element ist die id
      }
      res.redirect(`/${person_id}`);
    }
  })
});

async function recognizeImage(pathToImage) {
  const [result] = await client.textDetection(pathToImage);
  const detections = result.textAnnotations;
  return detections[0].description;
}

// init body parser middleware
app.use(express.json()); 
app.use(express.urlencoded({extended:false}));
app.use(express.static('public')); // for the styles

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));

// ------------------------------------------------------------------------------------

// Every Word As Uppercase
function word_uppercase(str) {
  var str_arr = str.toLowerCase().split(' ');
  for (var i = 0; i < str_arr.length; i++) {
    str_arr[i] = str_arr[i].charAt(0).toUpperCase() + str_arr[i].substring(1);     
  }
  return str_arr.join(' '); // return the joined string
}
