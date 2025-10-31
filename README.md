# Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.

## Interview Exercise Spec

In [src/App.tsx](https://github.com/Bazaruto/interview-app/blob/master/src/App.tsx),
build a two-column layout that lists the posts on the left, and edits them on the right.

#### PLEASE NOTE

- Do not install any NPM packages for this exercise

- <span style="background-color: #b3d7fe">Styling can be very basic</span> (we don't want you to spend a lot of time on this exercise)

- This exercise is React only. Do not modify the functionality of the API.

### Post list

- The post list displays the post `title` and `body`. The `body` text should be truncated so as not to span multiple lines
- A checkbox that toggles whether to load deleted posts (it should trigger an API call when toggled). It should not load deleted posts by default (the posts have a `deleted` flag, i.e., they can be soft-deleted)
- A search input that filters the loaded posts when pressing enter (not as you type the query). The query should match on a post's `title`

### Post editor

- Selecting a post on the left-hand side populates the right-hand side
- The `title`, `body`, and `deleted` fields should be editable
- The `title` and `body` fields are required
- After submitting the form, the post list should reflect the changes, and the post should no longer be selected

### The API

You will use 2 endpoints:

- `GET /api/posts?include_deleted=false|true` to fetch the posts

- `PATCH /api/posts/:id` to update the selected post

#### PLEASE NOTE

Artificial random delays have been built into these two async methods, so response times vary randomly between 0 - 2 seconds. This means 2 things:

1. It is quite slow, so we should display "loading" or "submitting" indicators to the user
2. Calling `GET /api/posts?include_deleted=false|true` in quick succession can deliver responses out of chronological order

![posts](https://user-images.githubusercontent.com/747979/106150719-49670e00-6184-11eb-8c33-23f744b00a0e.png)
