# **IC Eats: A review service for on campus dining**

A web app where you can review food from the dining halls. When you visit the website you can see a feed with all the recent/popular reviews and the current/upcoming menu. You can also leave a new review. When leaving a review you select the dining hall, the date, what meal it is for, and then select the food item from a list of what's currently on the menu. A review includes a picture of the food, a written description, and a star-rating on several criteria. You can leave a comment on a review, vote if it's good or not, and report it. Each user has a profile page showing all the reviews they have made. In addition, each dining hall has its own page where you can see overall statistics, the predicted quality of food based on past statistics, the current menu, and reviews sorted by new/votes/rating. You can also visit a page for each food item that shows stats, reviews, and when it will next appear in the menu. Some accounts are granted moderator permission, they can then view reported posts, delete any post, and ban users.


```mermaid
graph LR
  owner([Owner])
  mod([Moderator])
  user([User])
  

  subgraph System

    login_logout([Login/Logout])
    view_profile([View Profile])
    view_feed([View Feed])
    view_dining_hall([View Dining Hall])
    post_review([Post Review])
    post_comment([Post Comment])
    rate_review([Rate Review])
    delete_post([Delete Own Post])
    view_predictions([View Predicted Quality of Food])
    report_post([Report Post])
    search_food([Search and Filter Food])
    view_rating([View Food Place and average rating])

    %% Mod
    view_reported_posts([View Reported Posts])
    delete_any_post([Delete Any Post])
    ban_user([Ban User])

    %% Owner
    give_mod([Give Mod Privilege])

  end

  user --> login_logout
  user --> view_profile 
  user --> view_feed
  user --> view_dining_hall
  user --> post_review
  user --> rate_review
  user --> post_comment
  user --> delete_post
  user --> view_predictions
  user --> report_post
  user --> search_food
  user --> view_rating

  mod --> view_reported_posts
  mod --> ban_user
  mod --> delete_any_post

  owner --> give_mod

  owner --> mod
  mod --> user
```
[Also view on mermaid.live](eNptVF1v2jAU_SuWpUpMgg4oHyEPk7Z23R6o1lFtD4MpcvElWEts5Dh0rOK_79qOWQx7SXzux_H1vUf3la4VB5rSXLPdlswXK0mIepGgO8sv9vfzjbWUineWDxipmVGNra5s0LcqxKyk_Vb1s6d6OlQGSm8kpFC5kBl)