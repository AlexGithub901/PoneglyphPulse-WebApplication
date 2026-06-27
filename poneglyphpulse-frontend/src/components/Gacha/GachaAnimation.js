import React from 'react';
import { motion } from 'framer-motion';
import './Gacha.css';

function GachaAnimation() {
  return (
    <motion.div 
      className="gacha-animation-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="animation-container">
        <motion.div
          className="gacha-ball"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎲
        </motion.div>
        <motion.h2
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        >
          Summoning...
        </motion.h2>
      </div>
    </motion.div>
  );
}

export default GachaAnimation;
