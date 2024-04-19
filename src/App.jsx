import React, { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [joinData, setJoinData] = useState([]);

  const handleFileRead = async (event) => {
    const file = event.target.files[0];
    const text = await file.text();
    parseChatLog(text);
  };

  const parseChatLog = (text) => {
    // Updated regex to capture both names and phone numbers
    const regex =
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}), \d{1,2}:\d{2}:\d{2}\s[AP]M\] ~\s([^:]+?):.*?\2 joined using this group's invite link/g;
    let matches;
    const results = [];

    while ((matches = regex.exec(text)) !== null) {
      results.push({
        date: matches[1],
        name: matches[2].trim(), // Capturing either a name or a phone number
      });
    }

    setJoinData(results);
  };

  return (
    <>
      <div>
        <input type="file" onChange={handleFileRead} accept=".txt" />
        <div>
          {joinData.map((data, index) => (
            <div key={index}>
              {data.date} - {data.name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
