# Documentation for IC Eats

For installation instructions please refer to [INSTALL.md](INSTALL.md).


Accessing the website from the browser at https://ic-eats.untitledham.com
Or alternatively, if you have the project running locally, access it at http://localhost:5173.


Upon accessing the page you will be greeted with a login/register page.

![login](images/login.png)

# User Guide

You can register a new account by clicking on register and filling out the form.
![register](images/register.png)
Please use a valid email address and a strong password when registering.

Feel free to upload a profile picture here (but it's not required):
![Upload a pfp](images/pfp.png)

![Set a pfp](images/pfpset.png)

Hit either "skip for now" or upload a picture and click "Save Picture" to continue to the main page.


You will now be met with the main page where you can see a feed of reviews from other users.
![Feed](images/feed.png)

Lets leave a review, click on the plus button in the bottom right to open the review form (or click on the respective item on the side bar)


Choose what dining hall you want to review an item from
![Make a choice](images/dininghallchoice.png) 

Use the search bar to find the item you want to review, then click on it to select it.
![alt text](image.png)

Now leave a star rating and a comment about the item. Also optionally upload a picture of the item you reviewed.
![Review form](images/review_form.png)

Now hit "Submit Rating" and your review will be posted to the feed for everyone to see!
![Everyone can see your review](images/leftreview.png)

Now lets look at some other reviews

Find a review and upvote it or downvote it by clicking on the respective buttons.
![Upvote](images/upvote.png)
You can also comment on other reviews by clicking the comment button and leaving a comment.
![Comment](images/comment.png)

If you just want to see reviews for a specific dining hall, click on the dining hall review page in the sidebar and select the dining hall you want to see reviews for.
![Dining hall reviews](images/dininghallreviews.png)

![Dining hall reviews page](images/dininghallreviewspage.png)
From here you can filter by star rating to find the best or worst items at that dining hall, or just scroll through all the reviews to see what people are saying about the food.

If you want to see your own profile and reviews, go back to the main feed page by clicking the back arrow.
![alt text](images/backarrow.png)
Now click on your profile picture in the top right and click "Profile" to go to your profile page.
![Profile](images/profile.png)

Here you can see all the reviews you have left, as well as your profile information. You can also edit your profile information by clicking on the respective edit buttons.
![Edit your profile](images/profilepage.png)

Lets edit your username, click on the edit button next to your username to edit it.
![Edit Username](images/edit_username.png)
Hit save and your username will be updated!
![Updated Username](images/updated_username.png)

You can do the same for your email, password and profile picture by clicking on the respective edit buttons and following the same process.

Lets view someone else's profile, go back to the main feed  (by hitting the back arrow) and click on someone else's profile picture.
![Someone else's pfp](images/someone_else_pfp.png)

You can see their past reviews and some profile information from this screen.
![alt text](images/someone_else_profile.png)

This is not a review, so lets report it by clicking the report button on the review.
![Report a review](images/report.png)

Fill in your report and click submit to report the review to the moderators.
![Leave a report](images/leave_report.png)

# Admin/Moderator Guide
A admin or moderator user has special permissions that allow them to manage the content on the website. You can log in as the default admin user with the following credentials:
- Username: root 
- Password: root

Note: It is highly recommended to change the default admin password after logging in for the first time.

Also these credentials were changed for the hosted version and only apply to local installations.

Lets look at the reports that have been left by users.
Click on your pfp in the top right and click on "Reported Posts" to access the reported posts page. This page is only accessible to admins and moderators.
![Reported Posts Button](images/reported_posts.png)

From here you can see all reported posts and the reasons underneath them.
![Reported Posts Page](images/reported_posts_page.png)
Click on delete post to delete the review, clear reports to clear the reports to remove all reports on the review, or ban user to ban the user who left the review (this will also delete all their reviews and comments).

From the feed page you can also click the 3 dots and remove any review or comment without having to go to the reported posts page.
![Remove Review](images/remove_review.png)

Moderators can do the above actions, but they cannot set the role of users, only admins can do that. To set the role of a user, go to their profile and use the role dropdown to set their role to either user, moderator or admin.
![Set Role](images/set-role.png)
