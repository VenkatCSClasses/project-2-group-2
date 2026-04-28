# **IC Eats: A review service for on campus dining**

A web app where you can review food from the dining halls. When you visit the website you can see a feed with all the recent/popular reviews and the current/upcoming menu. You can also leave a new review. When leaving a review you select the dining hall, the date, what meal it is for, and then select the food item from a list of what's currently on the menu. A review includes a picture of the food, a written description, and a star-rating on several criteria. You can leave a comment on a review, vote if it's good or not, and report it. Each user has a profile page showing all the reviews they have made. In addition, each dining hall has its own page where you can see the current menu, and reviews sorted by new/votes/rating. You can also visit a page for each food item that shows stats, reviews, and when it will next appear in the menu. Some accounts are granted moderator permission, they can then view reported posts, delete any post, and ban users.


Go to the website at https://ic-eats.untitledham.com/ and leave a review!

## Diagrams, Documentation and Installation Instructions
- To view the diagrams please go to the [DIAGRAMS.md file](DIAGRAMS.md)
- To view the documentation please go to the [DOCUMENTATION.md file](DOCUMENTATION.md)
- To view installation instructions please go to the [INSTALL.md file](INSTALL.md)



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
- [**Sprint 2 Review**](https://docs.google.com/document/d/1KL6rkv4MW0a8b5-KF34KUUTz5c4iXRgHsZlXnkRVbjE/edit?usp=sharing)

To view the daily standup log please go to the [Daily Standup Log](https://docs.google.com/document/d/1Bd0j40ErMJcD9kVfZHUjiKydrN5h3AueoKfGCXfYuHg/edit?usp=sharing)

## Technologies Used:
- [Python 3.14](https://www.python.org/downloads/release/python-3144/) (Backend Language)
- [FastAPI](https://fastapi.tiangolo.com/) (Backend API Framework)
- [SQLAlchemy](https://www.sqlalchemy.org/) + [SQLModel](https://sqlmodel.tiangolo.com/) (ORM for database interactions)
- [PostgreSQL](https://www.postgresql.org/) (database)
- [Valkey](https://valkey.io/) (cache used for banned user tokens)
- [argon2-cffi](https://pypi.org/project/argon2-cffi/) (for password hashing)
- [React](https://react.dev/) (Frontend Framework)
- [TypeScript](https://www.typescriptlang.org/) (Frontend Language)
- [Vite](https://vitejs.dev/) (Frontend Build Tool)
- [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) (Styling)
- [Docker](https://www.docker.com/) (Containerization)

## LLM/Agent Usage:
- Agents were used to speed up frontend development and to write boilerplate code.
- Agents and LLM tools assisted with debugging and writing tests.
- Copilot autocomplete was also used.
