import React from 'react';
import { COLORS } from '../lib/colors';

const Loader = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <style jsx>{`
        .loader {
          width: 48px;
          height: 48px;
          border: 5px solid ${COLORS.surfaceHighlight};
          border-bottom-color: ${COLORS.primary};
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <span className="loader"></span>
    </div>
  );
};

export default Loader;
