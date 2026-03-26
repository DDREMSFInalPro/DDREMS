import React from 'react';
import './House3D.css';

function House3D() {
  return (
    <div className="house-3d-container">
      <div className="house-3d">
        <div className="house-roof"></div>
        <div className="house-front">
          <div className="house-door"></div>
          <div className="house-window house-window-left"></div>
          <div className="house-window house-window-right"></div>
        </div>
        <div className="house-side"></div>
        <div className="house-chimney"></div>
      </div>
      <div className="house-shadow"></div>
    </div>
  );
}

export default House3D;
