import './App.scss';

/*
  We've setup a mock API server that can be interacted with fetch:
  "GET /api/posts?include_deleted=false|true" to fetch the posts
  "PATCH /api/posts/:id" to update the selected post
*/

export default function App() {
  return (
    <div className="app">
      <p>TODO: Posts app</p>
    </div>
  );
}
