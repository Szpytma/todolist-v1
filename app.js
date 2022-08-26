const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

const url = "mongodb://localhost:27017/todolistDB";
const port = 3000;

//Creating && connecting to the new db || Connectiong to the already created db
mongoose.connect(url);

// Creating a new collection in db
const itemsSchema = { name: String };
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome to your todolist" });
const item2 = new Item({ name: "Press + to add a new item" });
const item3 = new Item({ name: "<-- hit this to delete item" });

const defaultItems = [item1, item2, item3];

const listSchema = { name: String, items: [itemsSchema] };
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  });
});

//Add new item to the database
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Remove an item from the database
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Item with id " + checkedItemId + " was deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// Create an custom collection via dynamic route
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({ name: customListName, items: defaultItems });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

//Method to populate defaultItems inside db
let populateDefaultItems = function () {
  Item.insertMany(defaultItems, function (err) {
    if (!err) {
      console.log(defaultItems + " was added to DB");
    }
  });
};

populateDefaultItems();

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || port);
