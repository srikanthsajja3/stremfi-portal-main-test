// PackDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from "../UserContext";
import { ASSET_BASE_URL } from "../../config/env";
import './index.css';

const PackDetails = (props) => {  
  const [operatorRole, setOperatorRole] = useState('');
  const [activePlatform, setActivePlatform] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const role = "operator";
    setOperatorRole(role);

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handlePlatformClick = (platform) => {
    if (isMobile) {
      setActivePlatform(activePlatform === platform ? null : platform);
    }
  };

  const handlePlatformHover = (platform) => {
    if (!isMobile) {
      setActivePlatform(platform);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActivePlatform(null);
    }
  };

  return (
    <div className='pack'>
      <h1 className='pack-name'>{props.planName}</h1>
      {operatorRole === 'superadmin' && (
        <button className="edit-btn-pack" onClick={(e) => {
          e.stopPropagation();
          if (props.onEdit) props.onEdit(); // ✅ Trigger edit handler
        }}>
          ✎
        </button>
      )}
      <h2 className='plan-duration'>Plan Duration: <strong className='duration'>{props.duration}</strong> Days</h2>
      <h2 className='plan-duration' data-plan-price="true">
        Plan Price: <strong className='price'>{props.showBlankPrice ? '____' : `Rs.${props.planPrice}`}</strong>
      </h2>
      <ul className='ott-items'>
        {props.ott?.map((eachOtt) => {
          const lowerOtt = eachOtt.toLowerCase();
          return (
            <li 
              key={eachOtt}
              className={`ott-item ${activePlatform === eachOtt ? 'active' : ''}`}
              onClick={() => handlePlatformClick(eachOtt)}
              onMouseEnter={() => handlePlatformHover(eachOtt)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="ott-image-container">
                <img 
                  src={`${ASSET_BASE_URL}/${lowerOtt}.png`} 
                  alt={eachOtt}
                  className="ott-image"
                />
                <div className="ott-name-tooltip">
                  {eachOtt}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PackDetails;