const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect('mongodb+srv://admin-mairi:admin-user-pw-123@cluster0.cpzzi9s.mongodb.net/todolistDB')

//Item
const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("item", itemsSchema); //("kollektsiooni nimetus ainsuses", schema nimetus)

const item1 = new Item({name: "Welcome to todolist!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

//List
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

app.set("view engine", "ejs");



app.get("/", function(req, res){

  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Default items successfully inserted to database.");
        }
      });

      res.redirect("/");

    }else{
      //res.render("list", {listTitle: "Today", newListItems: foundItems});
      res.redirect("welcome");
    }
  });
});

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.get("/welcome", function(req, res){

  List.find({}, function(err, foundList){
    if(err){
      console.log(err);
    }else{
      res.render("welcome", {existingLists: foundList});
    }
  });
});

app.get("/:customListName", function(req, res){

  if(_.capitalize(req.params.customListName) !== "Favicon.ico"){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(err){
      console.log(err);
    }else{

      if(!foundList){

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      }else{

        List.find({}, function(err, listsFound){
          if(err){
            console.log(err);
          }else{

            const items = [];

            listsFound.forEach(function(listFound){
              if(listFound.name === customListName){
                listFound.items.forEach(function(item){
                  items.push(item);
                })
              }
            });
           res.render("list", {listTitle: customListName, newListItems: items, existingLists: listsFound});
          }
        });
      }
    }
  })
}
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({name: itemName});

  if(listName === "Today"){
    item.save();
    res.redirect("/");

  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      }else{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      }
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function(err){
      if(err){
        console.log(err);
      }else{
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if(err){
        console.log(err);
      }else{
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/welcome", function(req, res){
  const listName = req.body.newListTitle;

  res.redirect("/" + listName);
});


app.listen(3000, function(){
  console.log("Server is listening to you.");
});
