import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "", size = "normal", textColor = "dark" }) => {
    const isSmall = size === "small";
    const isLarge = size === "large";

    const iconSize = isSmall ? '24px' : isLarge ? '48px' : '36px';
    const fontSize = isSmall ? '1.1rem' : isLarge ? '2rem' : '1.4rem';

    return (
        <div className={`d-flex align-items-center gap-2 ${className}`}>
            <div
                className="logo-icon-container shadow-sm p-1 rounded-3 bg-white d-flex align-items-center justify-content-center"
                style={{
                    width: iconSize,
                    height: iconSize,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid #eee'
                }}
            >
                <div
                    className="d-flex align-items-center justify-content-center text-white"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #E63946 0%, #D62828 100%)',
                    }}
                >
                    <i className="bi bi-gear-fill" style={{ fontSize: isSmall ? '0.7rem' : isLarge ? '1.5rem' : '1rem' }}></i>
                </div>
            </div>
            <div
                className="logo-text fw-bold ls-tight"
                style={{
                    fontSize: fontSize,
                    color: textColor === 'white' ? '#FFFFFF' : '#1A1A1A',
                    letterSpacing: '-0.5px'
                }}
            >
                Fix<span style={{ color: '#E63946' }}>Zone</span>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .ls-tight { letter-spacing: -0.02em; }
                .logo-icon-container { transition: transform 0.3s ease; }
                .logo-icon-container:hover { transform: rotate(15deg); }
                @keyframes spark {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default Logo;
