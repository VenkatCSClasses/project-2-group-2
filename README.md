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
[Also view on mermaid.live](https://mermaid.live/edit#pako:eNptVF1v2jAU_SuWpUpMgg4oHyEPk7Z23R6o1lFtD4MpcvElWEts5Dh0rOK_79qOWQx7SXzux_H1vUf3la4VB5rSXLPdlswXK0mIepGgO8sv9vfzjbWUineWDxipmVGNra5s0LcqxKyk_Vb1s6d6OlQGSm8kpFC5kBl-VW06y7lFb-cO-WRC9gJesp1WG1FAZ_kdEXn0KIrYAPDGfY_HyMeFFDLPtqwompA7ZyGf0RIid6oymQab0Fk-IiALByL_WpUlSNME3HoUIrAHcGJYIDhj4FAARliizvLOAYK9JJbr7LXAxdoIJavTi50FOPlas0KYA1Ebcq_U6Z0adkqbhnvhQMRbAdPrbbZRdmBPDhAmObkXhQEdUbkS8C3YoNBQ9JLHgq3B5bA9jjsH4mNsmk-8uiIohTaJqwO4Kys8ZdEYXXnVWW-YPMT9eS8P0Tuemcy8wD4wSYLITvc7aXqUiz1kTp-f8GQrwy6KPeomh5ADkvuDpSS93rtIj5GjLUNy6bHyu7S2hBc5W1qL7C0FXcY32oscLUn9r9qTjOJb_mklsrc0cknmh-27hV1tOaIht91hVm3b2Zw9n9srzh2Gdm4vfUmBxbLSLi1Bl0xw3FKvbtFQs4USVjTFI2f614qu5BHjWG3U00GuaWp0DV2qVZ1vabphRYWo3nFs-51guJ_KELJj8odSJ5hre02TjaoBfatqaWg6c6E0faW_adob9kfX_WQwTaaD_uxmOu7SA00Hyex6htbRsJ_MkhGaj136x5EPrvvjyfBmNJkl4-k4GU5GoZyPXOBCDVeCQw9-I7vFfPwLMbvmvg)
## Sequence Diagram 1: Login and Register
```mermaid
sequenceDiagram
    actor User
    participant AuthPage as Frontend AuthPage
    participant AuthAPI as Backend /auth routes
    participant DB as Database
    participant PasswordHasher as Argon2 Password Hasher
    participant JWT as JWT Token Generator

    alt Login
        User->>AuthPage: Enter username and password
        User->>AuthPage: Click "Login"
        AuthPage->>AuthAPI: POST /auth/login
        AuthAPI->>DB: Find user by username
        DB-->>AuthAPI: User record / none

        alt User exists and password is correct
            AuthAPI->>PasswordHasher: Verify password hash
            PasswordHasher-->>AuthAPI: Valid
            AuthAPI->>JWT: Generate access token
            JWT-->>AuthAPI: JWT token
            AuthAPI-->>AuthPage: Success + access_token
            AuthPage->>AuthPage: Save token in localStorage
            AuthPage-->>User: Log in successful / continue into app
        else Invalid username or password
            AuthAPI-->>AuthPage: Error response
            AuthPage-->>User: Show "Auth failed" / invalid login message
        end

    else Register
        User->>AuthPage: Enter username, password, email
        User->>AuthPage: Click "Register"
        AuthPage->>AuthAPI: POST /auth/register
        AuthAPI->>DB: Check if username already exists
        DB-->>AuthAPI: Exists / available
        AuthAPI->>DB: Check if email already exists
        DB-->>AuthAPI: Exists / available

        alt Username/email available
            AuthAPI->>PasswordHasher: Hash password
            PasswordHasher-->>AuthAPI: password_hash
            AuthAPI->>DB: Insert new user
            DB-->>AuthAPI: New user saved
            AuthAPI->>JWT: Generate access token
            JWT-->>AuthAPI: JWT token
            AuthAPI-->>AuthPage: Success + access_token
            AuthPage->>AuthPage: Save token in localStorage
            AuthPage-->>User: Registration successful / continue to next page
        else Username or email already taken
            AuthAPI-->>AuthPage: Error response
            AuthPage-->>User: Show registration error message
        end
    end
```
[Also view on mermaid.live](https://mermaid.live/edit#pako:eNrlVttO20AQ_ZXRvtaQmNzAD0iEQEvVS9QAlapIaLEnyQpnN91dAyni3zvrS5KtE0DtY_OS2D5n5szlbPzEYpUgi5jBnxnKGAeCTzWfjyXQh8dWabgyqIvrBddWxGLBpYWTzM6GfIrADZxrJS3KZHVzO_xkeOHQfR7fOXCD0z3QKrNo6oRB32EH3PJbbrYEHHJjHpROPnAzQ-2wJ3qq5MHqARRP6syP3y8d3H1dKlIC71Gi5lTqWJZ1pxY-qakoL93HNWHv-LgqMIIzqlhDRrcln1MXqKBFmfkF1mkq4jsYsyI6WyMrSImmVkUw_Dq6LLrUSH01JYTAg34E54KSOyVwu1wpWoMH_b3NqE4TaIxdixoglcTxRmRXeo7AR2Gs8eoCYYBoxLVrgi_Hn0oE16jFZLmOMKP7PtdneEqveSqSXZlofFE1OWp_HKMxYN08fQbhvKBu7FtgVWBvWqOsCPuujH-zg7gxuJLI77HIAkJCqmKejmi_Vs6okYntuh65tXMUU2SeZCnNKCZ3CZkhPbAK-GKxDoKpQbiQ965T62Uk09Z3cWeVZ1ortxFmoaR5VeBoph5ogd0DmHCRYjJmpFGUGvJFhTlp94olv1dblkv-hlNar8qdbzBYsKooAJxT3jeYbJXk7T7TNV2-1U5nSKHFZMP4qUaeLEu_7HTdWWGnBvB7Es9vU3w1RV7mv8Svu9opbpRx6zpetrL73rFWL3i4ItzUne-XfUG7py1IfMh760P_KPZLCQJDPvvfTohiq6kmoXadE3RKSHy01HzPg854VxtnhL9glr-t5L84LvSmZMz520-I8gcL2FSLhEVWZxiwOWpSSpfsyUHGzM6Q_uBYRD8TnPAstc7iz0SjP_gfSs0rJr1cTGcsmnAqPWDZIqFNKN9wVhDKh_pUZdKyKOzmIVj0xB5Z1Ovt9w677bDbax8ddTqdw4AtCXPU3e-FvXaz1Wu3O4dh2HoO2K88abjfarYOmp1m2DrodcJ2txMwTATN9XPxlpW_bD3_Bokv7_Q)
## Sequence Diagram 2: Vote and Comment on a Post
```mermaid
sequenceDiagram
    actor User
    participant FeedPage as Frontend FeedPage
    participant VoteAPI as Backend vote_routes
    participant CommentAPI as Backend comments_routes
    participant Auth as Auth Middleware
    participant DB as Database

    alt Vote on post
        User->>FeedPage: Click upvote/downvote button
        FeedPage->>VoteAPI: POST /votes/{post_id}/vote?upvote=true/false
        VoteAPI->>Auth: Validate Bearer token
        Auth-->>VoteAPI: Current user
        VoteAPI->>DB: Find post by post_id
        DB-->>VoteAPI: Review record
        VoteAPI->>DB: Find existing vote by user on this post
        DB-->>VoteAPI: Existing vote / none

        alt No previous vote
            VoteAPI->>DB: Insert new Vote
        else Previous vote exists
            VoteAPI->>DB: Update Vote.is_upvote
        end

        VoteAPI->>DB: Count upvotes
        DB-->>VoteAPI: Upvote total
        VoteAPI->>DB: Count downvotes
        DB-->>VoteAPI: Downvote total
        VoteAPI-->>FeedPage: Return updated vote counts
        FeedPage->>FeedPage: Update post state
        FeedPage-->>User: Show new upvote/downvote totals
    else Add comment
        User->>FeedPage: Enter comment text
        User->>FeedPage: Click submit comment
        FeedPage->>CommentAPI: POST /comments/{post_id}/comment?comment=...
        CommentAPI->>Auth: Validate Bearer token
        Auth-->>CommentAPI: Current user
        CommentAPI->>DB: Find post by post_id
        DB-->>CommentAPI: Review record

        alt Comment text is valid
            CommentAPI->>DB: Insert new Comment
            DB-->>CommentAPI: Comment saved
            CommentAPI-->>FeedPage: Success + serialized comment
            FeedPage->>FeedPage: Append comment / refresh comment count
            FeedPage-->>User: Show new comment under post
        else Empty or invalid comment
            CommentAPI-->>FeedPage: Error response
            FeedPage-->>User: Show comment error message
        end
    end
```
[Also view on mermaid.live](https://mermaid.live/edit#pako:eNqVVttO4zAQ_RXLr1vahrYEIgGiLUg8sFvBwsOqEnKTobVo7KztAAXx7zt27m3D7uYliTNz5szl2PmgoYyABlTD7xRECFPOlorFc0HwYqGRitxrUNl7wpThIU-YMOQKIJqxJRCmyZWSwoCIysVd8wdp4GJ2ba3HLHy2xi-49KhkakDv2k9kHIMwWy5htqpb3S5Ss7IO7n7Do2gNr0zt4TMdW7MpM2zBNH7PE15nTIkUJJHaZKv2skU4ODsrEgzIZM3DZ5ImNoteJF-FfSCL1BgpKrfCHl3zCgRk9uPuJ-lZc937sFEeefTp3s8zuFOjUug9sbWGCil3RyCbW0Ae2JpHDEOOARNUxEisUGVujQ7qUSepUlg6kpbdbKJOxwG54lhjy4gsNiRnVtlOxw3AW3jh8EoUhFJFXyLCG9eGiyXJSrRxHGyJzYrrrTpvBblsuPaIkKJsVtGw75IkCsnIVDuz6usun2uBoQ0RSPyhYQpYbDKrw2S09Vdo94nrgF3scv2Yda-GKaI616bvRKa2G85Ft-Z_775jcw1bf41UjGA71rQY0ha0xnjfgkmVQH42w0yrqD4MpPcOd-WY18RNkTasXo_SHh2sngJyt5KvrhnbOnIU81CuNRdRqf4vRHmJ25Aq7IiBt78rWKeLmJtd7Fpy1V5UiLfYh2r6zZfO8_tpt9utwCqE_9VvPfZ-CTew_1XFddgtITfFNanVkqBaXyztpiZ2CNRENtku634KRRTNXqAdvdG9uzQMQWvyjWAwjqzeYc-EtI7pRZLUDhTcWRQ8KdCrcsUNewvQ7vwWXqmIsJfNLc3N72WcmA3B05QLV8L9VNuSvVQKXZFfIoWGf2JVMALnGmOpynO53JvyB9qhS8UjGthzp0NjUDGzr_TDmsypWUEMcxrgYwRPLF2bOZ2LT3TDo_SXlHHhiafyckUDd3J1aLZ35D8U5SpOMJbI7Vk08AYOgwYf9I0Gvt_1j4-G3pE_PDkZjUbHHbpBm5Ojru_5w_7AHw5Hx543-OzQdxfV6w76g8P-qO8NDv2RNzwadShEHH9abrK_Gvdz8_kHe5nMsg)
## Sequence Diagram 3: Submit a Food Review
```mermaid
sequenceDiagram
    actor User
    participant UploadPage as Frontend RatingUploadPage
    participant PlacesAPI as Backend /places
    participant ItemsAPI as Backend /items
    participant Auth as Auth Middleware
    participant ImageProcessor as Image Processing Utility
    participant DB as Database

    User->>UploadPage: Open review upload page
    User->>UploadPage: Search/select dining hall
    UploadPage->>PlacesAPI: GET /places/{place_name}
    PlacesAPI->>DB: Load dining hall and its food items
    DB-->>PlacesAPI: Dining hall + menu items
    PlacesAPI-->>UploadPage: Place info + food items

    User->>UploadPage: Select food item
    User->>UploadPage: Choose rating
    User->>UploadPage: Enter description
    User->>UploadPage: Optionally attach image
    User->>UploadPage: Click submit

    UploadPage->>UploadPage: Validate form fields

    alt Form validation fails
        UploadPage-->>User: Show validation errors
    else Form validation passes
        UploadPage->>ItemsAPI: POST /items/{item_id}/review
        ItemsAPI->>Auth: Validate Bearer token
        Auth-->>ItemsAPI: Current user
        ItemsAPI->>DB: Find food item by item_id
        DB-->>ItemsAPI: Food item
        ItemsAPI->>DB: Find user by token user_id
        DB-->>ItemsAPI: User

        alt Image included
            ItemsAPI->>ImageProcessor: Process and save image
            ImageProcessor-->>ItemsAPI: image_path
        else No image
            ItemsAPI->>ItemsAPI: Continue without image
        end

        ItemsAPI->>DB: Insert new Review
        DB-->>ItemsAPI: Review saved
        ItemsAPI->>DB: Refresh food item reviews
        DB-->>ItemsAPI: Updated review list
        ItemsAPI->>ItemsAPI: Calculate average rating
        ItemsAPI->>DB: Update FoodItem.average_rating
        DB-->>ItemsAPI: Food item updated

        ItemsAPI-->>UploadPage: Review submitted successfully
        UploadPage->>UploadPage: Reset or update form state
        UploadPage-->>User: Show success message
    end
```
[Also view on mermaid.live](https://mermaid.live/edit#pako:eNqNVslu2zAQ_RWC1zpxXNtxokOAOm6KAF2CpOmhMBAw4tgiSpEql6Sp4X_vkJIlWV5QXySR783yZjjmiqaaA02ohd8eVAozwZaG5XNF8MdSpw15tGDK74IZJ1JRMOXIYyE143dsCYRZcmO0cqA4uWdOqGWzuUu8kywF--HuNvCmLP0VaP0iru6ibx3kO2ARFnexH7zLAi4-vwjOJbwysyeE2xwjuzMaPVpMEClxhVRLmAB5dEIK97bLnU0DfsYce2YWbZeIoNHJ1VWTd0K-FaCIgRcBr8THdbSzEWQP_gGYSbO-BQmpI1yoEEbGpKwYNRR5tYYJ-fTx-0a9_io-nxTLYV2yaiCSZtOEfA5htGwThnoKZ8lC6_BS6zqbnmz7mbVI70gOyrfhjZ9OVnGDCLXQyGo7OaJDFKDGHgReZ1pbICZ23EHUR-xLQzjY1IjCCX2sYGEb83sjzDmWZkTkxwp2LUX6i1j_nAtX59OuUhv8g0nBmQPMy-RkIUDyWgQmHbkJyy8lCKMgCyZkpW3HbjCMwaBQmX5tU8AYbSoOSFSma7Ng1sJ-o1dXm4OGJfv28L06Y_1VeDwJvu6XndyQN3ikhvPWynCKjYySO42HtcEH0MmWn2tvDOCJ8vV86dgNDXsjsEHrXiDPb6SKqGGUrdrYvdnunENGg9tgL8YZv45aLadgsx-KVk4NoVLpObS4HZfb4ybZjJl49ix7gXaf1fQtznYoEf5UMJc1nFjwr3qvqVYkjfg4r4XyQF6Fy7R3XSLO2Xa2HQFvFarhiMLRdt_pi65u5X7Mkx-0dw8LAzZrFbpsN3ukHkVoNr6ZsFJYt9d8K2UmUy9Dh2IsJlSuPTr2RFW6iP0Udk4r2lOXdrABce7HIPcq2RkQG53iOAmJWZ-G4i88DqQDZ3abb8ER_DcrfZZzxjp8_Y8pUvnCsW5t3QbYArRHl0ZwmjjjoUdzMDkLn3QVIHPqMshhThN85bBgXro5nas10vC_8qfW-YZptF9mNFkwbNMeLUOsrhr1Kg4DDuZae-VoMhhGGzRZ0T80mUxOJxfno8H5ZHR5OR6PL3r0DTGX56eTwWR0NpyMRuOLwWC47tG_0evgdHg2fH82PhsM30_Gg9H5uEeBC7zOfCnvO_Has_4HIjnoVQ)

[Daily Standup Log](https://docs.google.com/document/d/1Bd0j40ErMJcD9kVfZHUjiKydrN5h3AueoKfGCXfYuHg/edit?usp=sharing)


## Team Roles:
- **Abe Manfra** (Scrum Master/Developer)
- **Finn Witherup** (Project Owner/Developer)
- **Atticus Sandmann** (Developer)
- **Harrison Spangler** (Developer)


## Scrum Backlog:
*Open issues are in progress, closed issues are completed. Issues are tagged with the relevant sprint and/or feature.*
- [**Sprint 1**](https://github.com/VenkatCSClasses/project-2-group-2/milestone/1)
- [**Sprint 1 Review**](https://docs.google.com/document/d/1z2bGQjv06aU-17aqmoSdHR2nd6OT3dNAeKe7ZxNtBM8/edit?usp=sharing)
- [**Sprint 2**](https://github.com/VenkatCSClasses/project-2-group-2/milestone/2)
