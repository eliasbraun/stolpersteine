const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();
const members = require('./Members');


// init middleware
// app.use(logger)

// handlebars middleware
app.engine('handlebars', exphbs({ defaultLayout: 'main'})); // view engine is handlebars, file name layout = main.handlebars
app.set('view engine', 'handlebars'); 

// homepage route
app.get('/', (req, res) => 
    res.render('index', {
        title: 'Members App',
        members
    })
); // render the index view

// init body parser middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// set static folder
app.use(express.static(path.join(__dirname, 'public'))); // public as static folder

// All of the members API routes
app.use('/api/members', require('./routes/api/members'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));