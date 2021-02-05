// Google API übersicht Abfragenmenge: https://console.cloud.google.com/apis/dashboard?project=stolpersteine-296816&supportedpurview=project&show=all
if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const express   = require('express');
const exphbs    = require('express-handlebars');
const app       = express();
const biography = require('./Biography');
const multer    = require('multer'); // Where to store uploaded images etc. 
const PORT      = 3000 || process.env.PORT;
const vision    = require('@google-cloud/vision')    // Import the Google Cloud Vision library
const client    = new vision.ImageAnnotatorClient()  // Create a client

// handlebars middleware
app.engine('handlebars', exphbs({ defaultLayout: 'main'})); // view engine is handlebars, file name layout = main.handlebars
app.set('view engine', 'handlebars'); 

// homepage route
app.get('/', (req, res) => {
  // get random person to display on index page
  var index   = Math.floor(Math.random()*(biography.length));
  var person  = biography[index];

  var name        = person.name;  
  var place       = person.place;  
  var date        = person.date;  
  var born        = person.born;  
  var deportation = person.deportation;  
  var destiny     = person.destiny;  
  var description = person.description;  
  var fotos       = person.foto_list; // [0], [1], ...
  var url         = person.url;
  var show_camera = "display: inline";  // show camera option
  var show_person = "display: none";    // hide bio

  res.render('index', { // render index.handlebars
    name,
    place,
    date, 
    born,
    deportation,
    destiny,
    description,
    fotos,
    url,
    show_camera,
    show_person
  })
});

// A person was found
app.get('/:id', (req, res) => {
  const id          = req.params.id; 
  const search_url  = `https://www.stolpersteine-berlin.de/de/biografie/${id}`;
  const person      = biography.find((element) => element.url.includes(search_url));
  if(person) {
    var name        = person.name;  
    var place       = person.place;  
    var date        = person.date;  
    var born        = person.born;  
    var deportation = person.deportation;  
    var destiny     = person.destiny;  
    var description = person.description;  
    var fotos       = person.foto_list; // [0], [1], ...
    var url         = person.url;
    var show_camera = "display: none";   // hide camera option
    var show_person = "display: inline"; // show result
    
    res.render('index', { // render index.handlebars
        name,
        place,
        date, 
        born,
        deportation,
        destiny,
        description,
        fotos,
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
    cb(null, file.originalname);
  }
});
const upload = multer({storage}).single("stolperstein");

// user uploads img called from index.html
app.post('/', (req, res) => {
  upload(req, res, err => {
    var pathToImage  = './public/uploads/' + req.file.originalname;
    imageCalculation();
    async function imageCalculation() {
      var person_id    = "";
      const data       = await recognizeImage(pathToImage); // -> Berechnet den Text auf dem Bild, auskommentieren, um billing zu entgehen
      const data_split = data.split("\n"); // Hier wohne \n VORNAME NACHNAME 
      const data_name  = word_uppercase(data_split[1]); // Vorname Nachname
      const found      = biography.find((element) => element.name.includes(data_name));
      if(found) { // get id, so we can redirect to that person
        const person_url = found.url; // "https://www.stolpersteine-berlin.de/de/biografie/3416
        const url_arr    = person_url.split("/"); 
        person_id        = url_arr[(url_arr.length)-1]; // Letztes Element ist die id
      }
      res.redirect(`/${person_id}`);
    }
  })
})

async function recognizeImage(pathToImage) {
  const [result] = await client.textDetection(pathToImage);
  const detections = result.textAnnotations;
  return detections[0].description;
}


// init body parser middleware
app.use(express.json()); 
app.use(express.urlencoded({extended:false}));

app.use('/api/members', require('./routes/api/members')); // All of the members API routes
app.use(express.static('public')); // for the styles

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));

// ---------------------------------------------------------------------------

// Every Word As Uppercase
function word_uppercase(str) {
  var str_arr = str.toLowerCase().split(' ');
  for (var i = 0; i < str_arr.length; i++) {
    str_arr[i] = str_arr[i].charAt(0).toUpperCase() + str_arr[i].substring(1);     
  }
  return str_arr.join(' '); // return the joined string
}