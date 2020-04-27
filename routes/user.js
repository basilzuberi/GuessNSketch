const express = require("express");
const { check, validationResult} = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/User");

router.post("/signup",
[
    check("username","please enter a valid username")
    .not()
    .isEmpty(),
    check("email","please enter a valid email").isEmail(),
    
    
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        username,
        email,
        password
    } = req.body;

    
    // console.log(req.body);
    // res.redirect('../public/game_room.html');
    try {
        let user = await User.findOne({
            email
        });
        if (user) {
            res.redirect("/signup");
            console.log("redirecting to the sign up page the user does exist");
        }

        user = new User({
            username,
            email,
            password
        });

        

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            "randomString", {
                expiresIn: 10000
            },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token
                });
            }
        );
        var str = __dirname.slice(0,67);
        var s = "\\";
        res.redirect('/game_page.html?user='+username);
        // console.log("this is the name of the dirc "+__dirname+'./public/game_page');
        // console.log(str+"public"+s+"game_page")
        // res.redirect(str+"public"+s+"game_page.html");
    } catch (err) {
        console.log("an error has happened in the registration");
        // console.log(err.message);
        res.status(500).send("Error in Saving");
    }
}
);

router.post("/login",
[
    check("username","please enter a valid username")
    .not()
    .isEmpty(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    try {
      let user = await User.findOne({
        username
      });
      if (!user){
        res.redirect("/")
        console.log("redirecting to the login page because user doesnt exists");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch){
        res.redirect("/");
        console.log("redirecting to the login page because password is not a match");
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "secret",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
      res.redirect('/game_page.html?user='+username);
    } catch (e) {
      console.log("an error has happened in the login");
      // console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }

);

router.post("/logout", function(req, res){
  res.redirect("/");
});
module.exports = router;
