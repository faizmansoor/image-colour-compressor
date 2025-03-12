import React from "react";

export const Footer = () => {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} Image Colour Compressor
        {" • "}
        <a href="" className="footer-link">
          Privacy Policy
        </a>
        {" • "}
        <a href="" className="footer-link">
          Terms of Use
        </a>
      </p>
    </footer>
  );
};
