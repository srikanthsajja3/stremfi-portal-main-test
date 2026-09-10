// Announcementmodal-a.js
import React, { useEffect } from 'react';
import { FaTimes, FaStar, FaCrown } from 'react-icons/fa';

const AnnouncementModal = ({ onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.keyCode === 27) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="modal-a-overlay" onClick={onClose}>
      <div className="modal-a-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-a-decoration">
          <div className="decoration-star star-1"><FaStar /></div>
          <div className="decoration-star star-2"><FaStar /></div>
          <div className="decoration-star star-3"><FaStar /></div>
          <div className="decoration-crown"><FaCrown /></div>
        </div>
        
        
        <div className="modal-a-icon">🎉</div>
        
        <div className="modal-a-header">
          <h2>We've Rebranded!</h2>
        </div>
        
        <div className="modal-a-body">
          <p>
            We're now <span className="highlight-text">StremFi</span> — same great service, fresh new look!
          </p>
          <div className="package-badges">
            <div className="prime">
              <img src="/stremfi-logo.png" alt="StremFi" className='img-a' />
            </div>
          </div>
        </div>
        
        <div className="modal-a-footer">
          <button className="modal-a-confirm-btn" onClick={(onClose)}>
            <span className="highlight-text-hurray">Got it!</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-a-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(5px);
        }
        
        .modal-a-content {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 20px;
          padding: 2.5rem 2rem 2rem;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          position: relative;
          overflow: hidden;
          animation: modal-a-appear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        @keyframes modal-a-appear {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9) rotateX(-10deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0);
          }
        }

        .img-a{
          height: 100px;
          border-radius: 15px;
        }
        
        .modal-a-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }
        
        .decoration-star, .decoration-crown {
          position: absolute;
          color: rgba(120, 119, 216, 0.15);
          font-size: 1.5rem;
        }
        
        .decoration-star:nth-child(1) {
          top: 15%;
          left: 10%;
          animation: float 8s ease-in-out infinite;
        }
        
        .decoration-star:nth-child(2) {
          top: 65%;
          right: 12%;
          animation: float 10s ease-in-out infinite 1s;
        }
        
        .decoration-star:nth-child(3) {
          bottom: 20%;
          left: 15%;
          animation: float 9s ease-in-out infinite 0.5s;
        }
        
        .decoration-crown {
          top: 10%;
          right: 10%;
          color: rgba(255, 193, 7, 0.2);
          animation: float 12s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .modal-a-close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #6c757d;
          z-index: 10;
        }
        
        .modal-a-close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #495057;
          transform: rotate(90deg);
        }
        
        .modal-a-icon {
          font-size: 4rem;
          text-align: center;
          margin-bottom: 1rem;
          animation: bounce 1s ease;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-20px);}
          60% {transform: translateY(-10px);}
        }
        
        .modal-a-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .modal-a-header h2 {
          color: #4f46e5;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #4f46e5 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(79, 70, 229, 0.15);
        }
        
        .modal-a-body {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .modal-a-body p {
          color: #495057;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        
        .highlight-text {
          font-weight: 700;
          background: linear-gradient(135deg, #4f46e5 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
          display: inline-block;
        }
        
        .highlight-text:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(135deg, #4f46e5 0%, #8B5CF6 100%);
          border-radius: 2px;
        }
        
        .package-badges {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .modal-a-footer {
          display: flex;
          justify-content: center;
        }
        
        .modal-a-confirm-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #8B5CF6 100%);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .modal-a-confirm-btn:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: all 0.5s ease;
        }
        
        .modal-a-confirm-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
        }
        
        .modal-a-confirm-btn:hover:before {
          left: 100%;
        }
        
        .modal-a-confirm-btn:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(79, 70, 229, 0.3);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .modal-a-content {
            padding: 2rem 1.5rem 1.5rem;
            margin: 0.5rem;
            border-radius: 16px;
          }
          
          .modal-a-icon {
            font-size: 3.5rem;
          }
          
          .modal-a-header h2 {
            font-size: 1.5rem;
          }
          
          .modal-a-body p {
            font-size: 1rem;
          }

          .img-a{
            height: 60px
          }
          
          .package-badges {
            flex-direction: row;
            align-items: center;
          }
          
          .package-badge {
            width: 100%;
            max-width: 180px;
            text-align: center;
          }
          
          .modal-a-confirm-btn {
            padding: 0.875rem 2rem;
            font-size: 1rem;
          }
          
          .modal-a-close-btn {
            top: 1rem;
            right: 1rem;
            width: 2.25rem;
            height: 2.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementModal;