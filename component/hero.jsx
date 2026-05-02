"use client";

import React, { useEffect, useState } from "react";

const texts = ["Build Fast", "Design Better", "Grow Smarter"];

export default function Hero() {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);

        if (charIndex === currentText.length) {
          setIsDeleting(true);
        }
      } else {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);

        if (charIndex === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <section style={styles.hero}>
      {/* LEFT TEXT */}
      <div style={styles.left}>
        <h1 style={styles.title}>
          {displayText}
          <span style={styles.cursor}>|</span>
        </h1>
        <p style={styles.subtitle}>
          Create amazing apps with smooth UI and performance.
        </p>
        <button style={styles.button}>Get Started</button>
      </div>

      {/* RIGHT IMAGE */}
      <div style={styles.right}>
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
          alt="hero"
          style={styles.image}
        />
      </div>
    </section>
  );
}

const styles = {
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "60px 10%",
    minHeight: "100vh",
    flexWrap: "wrap",
  },
  left: {
    flex: 1,
    minWidth: "300px",
  },
  right: {
    flex: 1,
    textAlign: "center",
    minWidth: "300px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: "20px",
    fontSize: "18px",
    color: "#555",
  },
  button: {
    marginTop: "20px",
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "8px",
  },
  image: {
    width: "100%",
    maxWidth: "450px",
    borderRadius: "12px",
  },
  cursor: {
    marginLeft: "5px",
    animation: "blink 1s infinite",
  },
};