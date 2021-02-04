const express   = require('express');
const router    = express.Router();
const biography = require('../../Biography');


// get single member
router.get('/', (req, res) => {
    res.json(members.filter(member => member.id === parseInt(req.params.id)));    
    res.status(400).json({msg: `No member with the if of ${req.params.id}`});
    res.redirect('/');  // When POST from form: just reload 
});


module.exports = router;