const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");


const PORT = process.env.PORT || 3000;

const db = require("./models")

const app = express();
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/testingdb"
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");


//scraping with axios and cheerio
app.get("/scrape", function(req,res){
  axios.get("https://www.buzzfeed.com/trending").then(function(response){
    const $ = cheerio.load(response.data)
    let titles = [];
    let links = [];
    let summaries = [];
    let images = [];
    //article headline
    $("h2.link-gray").each(function(i, element){
      title = $(element).text();
      titles.push(title);
    })
    //article link
    $("div.story-card").each(function(i, element){
      link = $(element).children("a").attr("href");
      links.push(link);
    })
    //article preview
    $("p.js-card__description").each(function(i, element){
      summary = $(element).text();
      summaries.push(summary);
    })
    //article images
    $("div.card__image").each(function(i, element){
      if($(element).attr("data-background-src")){
        image = $(element).attr("data-background-src");
        images.push(image);
      }
      else{
      image = $(element).attr("style");
      image = image.split("(\'");
      image = image[1].split("?");
      images.push(image[0]);
      }
    })
    //adding articles to db
    for(i = 0; i < titles.length; i++){
      let article = {};
      article.title = titles[i];
      article.link = links[i];
      article.summary = summaries[i];
      article.image = images[i];
      db.Article.create(article)
        .then(function(dbArticle){
          console.log(dbArticle);
        })
        .catch(function(err){
          console.log(err);
        })
    }
    // console.log(titles[0]);
    // console.log(links[0]);
    // console.log(summaries[0]);
    // console.log(images[0]);
    
    // console.log(titles[titles.length - 1]);
    // console.log(links[links.length - 1]);
    // console.log(summaries[summaries.length - 1]);
    // console.log(images[images.length - 1]);
    
    // console.log(titles);
    // console.log(links);
    // console.log(summaries);
    //console.log(images);
  }).then(function(){
  })
  homelink = "<a href='/'>Return Home</a>"
  res.send("Articles Scraped." + homelink +" to view.")
  
})

//viewing all articles
app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.render("all",{articles: dbArticle});
    })
    .catch(function(err) {
      res.json(err);
    });
});

//viewing one article
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comment")
    .then(function(dbArticle) {
      res.render("single", {article: dbArticle});
      console.log({article: dbArticle});
    })
    .catch(function(err) {
      res.json(err);
    });
});

//post route for adding comment
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(function(dbComment) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

/* -/-/-/-/-/-/-/-/-/-/-/-/- */

// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});