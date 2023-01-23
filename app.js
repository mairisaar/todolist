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

const Item = mongoose.model("item", itemsSchema); //("collection name singular", schema name)

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


//set view engine
app.set("view engine", "ejs");


//root route get
app.get("/", function(req, res){

  Item.find({}, function(err, foundItems){
    //create default list items
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Default items successfully inserted to database.");
        }
      });

      res.redirect("/");
    //or show items of this list
    }else{
      //res.render("list", {listTitle: "Today", newListItems: foundItems});
      res.redirect("welcome");
    }
  });
});

//about route render with list of all lists for nav
app.get("/about", function(req, res){
  List.find({}, function(err, foundList){
    if(err){
      console.log(err);
    }else{
      res.render("about", {existingLists: foundList});
    }
  });
});

//welcome route render with list of all lists
app.get("/welcome", function(req, res){

  List.find({}, function(err, foundList){
    if(err){
      console.log(err);
    }else{
      res.render("welcome", {existingLists: foundList});
    }
  });
});

//ejs custom route for each list created or to be created
app.get("/:customListName", function(req, res){

  if(_.capitalize(req.params.customListName) !== "Favicon.ico"){ //do not create a list if browser loads favicon
  const customListName = _.capitalize(req.params.customListName); //list name capitalized from the url parameters

  List.findOne({name: customListName}, function(err, foundList){
    if(err){
      console.log(err);
    }else{

      if(!foundList){ //create a new list if it does not already exist

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      }else{ //if a requested list already exists find it

        List.find({}, function(err, listsFound){
          if(err){
            console.log(err);
          }else{ //if found the list render list page with the list data

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

//root route adding new item to a list
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

//delete items from list
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

//welcome create a new list or redirect to existing list
app.post("/welcome", function(req, res){
  const listName = req.body.newListTitle;

  res.redirect("/" + listName);
});

//port
let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

//listen
app.listen(port, function(){
  console.log("Server has started successfully.");
});
