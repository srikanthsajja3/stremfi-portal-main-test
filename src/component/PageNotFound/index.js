import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from "../UserContext";
import './index.css'; // your custom styles

const PageNotFound = () => {
  const { user } = useContext(UserContext);

  const role = user?.role;
  let homePath = '/login';

  if (role === 'superadmin') {
    homePath = '/superadmin';
  } else if (role === 'admin') {
    homePath = '/admin';
  } else if (role === 'operator') {
    homePath = '/operator';
  } else {
    homePath = '/';
  }

  return (
    <div className="page-not-found">
      <img
        src="https://assets.ccbp.in/frontend/react-js/not-found-blog-img.png"
        alt="not found"
        className="not-found-img"
      />
      <p>Page Not Found</p>
      <Link to={homePath}>Go Back Home</Link>
    </div>
  );
};

export default PageNotFound;
