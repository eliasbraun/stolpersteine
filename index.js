if(process.env.NODE_ENV !== "production") {
  module.exports = require('dotenv').config();
}

const express   = require('express');
const exphbs    = require('express-handlebars');
const app       = express();
const biography = require('./Biography_old');
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
  random_number     = (url_exists) ? random_number : 7998; // Some urls might not exist 

  res.render('index', { // render index.handlebars
    show_camera,
    show_person,
    random_number
  });
});

// a person was found
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
    var random_number = Math.floor(Math.random()*(9380)).toString(); // biography.length
    var url_exists    = biography.find((element) => element.url.includes(random_number));
    random_number     = (url_exists) ? random_number : 7998; // Some urls might not exist 
    
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
        show_person,
        random_number
      }
    )
  } else {
    var random_number = Math.floor(Math.random()*(9380)).toString(); // biography.length
    var url_exists    = biography.find((element) => element.url.includes(random_number));
    random_number     = (url_exists) ? random_number : 7998; // Some urls might not exist 
    res.render('not_found', { // render index.handlebars
      random_number
    });
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
    var pathToImage  =  `./public/uploads/` + req.file.filename;
    imageCalculation();
    async function imageCalculation() {
      var data  = await recognizeImage(pathToImage); //computes text on image
      var rows  = data.split('\n');
      rows.forEach(row => {
        var elements = row.split(" "); // to get first and last name 
        if(elements.length > 1 && !found) {
          var data_name    = '';
          elements.forEach(row_element => {
            data_name += row_element + " " // i.e. Dr. firstname lastname, or just firstname lastname 
          });
          data_name = data_name.substring(0, data_name.length - 1); // remove last space
          console.log(`looking for ${data_name}`)
          var found = biography.find((bio) => bio.name.includes(uc_first(data_name)));
          if(found) {
            const person_url = found.url; // i.e. "https://www.stolpersteine-berlin.de/de/biografie/3416
            const url_arr    = person_url.split("/"); 
            const person_id  = url_arr[(url_arr.length)-1]; // Letztes Element ist die id
            res.redirect(`/${person_id}`);
          }
        }
      });
    }
  })
});

async function recognizeImage(pathToImage) {
  const [result]    = await client.textDetection(pathToImage);
  const detections  = result.textAnnotations;

  return detections[0].description;
}

// init body parser middleware
app.use(express.json()); 
app.use(express.urlencoded({extended:false}));
app.use(express.static('public')); // for the styles

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));

// ------------------------------------------------------------------------------------

// Makes every word's first letter uppercase
function uc_first(str) {
  var str_arr = str.toLowerCase().split(' ');
  for (var i = 0; i < str_arr.length; i++) {
    str_arr[i] = str_arr[i].charAt(0).toUpperCase() + str_arr[i].substring(1);     
  }
  return str_arr.join(' '); // return the joined string
}
